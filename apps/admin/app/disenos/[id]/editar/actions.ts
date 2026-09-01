"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { uploadDesignImage } from "../../../../lib/storage";

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
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    fail(id, "No se pudo actualizar el diseño: " + error.message);
  }

  redirect("/disenos");
}

// Agrega mas imagenes a la galeria de un diseno ya existente. La primera
// imagen que tenga el diseno (si no tenia ninguna todavia) queda como
// portada automaticamente.
export async function agregarImagenesDiseno(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const images = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);

  if (!id) {
    redirect(`/disenos?error=${encodeURIComponent("Diseño inválido")}`);
  }
  if (images.length === 0) {
    fail(id, "Elige al menos una imagen para subir");
  }

  const supabase = createServiceRoleClient();

  const { count } = await supabase
    .from("design_images")
    .select("id", { count: "exact", head: true })
    .eq("design_id", id);
  let nextSortOrder = count ?? 0;
  const hadNoCover = nextSortOrder === 0;

  for (const image of images) {
    try {
      const imageUrl = await uploadDesignImage(image, "disenos");
      await supabase.from("design_images").insert({
        design_id: id,
        image_url: imageUrl,
        sort_order: nextSortOrder,
        is_cover: hadNoCover && nextSortOrder === 0,
      });
      nextSortOrder += 1;
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "error desconocido";
      fail(id, message);
    }
  }

  redirect(`/disenos/${id}/editar`);
}

export async function marcarPortadaDiseno(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const imageId = String(formData.get("image_id") ?? "").trim();

  if (!designId || !imageId) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }

  const supabase = createServiceRoleClient();

  await supabase.from("design_images").update({ is_cover: false }).eq("design_id", designId);
  const { error } = await supabase
    .from("design_images")
    .update({ is_cover: true })
    .eq("id", imageId);

  if (error) {
    fail(designId, "No se pudo marcar la portada: " + error.message);
  }

  redirect(`/disenos/${designId}/editar`);
}

export async function eliminarImagenDiseno(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const imageId = String(formData.get("image_id") ?? "").trim();

  if (!designId || !imageId) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("design_images").delete().eq("id", imageId);

  if (error) {
    fail(designId, "No se pudo eliminar la imagen: " + error.message);
  }

  redirect(`/disenos/${designId}/editar`);
}
