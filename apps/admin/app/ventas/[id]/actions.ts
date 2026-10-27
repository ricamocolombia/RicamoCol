"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { sendOrderStatusEmail } from "../../../lib/orderEmails";

const VALID_STATUSES = [
  "pendiente",
  "confirmado",
  "en_produccion",
  "enviado",
  "entregado",
  "cancelado",
] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];
function isOrderStatus(value: string): value is OrderStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

const VALID_PAYMENT_STATUSES = [
  "pendiente",
  "comprobante_pendiente",
  "anticipo_pagado",
  "pagado",
  "reembolsado",
] as const;
type PaymentStatus = (typeof VALID_PAYMENT_STATUSES)[number];
function isPaymentStatus(value: string): value is PaymentStatus {
  return (VALID_PAYMENT_STATUSES as readonly string[]).includes(value);
}

const VALID_SHIPPING_TYPES = ["nacional", "local"] as const;
type ShippingType = (typeof VALID_SHIPPING_TYPES)[number];
function isShippingType(value: string): value is ShippingType {
  return (VALID_SHIPPING_TYPES as readonly string[]).includes(value);
}

const VALID_SHIPPING_PAYMENT_STATUSES = ["contraentrega", "pagado"] as const;
type ShippingPaymentStatus = (typeof VALID_SHIPPING_PAYMENT_STATUSES)[number];
function isShippingPaymentStatus(value: string): value is ShippingPaymentStatus {
  return (VALID_SHIPPING_PAYMENT_STATUSES as readonly string[]).includes(value);
}

function fail(id: string, message: string): never {
  redirect(`/ventas/${id}?error=${encodeURIComponent(message)}`);
}

// Cambia el estado del pedido (linea de tiempo: pendiente -> confirmado ->
// en_produccion -> enviado -> entregado, con la posibilidad de cancelar
// desde cualquier estado no terminal, o reactivar un pedido cancelado).
// No revierte automaticamente transacciones/cuentas por cobrar o pagar ya
// generadas -- si un pedido pagado se cancela, esos movimientos financieros
// hay que ajustarlos a mano en Bancos/Cuentas por cobrar/Cuentas por pagar.
export async function updateOrderStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();

  if (!id) {
    redirect(`/ventas?error=${encodeURIComponent("Venta inválida")}`);
  }
  if (!isOrderStatus(statusRaw)) {
    fail(id, "Estado inválido");
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("orders").update({ status: statusRaw }).eq("id", id);

  if (error) {
    fail(id, "No se pudo actualizar el estado: " + error.message);
  }

  // "pendiente" solo se usa para reactivar un pedido cancelado -- es una
  // correccion interna del admin, no un hito que le avisemos al cliente.
  if (statusRaw !== "pendiente") {
    await sendOrderStatusEmail(id, statusRaw);
  }

  redirect(`/ventas/${id}`);
}

// Aprueba un pedido con comprobante_pendiente: registra el ingreso en
// Bancos (mismo patron que el bloque de pago de ventas/nueva/actions.ts),
// marca el pago como pagado y avanza el pedido a confirmado -- nunca se
// asume el pago, siempre requiere que el admin elija el banco y confirme
// el monto visto en el comprobante.
export async function aprobarComprobante(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const bankAccountId = String(formData.get("bank_account_id") ?? "").trim();
  const amountReceivedRaw = String(formData.get("amount_received_cop") ?? "").trim();

  if (!id) {
    redirect(`/ventas?error=${encodeURIComponent("Venta inválida")}`);
  }
  if (!bankAccountId) {
    fail(id, "Elige el banco donde entró el pago");
  }
  const amountReceived = Number.parseInt(amountReceivedRaw, 10);
  if (!Number.isFinite(amountReceived) || amountReceived <= 0) {
    fail(id, "El monto recibido debe ser un número mayor a 0");
  }

  const supabase = createServiceRoleClient();

  const { data: order, error: orderFetchError } = await supabase
    .from("orders")
    .select("id, customer_id, total_cop, payment_status, status")
    .eq("id", id)
    .maybeSingle();

  if (orderFetchError || !order) {
    fail(id, "No se encontró el pedido");
  }
  if (order.payment_status !== "comprobante_pendiente") {
    fail(id, "Este pedido ya no tiene un comprobante pendiente de validar");
  }

  // Primero se "reclama" el pedido con un update condicional: si dos
  // pestanas (o un doble clic) aprueban a la vez, solo una encuentra el
  // pedido todavia en comprobante_pendiente -- la otra no registra nada, asi
  // el ingreso nunca queda duplicado en Bancos.
  const pending = order.total_cop - amountReceived;
  const nextStatus = order.status === "pendiente" ? "confirmado" : order.status;
  const nextPaymentStatus = pending > 0 ? "anticipo_pagado" : "pagado";

  const { data: claimed, error: updateError } = await supabase
    .from("orders")
    .update({ payment_status: nextPaymentStatus, status: nextStatus })
    .eq("id", id)
    .eq("payment_status", "comprobante_pendiente")
    .select("id");

  if (updateError) {
    fail(id, "No se pudo actualizar el pedido: " + updateError.message);
  }
  if (!claimed || claimed.length === 0) {
    fail(id, "Este comprobante ya fue validado o rechazado (¿se envió dos veces?)");
  }

  const { error: transactionError } = await supabase.from("transactions").insert({
    bank_account_id: bankAccountId,
    type: "ingreso",
    category: "Venta",
    amount_cop: amountReceived,
    description: "Venta — pago por transferencia (web)",
    reference_order_id: id,
  });

  if (transactionError) {
    // Devuelve el pedido a pendiente de validar para poder reintentar.
    await supabase
      .from("orders")
      .update({ payment_status: "comprobante_pendiente", status: order.status })
      .eq("id", id);
    fail(id, "No se pudo registrar el pago en Bancos: " + transactionError.message);
  }

  if (pending > 0 && order.customer_id) {
    const { error: receivableError } = await supabase.from("accounts_receivable").insert({
      customer_id: order.customer_id,
      order_id: id,
      amount_cop: pending,
      notes: "Saldo pendiente de pedido web pagado por transferencia",
    });
    if (receivableError) {
      fail(
        id,
        "El pago se registró pero no se pudo crear la cuenta por cobrar del saldo pendiente: " +
          receivableError.message
      );
    }
  }

  if (nextStatus !== order.status) {
    await sendOrderStatusEmail(id, "confirmado");
  }

  redirect(`/ventas/${id}`);
}

