"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { uploadDesignImage, publicVideoUrl, removePublicFile } from "../../../../lib/storage";
import { MAX_DESIGN_IMAGES } from "../../../../lib/designMedia";

const VALID_TECHNIQUES = ["bordado", "estampado"] as const;
type DesignTechnique = (typeof VALID_TECHNIQUES)[number];

function fail(id: string, message: string): never {
  redirect(`/disenos/${id}/editar?error=${encodeURIComponent(message)}`);
}

function isDesignTechnique(value: string): value is DesignTechnique {
  return (VALID_TECHNIQUES as readonly string[]).includes(value);
}

// Nombre, tecnica y descripcion publica. La descripcion vive en cada
// listado (products.description, es lo que muestra la web) y se aplica a
// todas las prendas del diseño. La tecnica solo se puede cambiar mientras
// el diseño no tenga prendas: el precio de cada prenda depende de ella.
export async function actualizarDiseno(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const technique = String(formData.get("technique") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const renameProducts = formData.get("rename_products") === "on";

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

  const [{ data: current }, { count: productCount }] = await Promise.all([
    supabase.from("designs").select("technique").eq("id", id).maybeSingle(),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("design_id", id),
  ]);

  if (!current) {
    redirect(`/disenos?error=${encodeURIComponent("No se encontró el diseño")}`);
  }
  if ((productCount ?? 0) > 0 && current.technique !== technique) {
    fail(id, "No se puede cambiar la técnica de un diseño que ya tiene prendas");
  }

  const { error } = await supabase.from("designs").update({ name, technique }).eq("id", id);

  if (error) {
    fail(id, "No se pudo actualizar el diseño: " + error.message);
  }

  const { error: productsError } = await supabase
    .from("products")
    .update(renameProducts ? { description: description || null, name } : { description: description || null })
    .eq("design_id", id);

  if (productsError) {
    fail(id, "El diseño se guardó, pero no se pudo actualizar la descripción: " + productsError.message);
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

  const room = MAX_DESIGN_IMAGES - nextSortOrder;
  if (images.length > room) {
    fail(
      id,
      room <= 0
        ? `Este diseño ya tiene ${MAX_DESIGN_IMAGES} fotos — elimina alguna para subir otra`
        : `Solo caben ${room} foto(s) más (máximo ${MAX_DESIGN_IMAGES} por diseño)`
    );
  }

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

  const { data: deleted, error } = await supabase
    .from("design_images")
    .delete()
    .eq("id", imageId)
    .select("image_url, is_cover");

  if (error) {
    fail(designId, "No se pudo eliminar la imagen: " + error.message);
  }

  const removed = deleted?.[0];
  if (removed) {
    await removePublicFile(removed.image_url);
    // Si se borro la portada, la primera foto que quede pasa a serlo.
    if (removed.is_cover) {
      const { data: next } = await supabase
        .from("design_images")
        .select("id")
        .eq("design_id", designId)
        .order("sort_order", { ascending: true })
        .limit(1);
      if (next?.[0]) {
        await supabase.from("design_images").update({ is_cover: true }).eq("id", next[0].id);
      }
    }
  }

  redirect(`/disenos/${designId}/editar`);
}

// Guarda (o reemplaza) el video del diseño. El archivo ya lo subio el
// navegador directo a Storage (components/VideoUploader.tsx); aqui solo
// llega su path. El video anterior, si habia, se borra del bucket.
export async function guardarVideoDiseno(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const videoPath = String(formData.get("video_path") ?? "").trim();

  if (!id) {
    redirect(`/disenos?error=${encodeURIComponent("Diseño inválido")}`);
  }
  if (!videoPath) {
    fail(id, "Elige un video y espera a que termine de subir");
  }
  const videoUrl = publicVideoUrl(videoPath);
  if (!videoUrl) {
    fail(id, "El video no es válido, vuelve a subirlo");
  }

  const supabase = createServiceRoleClient();
  const { data: current } = await supabase.from("designs").select("video_url").eq("id", id).maybeSingle();

  const { error } = await supabase.from("designs").update({ video_url: videoUrl }).eq("id", id);
  if (error) {
    fail(id, "No se pudo guardar el video: " + error.message);
  }
  if (current?.video_url && current.video_url !== videoUrl) {
    await removePublicFile(current.video_url);
  }

  redirect(`/disenos/${id}/editar`);
}

export async function quitarVideoDiseno(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect(`/disenos?error=${encodeURIComponent("Diseño inválido")}`);
  }

  const supabase = createServiceRoleClient();
  const { data: current } = await supabase.from("designs").select("video_url").eq("id", id).maybeSingle();

  const { error } = await supabase.from("designs").update({ video_url: null }).eq("id", id);
  if (error) {
    fail(id, "No se pudo quitar el video: " + error.message);
  }
  await removePublicFile(current?.video_url);

  redirect(`/disenos/${id}/editar`);
}
