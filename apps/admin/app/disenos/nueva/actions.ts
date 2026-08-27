"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

const VALID_TECHNIQUES = ["bordado", "estampado"] as const;
const VALID_STATUSES = [
  "borrador",
  "enviado_aprobacion",
  "aprobado",
  "enviado_maquiladora",
  "archivado",
] as const;
type DesignTechnique = (typeof VALID_TECHNIQUES)[number];
type DesignStatus = (typeof VALID_STATUSES)[number];

function fail(message: string): never {
  redirect(`/disenos/nueva?error=${encodeURIComponent(message)}`);
}

function isDesignTechnique(value: string): value is DesignTechnique {
  return (VALID_TECHNIQUES as readonly string[]).includes(value);
}

function isDesignStatus(value: string): value is DesignStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

export async function crearDiseno(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const technique = String(formData.get("technique") ?? "").trim();
  const status = String(formData.get("status") ?? "borrador").trim();
  const customerId = String(formData.get("customer_id") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) {
    fail("El nombre del diseño es obligatorio");
  }
  if (!isDesignTechnique(technique)) {
    fail("Elige una técnica válida");
  }
  if (!isDesignStatus(status)) {
    fail("Estado inicial inválido");
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("designs").insert({
    name,
    technique,
    status,
    customer_id: customerId || null,
    image_url: imageUrl || null,
    notes: notes || null,
  });

  if (error) {
    fail("No se pudo crear el diseño: " + error.message);
  }

  redirect("/disenos");
}
