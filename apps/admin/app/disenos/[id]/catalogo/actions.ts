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

function fail(designId: string, message: string): never {
  redirect(`/disenos/${designId}/catalogo?error=${encodeURIComponent(message)}`);
}

// Crea un listado (product) nuevo para este diseño, uno por tipo de prenda
// -- ya no hay limite de "un diseño = un producto" ni gate de aprobacion:
// cualquier diseño se puede ofrecer en el catalogo, en los tipos de prenda
// que Maria Jose decida. Nace sin publicar (is_published = false) hasta que
// tenga al menos una talla cargada.
export async function crearListadoDesdeDiseno(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const garmentType = String(formData.get("garment_type") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const basePriceRaw = String(formData.get("base_price_cop") ?? "");

  if (!designId) {
    redirect(`/disenos?error=${encodeURIComponent("Diseño inválido")}`);
  }
  if (!garmentType) {
    fail(designId, "El tipo de prenda es obligatorio");
  }
  if (!name) {
    fail(designId, "El nombre del producto es obligatorio");
  }
  const basePrice = Number.parseInt(basePriceRaw, 10);
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    fail(designId, "El precio debe ser un número mayor a 0");
  }

  const supabase = createServiceRoleClient();

  const { data: design, error: designError } = await supabase
    .from("designs")
    .select("id, technique")
    .eq("id", designId)
    .single();

  if (designError || !design) {
    redirect(`/disenos?error=${encodeURIComponent("No se encontró el diseño")}`);
  }

  const baseSlug = slugify(`${name} ${garmentType}`) || "producto";
  let slug = baseSlug;
  let suffix = 1;
  while (suffix <= 20) {
    const { data: collision } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!collision) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const { error: productError } = await supabase.from("products").insert({
    design_id: designId,
    name,
    slug,
    garment_type: garmentType,
    technique: design.technique,
    base_price_cop: basePrice,
    is_published: false,
  });

  if (productError) {
    fail(designId, "No se pudo crear el listado: " + productError.message);
  }

  redirect(`/disenos/${designId}/catalogo`);
}

export async function agregarTalla(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim();
  const priceRaw = String(formData.get("price_cop") ?? "");

  if (!designId || !productId) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }
  if (!size) {
    fail(designId, "La talla es obligatoria");
  }
  const price = Number.parseInt(priceRaw, 10);
  if (!Number.isFinite(price) || price <= 0) {
    fail(designId, "El precio de la talla debe ser un número mayor a 0");
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    size,
    price_cop: price,
  });

  if (error) {
    fail(designId, "No se pudo agregar la talla: " + error.message);
  }

  redirect(`/disenos/${designId}/catalogo`);
}

export async function eliminarTalla(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const variantId = String(formData.get("variant_id") ?? "").trim();

  if (!designId || !variantId) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("product_variants").delete().eq("id", variantId);

  if (error) {
    fail(designId, "No se pudo eliminar la talla: " + error.message);
  }

  redirect(`/disenos/${designId}/catalogo`);
}

// Asigna coleccion y curacion (destacado / mas vendido / segmentos de
// regalo) de un listado -- misma logica que apps/admin/app/catalogo/actions.ts,
// pero redirige de vuelta a esta pantalla en vez de a /catalogo.
export async function actualizarListadoCatalogo(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();
  const collectionId = String(formData.get("collection_id") ?? "").trim();
  const isFeatured = formData.get("is_featured") === "on";
  const isBestseller = formData.get("is_bestseller") === "on";
  const giftSegmentIds = formData.getAll("gift_segment_ids").map(String).filter(Boolean);

  if (!designId || !id) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("products")
    .update({
      collection_id: collectionId || null,
      is_featured: isFeatured,
      is_bestseller: isBestseller,
    })
    .eq("id", id);

  if (error) {
    fail(designId, "No se pudo actualizar el listado: " + error.message);
  }

  const { error: deleteError } = await supabase
    .from("product_gift_segments")
    .delete()
    .eq("product_id", id);

  if (deleteError) {
    fail(designId, "El listado se actualizó pero no se pudieron limpiar sus segmentos de regalo: " + deleteError.message);
  }

  if (giftSegmentIds.length > 0) {
    const { error: insertError } = await supabase
      .from("product_gift_segments")
      .insert(giftSegmentIds.map((giftSegmentId) => ({ product_id: id, gift_segment_id: giftSegmentId })));

    if (insertError) {
      fail(designId, "El listado se actualizó pero no se pudieron guardar sus segmentos de regalo: " + insertError.message);
    }
  }

  redirect(`/disenos/${designId}/catalogo`);
}

export async function toggleListadoPublicado(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();
  const isPublished = formData.get("is_published") === "true";

  if (!designId || !id) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }

  const supabase = createServiceRoleClient();
  const newValue = !isPublished;

  const { error: productError } = await supabase
    .from("products")
    .update({ is_published: newValue })
    .eq("id", id);

  if (productError) {
    fail(designId, "No se pudo actualizar la publicación: " + productError.message);
  }

  const { error: designUpdateError } = await supabase
    .from("designs")
    .update({
      published_to_ecommerce: newValue,
      published_at: newValue ? new Date().toISOString() : null,
    })
    .eq("id", designId);

  if (designUpdateError) {
    fail(designId, "El listado se actualizó pero no se pudo sincronizar el diseño: " + designUpdateError.message);
  }

  redirect(`/disenos/${designId}/catalogo`);
}
