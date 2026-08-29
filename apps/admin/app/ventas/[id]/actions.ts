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
