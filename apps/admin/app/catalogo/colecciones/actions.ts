"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { uploadDesignImage } from "../../../lib/storage";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes tras la normalizacion NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function fail(message: string): never {
  redirect(`/catalogo/colecciones?error=${encodeURIComponent(message)}`);
}

async function resolveCoverImage(formData: FormData, fallback?: string): Promise<string | null> {
  const file = formData.get("cover_image");
  if (file instanceof File && file.size > 0) {
    try {
      return await uploadDesignImage(file, "colecciones");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "error desconocido";
      fail(message);
    }
  }
  return fallback ?? null;
}

export async function crearColeccion(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    fail("El nombre de la colección es obligatorio");
  }

  const supabase = createServiceRoleClient();

  const baseSlug = slugify(name) || "coleccion";
  let slug = baseSlug;
  let suffix = 1;
  while (suffix <= 20) {
    const { data: collision } = await supabase
      .from("collections")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!collision) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const coverImageUrl = await resolveCoverImage(formData);

  const { error } = await supabase.from("collections").insert({
    name,
    slug,
    description: description || null,
    cover_image_url: coverImageUrl,
  });

  if (error) {
    fail("No se pudo crear la colección: " + error.message);
  }

  redirect("/catalogo/colecciones");
}

export async function actualizarColeccion(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const currentCoverImageUrl = String(formData.get("current_cover_image_url") ?? "").trim();

  if (!id) {
    fail("Colección inválida");
  }
  if (!name) {
    fail("El nombre de la colección es obligatorio");
  }

  const coverImageUrl = await resolveCoverImage(formData, currentCoverImageUrl || undefined);

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("collections")
    .update({
      name,
      description: description || null,
      cover_image_url: coverImageUrl,
    })
    .eq("id", id);

  if (error) {
    fail("No se pudo actualizar la colección: " + error.message);
  }

  redirect("/catalogo/colecciones");
}

export async function toggleColeccionActiva(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const isActive = formData.get("is_active") === "true";

  if (!id) {
    fail("Colección inválida");
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("collections")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) {
    fail("No se pudo actualizar la colección: " + error.message);
  }

  redirect("/catalogo/colecciones");
}