export async function rechazarComprobante(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const rejectionReason = String(formData.get("rejection_reason") ?? "").trim();

  if (!id) {
    redirect(`/ventas?error=${encodeURIComponent("Venta inválida")}`);
  }

  const supabase = createServiceRoleClient();

  const { data: order } = await supabase.from("orders").select("notes").eq("id", id).maybeSingle();

  const noteLine = `Comprobante rechazado${rejectionReason ? `: ${rejectionReason}` : ""}`;
  const notes = [order?.notes, noteLine].filter(Boolean).join("\n");

  // Condicional: desde una pestana vieja no se puede "rechazar" un
  // comprobante que ya se aprobo (dejaria el pedido sin pagar con el
  // ingreso ya registrado en Bancos).
  const { data: rejected, error } = await supabase
    .from("orders")
    .update({ payment_status: "pendiente", notes })
    .eq("id", id)
    .eq("payment_status", "comprobante_pendiente")
    .select("id");

  if (error) {
    fail(id, "No se pudo rechazar el comprobante: " + error.message);
  }
  if (!rejected || rejected.length === 0) {
    fail(id, "Este comprobante ya fue validado o rechazado");
  }

  await sendOrderStatusEmail(id, "comprobante_rechazado");

  redirect(`/ventas/${id}`);
}

function failEdit(id: string, message: string): never {
  redirect(`/ventas/${id}/editar?error=${encodeURIComponent(message)}`);
}

export async function actualizarVenta(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const paymentStatusRaw = String(formData.get("payment_status") ?? "").trim();
  const paymentMethod = String(formData.get("payment_method") ?? "").trim();
  const courierId = String(formData.get("courier_id") ?? "").trim();
  const shippingTypeRaw = String(formData.get("shipping_type") ?? "").trim();
  const shippingPaymentStatusRaw = String(
    formData.get("shipping_payment_status") ?? ""
  ).trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id) {
    redirect(`/ventas?error=${encodeURIComponent("Venta inválida")}`);
  }
  if (!isPaymentStatus(paymentStatusRaw)) {
    failEdit(id, "Estado de pago inválido");
  }
  if (shippingTypeRaw && !isShippingType(shippingTypeRaw)) {
    failEdit(id, "Tipo de envío inválido");
  }
  if (shippingPaymentStatusRaw && !isShippingPaymentStatus(shippingPaymentStatusRaw)) {
    failEdit(id, "Estado de pago del domicilio inválido");
  }

  const paymentStatus: PaymentStatus = paymentStatusRaw as PaymentStatus;
  const shippingType: ShippingType | null = shippingTypeRaw
    ? (shippingTypeRaw as ShippingType)
    : null;
  const shippingPaymentStatus: ShippingPaymentStatus | null = shippingPaymentStatusRaw
    ? (shippingPaymentStatusRaw as ShippingPaymentStatus)
    : null;

  const supabase = createServiceRoleClient();

  // "Comprobante por validar" solo lo pone el checkout web: volver a ponerlo
  // a mano permitiria aprobar el mismo pago dos veces (ingreso duplicado).
  if (paymentStatus === "comprobante_pendiente") {
    const { data: current } = await supabase
      .from("orders")
      .select("payment_status")
      .eq("id", id)
      .maybeSingle();
    if (current?.payment_status !== "comprobante_pendiente") {
      failEdit(id, "Ese estado de pago solo lo asigna el checkout web");
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      payment_method: paymentMethod || null,
      courier_id: courierId || null,
      shipping_type: shippingType,
      shipping_payment_status: shippingPaymentStatus,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    failEdit(id, "No se pudo actualizar la venta: " + error.message);
  }

  redirect(`/ventas/${id}`);
}
