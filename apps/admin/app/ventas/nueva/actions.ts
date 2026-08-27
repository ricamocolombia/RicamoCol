"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

const VALID_SOURCES = [
  "web_catalogo",
  "web_personalizado",
  "whatsapp",
  "manual",
] as const;
type OrderSource = (typeof VALID_SOURCES)[number];
function isOrderSource(value: string): value is OrderSource {
  return (VALID_SOURCES as readonly string[]).includes(value);
}

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

function fail(message: string): never {
  redirect(`/ventas/nueva?error=${encodeURIComponent(message)}`);
}

export async function crearVenta(formData: FormData) {
  const supabase = createServiceRoleClient();

  const existingCustomerId = String(formData.get("customer_id") ?? "").trim();

  const newCustomerName = String(formData.get("new_customer_name") ?? "").trim();
  const newCustomerPhone = String(formData.get("new_customer_phone") ?? "").trim();
  const newCustomerEmail = String(formData.get("new_customer_email") ?? "").trim();

  const source = String(formData.get("source") ?? "manual");
  const status = String(formData.get("status") ?? "pendiente");
  const paymentStatus = String(formData.get("payment_status") ?? "pendiente");
  const paymentMethod = String(formData.get("payment_method") ?? "").trim();
  const courierId = String(formData.get("courier_id") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const itemDescription = String(formData.get("item_description") ?? "").trim();
  const itemQuantityRaw = String(formData.get("item_quantity") ?? "1");
  const itemUnitPriceRaw = String(formData.get("item_unit_price_cop") ?? "0");

  const itemQuantity = Number.parseInt(itemQuantityRaw, 10);
  const itemUnitPrice = Number.parseInt(itemUnitPriceRaw, 10);

  if (!isOrderSource(source)) {
    fail("Origen inválido");
  }
  if (!isOrderStatus(status)) {
    fail("Estado inválido");
  }
  if (!isPaymentStatus(paymentStatus)) {
    fail("Estado de pago inválido");
  }
  if (!itemDescription) {
    fail("La descripción del producto/servicio es obligatoria");
  }
  if (!Number.isFinite(itemQuantity) || itemQuantity < 1) {
    fail("La cantidad debe ser un número mayor a 0");
  }
  if (!Number.isFinite(itemUnitPrice) || itemUnitPrice < 0) {
    fail("El precio unitario debe ser un número válido");
  }

  // Resolver cliente: existente, nuevo, o ninguno.
  let customerId: string | null = existingCustomerId || null;

  if (!customerId && newCustomerName) {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({
        full_name: newCustomerName,
        phone: newCustomerPhone || null,
        email: newCustomerEmail || null,
      })
      .select("id")
      .single();

    if (customerError || !newCustomer) {
      fail(
        "No se pudo crear el cliente nuevo: " +
          (customerError?.message ?? "error desconocido")
      );
    }

    customerId = (newCustomer as { id: string }).id;
  }

  const totalCop = itemQuantity * itemUnitPrice;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      source,
      status,
      total_cop: totalCop,
      payment_status: paymentStatus,
      payment_method: paymentMethod || null,
      courier_id: courierId || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    fail("No se pudo crear la venta: " + (orderError?.message ?? "error desconocido"));
  }

  const orderId = (order as { id: string }).id;

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: orderId,
    description: itemDescription,
    quantity: itemQuantity,
    unit_price_cop: itemUnitPrice,
  });

  if (itemError) {
    fail(
      "La venta se creó pero no se pudo guardar el detalle: " + itemError.message
    );
  }

  redirect("/ventas");
}
