"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { syncDesignPublication, productHasSizes } from "../../../../lib/catalogPublication";
import {
  PRESENTATIONS,
  SIZE_OPTIONS,
  priceFieldName,
  crearSlugUnico,
  insertarTallasFaltantes,
} from "../../../../lib/presentations";

function fail(designId: string, message: string): never {
  redirect(`/disenos/${designId}/catalogo?error=${encodeURIComponent(message)}`);
}

// Crea uno o varios listados (product) para este diseño de una sola vez,
// marcando las presentaciones del catalogo fijo que apliquen -- ya no hay
// limite de "un diseño = un producto" ni gate de aprobacion. Nacen sin
// publicar (is_published = false) hasta que tengan al menos una talla.
export async function agregarPresentaciones(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const selectedKeys = formData.getAll("presentation_keys").map((v) => String(v));

  if (!designId) {
    redirect(`/disenos?error=${encodeURIComponent("Diseño inválido")}`);
  }
  if (selectedKeys.length === 0) {
    fail(designId, "Selecciona al menos una prenda");
  }

  const supabase = createServiceRoleClient();

  const { data: design, error: designError } = await supabase
    .from("designs")
    .select("id, name, technique")
    .eq("id", designId)
    .single();

  if (designError || !design) {
    redirect(`/disenos?error=${encodeURIComponent("No se encontró el diseño")}`);
  }

  let priceByEstampadoKey: Map<string, number | null> | null = null;
  if (design.technique === "estampado") {
    const { data: pricesData } = await supabase
      .from("garment_presentation_prices")
      .select("presentation, cost_cop");
    priceByEstampadoKey = new Map((pricesData ?? []).map((p) => [p.presentation, p.cost_cop]));
  }

  // La UI ya oculta las prendas que el diseño tiene, pero un doble envio o
  // una pestana vieja crearian listados duplicados -- se re-verifica aqui.
  const { data: existingData } = await supabase
    .from("products")
    .select("garment_type")
    .eq("design_id", designId);
  const existingGarmentTypes = new Set((existingData ?? []).map((p) => p.garment_type));

  const toInsert: { garment_type: string; base_price_cop: number; slug: string }[] = [];

  for (const key of selectedKeys) {
    const presentation = PRESENTATIONS.find((p) => p.key === key);
    if (!presentation || !(presentation.techniques as readonly string[]).includes(design.technique)) {
      fail(designId, `Prenda inválida: ${key}`);
    }
    if (existingGarmentTypes.has(presentation.key)) {
      continue;
    }

    let price: number;
    if (design.technique === "estampado") {
      const configured = priceByEstampadoKey?.get(presentation.estampadoPriceKey ?? "");
      if (configured === null || configured === undefined) {
        fail(
          designId,
          `El precio de "${presentation.label}" no está configurado — ve a Configuración para definirlo`
        );
      }
      price = configured;
    } else {
      const raw = String(formData.get(priceFieldName(key)) ?? "").trim();
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        fail(designId, `El precio de "${presentation.label}" debe ser un número mayor a 0`);
      }
      price = parsed;
    }

    const slug = await crearSlugUnico(supabase, `${design.name} ${presentation.label}`);
    toInsert.push({ garment_type: presentation.key, base_price_cop: price, slug });
  }

  // Un solo insert: o se crean todos los listados marcados o ninguno.
  if (toInsert.length > 0) {
    const { data: created, error: productError } = await supabase.from("products").insert(
      toInsert.map((item) => ({
        design_id: designId,
        name: design.name,
        slug: item.slug,
        garment_type: item.garment_type,
        technique: design.technique,
        base_price_cop: item.base_price_cop,
        is_published: false,
      }))
    ).select("id, base_price_cop");

    if (productError || !created) {
      fail(designId, "No se pudieron crear los listados: " + (productError?.message ?? "error desconocido"));
    }

    // Cada prenda nace con todas las tallas (todo se produce a la medida).
    const { error: variantsError } = await supabase.from("product_variants").insert(
      created.flatMap((product) =>
        SIZE_OPTIONS.map((size) => ({ product_id: product.id, size, price_cop: product.base_price_cop }))
      )
    );
    if (variantsError) {
      fail(designId, "Se crearon las prendas pero no sus tallas: " + variantsError.message);
    }
  }

  redirect(`/disenos/${designId}/catalogo`);
}

// Todo se produce a la medida despues del pago, asi que cada prenda se
// ofrece siempre en todas las tallas (SIZE_OPTIONS): esto agrega las que
// le falten a un listado, al precio del listado.
export async function completarTallas(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim();

  if (!designId || !productId) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }

  const supabase = createServiceRoleClient();
  const { error } = await insertarTallasFaltantes(supabase, productId);
  if (error) {
    fail(designId, "No se pudieron completar las tallas: " + error);
  }

  redirect(`/disenos/${designId}/catalogo`);
}

// Cambia el precio de una prenda: el del listado (lo que muestra la web)
// y el de todas sus tallas (lo que cobra el checkout), para que nunca se
// desalineen.
export async function actualizarPrecioListado(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim();
  const price = Number.parseInt(String(formData.get("price_cop") ?? ""), 10);

  if (!designId || !productId) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }
  if (!Number.isFinite(price) || price <= 0) {
    fail(designId, "El precio debe ser un número mayor a 0");
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("products").update({ base_price_cop: price }).eq("id", productId);
  if (error) {
    fail(designId, "No se pudo cambiar el precio: " + error.message);
  }
  const { error: variantsError } = await supabase
    .from("product_variants")
    .update({ price_cop: price })
    .eq("product_id", productId);
  if (variantsError) {
    fail(designId, "Se cambió el precio de la prenda pero no el de sus tallas: " + variantsError.message);
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

  if (newValue && !(await productHasSizes(supabase, id))) {
    fail(designId, "Agrega al menos una talla antes de publicar este listado");
  }

  const { error: productError } = await supabase
    .from("products")
    .update({ is_published: newValue })
    .eq("id", id);

  if (productError) {
    fail(designId, "No se pudo actualizar la publicación: " + productError.message);
  }

  const { error: designUpdateError } = await syncDesignPublication(supabase, designId);

  if (designUpdateError) {
    fail(designId, "El listado se actualizó pero no se pudo sincronizar el diseño: " + designUpdateError);
  }

  redirect(`/disenos/${designId}/catalogo`);
}
