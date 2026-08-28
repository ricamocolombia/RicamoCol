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

const VALID_TECHNIQUES = ["bordado", "estampado"] as const;
type Technique = (typeof VALID_TECHNIQUES)[number];
function isTechnique(value: string): value is Technique {
  return (VALID_TECHNIQUES as readonly string[]).includes(value);
}

const VALID_PRINT_SIZES = [
  "punto_corazon",
  "media_carta",
  "carta",
  "oficio",
  "tabloide",
] as const;
type PrintSize = (typeof VALID_PRINT_SIZES)[number];
function isPrintSize(value: string): value is PrintSize {
  return (VALID_PRINT_SIZES as readonly string[]).includes(value);
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

function fail(message: string): never {
  redirect(`/ventas/nueva?error=${encodeURIComponent(message)}`);
}

export async function crearVenta(formData: FormData) {
  const supabase = createServiceRoleClient();

  const existingCustomerId = String(formData.get("customer_id") ?? "").trim();

  const newCustomerName = String(formData.get("new_customer_name") ?? "").trim();
  const newCustomerIdNumber = String(formData.get("new_customer_id_number") ?? "").trim();
  const newCustomerPhone = String(formData.get("new_customer_phone") ?? "").trim();
  const newCustomerEmail = String(formData.get("new_customer_email") ?? "").trim();
  const newCustomerAddress = String(formData.get("new_customer_address") ?? "").trim();
  const newCustomerCity = String(formData.get("new_customer_city") ?? "").trim();
  const newCustomerNeighborhood = String(
    formData.get("new_customer_neighborhood") ?? ""
  ).trim();

  const source = String(formData.get("source") ?? "manual");
  const status = String(formData.get("status") ?? "pendiente");
  const paymentStatus = String(formData.get("payment_status") ?? "pendiente");
  const paymentMethod = String(formData.get("payment_method") ?? "").trim();
  const courierId = String(formData.get("courier_id") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const itemDescription = String(formData.get("item_description") ?? "").trim();
  const itemQuantityRaw = String(formData.get("item_quantity") ?? "1");
  const itemUnitPriceRaw = String(formData.get("item_unit_price_cop") ?? "0");
  const garmentType = String(formData.get("garment_type") ?? "").trim();
  const designCategory = String(formData.get("design_category") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim();

  const techniqueRaw = String(formData.get("technique") ?? "").trim();
  const printSizeRaw = String(formData.get("print_size") ?? "").trim();
  const costRaw = String(formData.get("cost_cop") ?? "").trim();

  const bankAccountId = String(formData.get("bank_account_id") ?? "").trim();
  const amountReceivedRaw = String(formData.get("amount_received_cop") ?? "").trim();

  const shippingTypeRaw = String(formData.get("shipping_type") ?? "").trim();
  const shippingPaymentStatusRaw = String(
    formData.get("shipping_payment_status") ?? ""
  ).trim();

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
    fail("La descripción del producto es obligatoria");
  }
  if (!Number.isFinite(itemQuantity) || itemQuantity < 1) {
    fail("La cantidad debe ser un número mayor a 0");
  }
  if (!Number.isFinite(itemUnitPrice) || itemUnitPrice < 0) {
    fail("El precio unitario debe ser un número válido");
  }
  if (techniqueRaw && !isTechnique(techniqueRaw)) {
    fail("Técnica inválida");
  }
  if (printSizeRaw && !isPrintSize(printSizeRaw)) {
    fail("Tamaño de estampado inválido");
  }
  if (shippingTypeRaw && !isShippingType(shippingTypeRaw)) {
    fail("Tipo de envío inválido");
  }
  if (shippingPaymentStatusRaw && !isShippingPaymentStatus(shippingPaymentStatusRaw)) {
    fail("Estado de pago del domicilio inválido");
  }
  const technique: Technique | null = techniqueRaw ? (techniqueRaw as Technique) : null;
  const printSize: PrintSize | null = printSizeRaw ? (printSizeRaw as PrintSize) : null;
  const shippingType: ShippingType | null = shippingTypeRaw
    ? (shippingTypeRaw as ShippingType)
    : null;
  const shippingPaymentStatus: ShippingPaymentStatus | null = shippingPaymentStatusRaw
    ? (shippingPaymentStatusRaw as ShippingPaymentStatus)
    : null;

  const cost = costRaw ? Number.parseInt(costRaw, 10) : null;
  if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
    fail("El costo de la decoración debe ser un número válido");
  }

  const requiresPayment = paymentStatus !== "pendiente";
  const amountReceived = amountReceivedRaw ? Number.parseInt(amountReceivedRaw, 10) : 0;
  if (requiresPayment) {
    if (!bankAccountId) {
      fail("Elige el banco al que entró el dinero");
    }
    if (!Number.isFinite(amountReceived) || amountReceived <= 0) {
      fail("El monto recibido debe ser un número mayor a 0");
    }
  }

  // Resolver cliente: existente, nuevo, o ninguno.
  let customerId: string | null = existingCustomerId || null;

  if (!customerId && newCustomerName) {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({
        full_name: newCustomerName,
        id_number: newCustomerIdNumber || null,
        phone: newCustomerPhone || null,
        email: newCustomerEmail || null,
        address: newCustomerAddress || null,
        city: newCustomerCity || null,
        neighborhood: newCustomerNeighborhood || null,
      })
      .select("id")
      .single();

    if (customerError || !newCustomer) {
      fail(
        "No se pudo crear el cliente nuevo: " +
          (customerError?.message ?? "error desconocido")
      );
    }

    customerId = newCustomer.id;
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
      shipping_type: shippingType,
      shipping_payment_status: shippingPaymentStatus,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    fail("No se pudo crear la venta: " + (orderError?.message ?? "error desconocido"));
  }

  const orderId = order.id;

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: orderId,
    description: itemDescription,
    quantity: itemQuantity,
    unit_price_cop: itemUnitPrice,
    garment_type: garmentType || null,
    design_category: designCategory || null,
    color: color || null,
    size: size || null,
    technique,
    print_size: printSize,
    cost_cop: cost,
  });

  if (itemError) {
    fail(
      "La venta se creó pero no se pudo guardar el detalle: " + itemError.message
    );
  }

  // Cuenta por pagar automatica al proveedor de produccion (estampado o
  // bordado), segun lo configurado en Configuracion. Sin proveedor
  // configurado para esa tecnica, se omite en silencio -- no bloquea la
  // venta, pero el pago a ese proveedor no queda registrado hasta que se
  // configure.
  if (technique && cost !== null && cost > 0) {
    const settingKey = technique === "estampado" ? "supplier_estampado_id" : "supplier_bordado_id";
    const { data: settingRow } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", settingKey)
      .maybeSingle();

    const productionSupplierId = settingRow?.value;

    if (productionSupplierId) {
      const { error: payableError } = await supabase.from("accounts_payable").insert({
        supplier_id: productionSupplierId,
        order_id: orderId,
        amount_cop: cost * itemQuantity,
        notes: `${technique === "estampado" ? "Estampado" : "Bordado"} — ${itemDescription}`,
      });

      if (payableError) {
        fail(
          "La venta se creó pero no se pudo cargar la cuenta por pagar al proveedor de producción: " +
            payableError.message
        );
      }
    }
  }

  // Pago: si se recibio dinero, queda un movimiento de ingreso en Bancos. Si
  // lo recibido es menos que el total, el saldo pendiente se registra solo
  // como cuenta por cobrar -- sin duplicar la captura manual de ese dato.
  if (requiresPayment) {
    const { error: transactionError } = await supabase.from("transactions").insert({
      bank_account_id: bankAccountId,
      type: "ingreso",
      category: "Venta",
      amount_cop: amountReceived,
      description: `Venta${itemDescription ? ` — ${itemDescription}` : ""}`,
      reference_order_id: orderId,
    });

    if (transactionError) {
      fail(
        "La venta se creó pero no se pudo registrar el pago en bancos: " +
          transactionError.message
      );
    }

    const pending = totalCop - amountReceived;
    if (pending > 0) {
      const { error: receivableError } = await supabase
        .from("accounts_receivable")
        .insert({
          customer_id: customerId,
          order_id: orderId,
          amount_cop: pending,
          notes: "Saldo pendiente de venta registrada en Ventas",
        });

      if (receivableError) {
        fail(
          "La venta y el pago se registraron, pero no se pudo crear la cuenta por cobrar del saldo pendiente: " +
            receivableError.message
        );
      }
    }
  }

  redirect("/ventas");
}
