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
