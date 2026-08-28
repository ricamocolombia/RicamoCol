"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { buildWhatsAppLink } from "../../lib/whatsapp";

const VALID_GARMENT_TYPES = ["camiseta", "buzo"] as const;
type GarmentType = (typeof VALID_GARMENT_TYPES)[number];
function isGarmentType(value: string): value is GarmentType {
  return (VALID_GARMENT_TYPES as readonly string[]).includes(value);
}

const VALID_TECHNIQUES = ["bordado", "estampado"] as const;
type Technique = (typeof VALID_TECHNIQUES)[number];
function isTechnique(value: string): value is Technique {
  return (VALID_TECHNIQUES as readonly string[]).includes(value);
}

function fail(message: string): never {
  redirect(`/personalizados?error=${encodeURIComponent(message)}`);
}

// Crea (via service_role, esto es un formulario publico sin sesion) un
// design_request y, si hace falta, el customer asociado, y manda al
// visitante derecho a WhatsApp con el resumen listo para enviar -- el cierre
// real de la conversacion sigue siendo con Maria Jose, como hoy.
export async function crearSolicitud(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  const garmentTypeRaw = String(formData.get("garment_type") ?? "").trim();
  const techniqueRaw = String(formData.get("technique") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "1");
  const referenceNotes = String(formData.get("reference_notes") ?? "").trim();

  if (!name) {
    fail("Cuéntanos tu nombre");
  }
  if (!phone) {
    fail("Necesitamos tu teléfono para escribirte por WhatsApp");
  }
  if (!isGarmentType(garmentTypeRaw)) {
    fail("Elige camiseta o buzo");
  }
  if (!isTechnique(techniqueRaw)) {
    fail("Elige bordado o estampado");
  }
  if (!referenceNotes) {
    fail("Cuéntanos qué idea tienes en mente");
  }
  const garmentType: GarmentType = garmentTypeRaw;
  const technique: Technique = techniqueRaw;

  const quantity = Number.parseInt(quantityRaw, 10);
  if (!Number.isFinite(quantity) || quantity < 1) {
    fail("La cantidad debe ser un número mayor a 0");
  }

  const supabase = createServiceRoleClient();

  // Cliente: busca por telefono, o crea uno nuevo.
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  let customerId = existingCustomer?.id ?? null;

  if (!customerId) {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({
        full_name: name,
        phone,
        email: email || null,
        city: city || null,
      })
      .select("id")
      .single();

    if (customerError || !newCustomer) {
      fail("No pudimos guardar tus datos, intenta de nuevo");
    }
    customerId = newCustomer.id;
  }

  const { error: requestError } = await supabase.from("design_requests").insert({
    customer_id: customerId,
    garment_type: garmentType,
    technique,
    size: size || null,
    quantity,
    reference_notes: referenceNotes,
  });

  if (requestError) {
    fail("No pudimos guardar tu solicitud, intenta de nuevo");
  }

  const message = [
    `Hola! Soy ${name} y quiero personalizar una prenda con Ricamo.`,
    `Prenda: ${garmentType === "camiseta" ? "Camiseta" : "Buzo"} (${technique === "bordado" ? "bordado" : "estampado"})${size ? `, talla ${size}` : ""}, cantidad: ${quantity}.`,
    `Lo que tengo en mente: ${referenceNotes}`,
  ].join(" ");

  redirect(buildWhatsAppLink(message));
}
