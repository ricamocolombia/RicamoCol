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

// Publica o despublica en el ecommerce el producto de catalogo ya
// vinculado a un diseño. Si el diseño todavia no tiene un `product` (nunca
// se aprobo su creacion), no hay nada que alternar: se redirige al flujo de
// "crear producto" en vez de fallar en silencio.
export async function toggleEcommercePublish(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();

  if (!designId) {
    fail("Diseño inválido");
  }

  const supabase = createServiceRoleClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, is_published")
    .eq("design_id", designId)
    .maybeSingle();

  if (productError) {
    fail("No se pudo consultar el producto: " + productError.message);
  }

  if (!product) {
    redirect(`/disenos/${designId}/publicar`);
  }

  const newValue = !product.is_published;

  const { error: productUpdateError } = await supabase
    .from("products")
    .update({ is_published: newValue })
    .eq("id", product.id);

  if (productUpdateError) {
    fail("No se pudo actualizar la publicación: " + productUpdateError.message);
  }

  const { error: designUpdateError } = await supabase
    .from("designs")
    .update({
      published_to_ecommerce: newValue,
      published_at: newValue ? new Date().toISOString() : null,
    })
    .eq("id", designId);

  if (designUpdateError) {
    fail(
      "El producto se actualizó pero no se pudo sincronizar el diseño: " +
        designUpdateError.message
    );
  }

  redirect("/disenos");
}
