"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

const VALID_STATUSES = [
  "borrador",
  "enviado_aprobacion",
  "aprobado",
  "enviado_maquiladora",
  "archivado",
] as const;
type DesignStatus = (typeof VALID_STATUSES)[number];

function fail(message: string): never {
  redirect(`/disenos?error=${encodeURIComponent(message)}`);
}

function isDesignStatus(value: string): value is DesignStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

// Cambia el estado de un diseño dentro del flujo:
// borrador -> enviado_aprobacion -> aprobado -> enviado_maquiladora -> archivado
// (con la posibilidad de regresar a borrador desde enviado_aprobacion o archivado).
export async function updateDesignStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id) {
    fail("Diseño inválido");
  }
  if (!isDesignStatus(status)) {
    fail("Estado inválido");
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("designs")
    .update({ status })
    .eq("id", id);

  if (error) {
    fail("No se pudo actualizar el estado: " + error.message);
  }

  redirect("/disenos");
}

// Publica o despublica un diseño en el ecommerce. Nota: esto NO crea ni
// conecta un `product` de catálogo (ese flujo queda fuera de alcance) — solo
// marca el diseño como visible/no visible via `published_to_ecommerce`.
export async function setEcommercePublish(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const publish = String(formData.get("publish") ?? "").trim() === "true";

  if (!id) {
    fail("Diseño inválido");
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("designs")
    .update({
      published_to_ecommerce: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    fail("No se pudo actualizar la publicación: " + error.message);
  }

  redirect("/disenos");
}
