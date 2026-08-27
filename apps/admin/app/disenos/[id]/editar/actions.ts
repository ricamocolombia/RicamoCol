"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

const VALID_TECHNIQUES = ["bordado", "estampado"] as const;
type DesignTechnique = (typeof VALID_TECHNIQUES)[number];

function fail(id: string, message: string): never {
  redirect(`/disenos/${id}/editar?error=${encodeURIComponent(message)}`);
}

function isDesignTechnique(value: string): value is DesignTechnique {
  return (VALID_TECHNIQUES as readonly string[]).includes(value);
}

export async function actualizarDiseno(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const technique = String(formData.get("technique") ?? "").trim();
  const customerId = String(formData.get("customer_id") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id) {
    redirect(`/disenos?error=${encodeURIComponent("Diseño inválido")}`);
  }
  if (!name) {
    fail(id, "El nombre del diseño es obligatorio");
  }
  if (!isDesignTechnique(technique)) {
    fail(id, "Elige una técnica válida");
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("designs")
    .update({
      name,
      technique,
      customer_id: customerId || null,
      image_url: imageUrl || null,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    fail(id, "No se pudo actualizar el diseño: " + error.message);
  }

  redirect("/disenos");
}
