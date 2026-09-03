"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

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
  redirect(`/catalogo/regalos?error=${encodeURIComponent(message)}`);
}

export async function crearSegmentoRegalo(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    fail("El nombre del segmento es obligatorio");
  }

  const supabase = createServiceRoleClient();

  const baseSlug = slugify(name) || "segmento";
  let slug = baseSlug;
  let suffix = 1;
  while (suffix <= 20) {
    const { data: collision } = await supabase
      .from("gift_segments")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!collision) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const { error } = await supabase.from("gift_segments").insert({ name, slug });

  if (error) {
    fail("No se pudo crear el segmento: " + error.message);
  }

  redirect("/catalogo/regalos");
}

export async function actualizarSegmentoRegalo(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!id) {
    fail("Segmento inválido");
  }
  if (!name) {
    fail("El nombre del segmento es obligatorio");
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("gift_segments").update({ name }).eq("id", id);

  if (error) {
    fail("No se pudo actualizar el segmento: " + error.message);
  }

  redirect("/catalogo/regalos");
}

export async function toggleSegmentoRegaloActivo(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const isActive = formData.get("is_active") === "true";

  if (!id) {
    fail("Segmento inválido");
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("gift_segments")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) {
    fail("No se pudo actualizar el segmento: " + error.message);
  }

  redirect("/catalogo/regalos");
}
