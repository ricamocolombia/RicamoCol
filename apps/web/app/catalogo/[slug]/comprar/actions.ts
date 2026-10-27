"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { uploadPaymentProof, PaymentProofUploadError } from "../../../../lib/paymentProof";
import { sendOrderStatusEmail } from "../../../../lib/orderEmails";
import { findOrCreateCustomer } from "../../../../lib/customers";

const MAX_QUANTITY = 20;

function fail(slug: string, variantId: string, message: string): never {
  redirect(
    `/catalogo/${slug}/comprar?variante=${variantId}&error=${encodeURIComponent(message)}`
  );
}

// Checkout publico del catalogo: el cliente ya eligio tipo de prenda +
// talla en /catalogo/[slug], aqui solo confirma sus datos y sube el
// comprobante de transferencia. El precio y la disponibilidad del
// producto/variante se re-verifican siempre contra la base de datos --
// nunca se confia en lo que venga del formulario para el monto a cobrar.
export async function crearPedidoConComprobante(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "").trim();
  const variantId = String(formData.get("variant_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "1");
  const adaptation = String(formData.get("adaptation") ?? "").trim().slice(0, 1000);
  const paymentProof = formData.get("payment_proof");

  if (!productId || !variantId) {
    redirect("/catalogo");
  }

  const supabase = createServiceRoleClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, slug, design_id, name, garment_type, technique")
    .eq("id", productId)
    .eq("is_published", true)
    .maybeSingle();

  if (!product) {
    redirect("/catalogo");
  }

  const { data: variant } = await supabase
    .from("product_variants")
    .select("id, product_id, size, price_cop")
    .eq("id", variantId)
    .maybeSingle();

  if (!variant || variant.product_id !== product.id) {
    redirect(`/catalogo/${product.slug}`);
  }

  if (!name) {
    fail(product.slug, variantId, "Cuéntanos tu nombre");
  }
  if (!phone) {
    fail(product.slug, variantId, "Necesitamos tu teléfono para confirmarte el pedido");
  }
  if (!(paymentProof instanceof File) || paymentProof.size === 0) {
    fail(product.slug, variantId, "Sube el comprobante de pago");
  }

  const quantity = Number.parseInt(quantityRaw, 10);
  if (!Number.isFinite(quantity) || quantity < 1) {
    fail(product.slug, variantId, "La cantidad debe ser un número mayor a 0");
  }
  if (quantity > MAX_QUANTITY) {
    fail(
      product.slug,
      variantId,
      `Para más de ${MAX_QUANTITY} unidades escríbenos por WhatsApp y te armamos el pedido`
    );
  }

  // Cliente: busca por telefono (normalizado), o crea uno nuevo -- mismo
  // helper que apps/web/app/personalizados/actions.ts.
  const customerId = await findOrCreateCustomer(supabase, { name, phone, email, city, address });
  if (!customerId) {
    fail(product.slug, variantId, "No pudimos guardar tus datos, intenta de nuevo");
  }

  const totalCop = variant.price_cop * quantity;
  const orderId = crypto.randomUUID();

  let paymentProofPath: string;
  try {
    paymentProofPath = await uploadPaymentProof(paymentProof, orderId);
  } catch (uploadError) {
    const message =
      uploadError instanceof PaymentProofUploadError
        ? uploadError.message
        : "No se pudo subir el comprobante, intenta de nuevo";
    fail(product.slug, variantId, message);
  }

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    customer_id: customerId,
    source: "web_catalogo",
    status: "pendiente",
    design_id: product.design_id,
    total_cop: totalCop,
    payment_status: "comprobante_pendiente",
    payment_proof_path: paymentProofPath,
    payment_proof_uploaded_at: new Date().toISOString(),
    // La direccion de envio va en el pedido: si el cliente ya existia, su
    // ficha conserva la direccion vieja (ver lib/customers.ts).
    notes: [
      adaptation && `Adaptación pedida: ${adaptation}`,
      address && `Envío a: ${address}`,
      city && `Ciudad: ${city}`,
      email && `Correo: ${email}`,
    ]
      .filter(Boolean)
      .join(" · ") || null,
  });

  if (orderError) {
    console.error("checkout: insert orders", orderError);
    await supabase.storage.from("payment-proofs").remove([paymentProofPath]);
    fail(product.slug, variantId, "No pudimos registrar el pedido, intenta de nuevo");
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: orderId,
    product_variant_id: variant.id,
    design_id: product.design_id,
    description: product.name,
    quantity,
    unit_price_cop: variant.price_cop,
    garment_type: product.garment_type,
    size: variant.size,
    technique: product.technique,
  });

  if (itemError) {
    // Deshace el pedido a medias para que el reintento del cliente no deje
    // un pedido duplicado sin items en el admin.
    console.error("checkout: insert order_items", itemError);
    await supabase.from("orders").delete().eq("id", orderId);
    await supabase.storage.from("payment-proofs").remove([paymentProofPath]);
    fail(product.slug, variantId, "No pudimos registrar el pedido, intenta de nuevo");
  }

  await sendOrderStatusEmail(orderId, "comprobante_recibido");

  redirect(`/catalogo/${product.slug}/comprar/gracias`);
}
