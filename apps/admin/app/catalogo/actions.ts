"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

function fail(message: string): never {
  redirect(`/catalogo?error=${encodeURIComponent(message)}`);
}

// Asigna coleccion y curacion (destacado / mas vendido) de un producto ya
// publicado o publicable. No toca is_published -- eso es un toggle aparte
// para no mezclar "donde se agrupa" con "si se ve o no".
export async function actualizarProductoCatalogo(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const collectionId = String(formData.get("collection_id") ?? "").trim();
  const isFeatured = formData.get("is_featured") === "on";
  const isBestseller = formData.get("is_bestseller") === "on";
  const giftSegmentIds = formData.getAll("gift_segment_ids").map(String).filter(Boolean);

  if (!id) {
    fail("Producto inválido");
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
    fail("No se pudo actualizar el producto: " + error.message);
  }

  // Reemplaza por completo los segmentos de regalo del producto -- mas
  // simple que calcular el diff entre lo que habia y lo marcado ahora.
  const { error: deleteError } = await supabase
    .from("product_gift_segments")
    .delete()
    .eq("product_id", id);

  if (deleteError) {
    fail("El producto se actualizó pero no se pudieron limpiar sus segmentos de regalo: " + deleteError.message);
  }

  if (giftSegmentIds.length > 0) {
    const { error: insertError } = await supabase
      .from("product_gift_segments")
      .insert(giftSegmentIds.map((giftSegmentId) => ({ product_id: id, gift_segment_id: giftSegmentId })));

    if (insertError) {
      fail("El producto se actualizó pero no se pudieron guardar sus segmentos de regalo: " + insertError.message);
    }
  }

  redirect("/catalogo");
}

// Publica o despublica un producto en el ecommerce -- mismo efecto que el
// toggle que antes vivia en Diseños, ahora centralizado aqui junto con el
// resto de decisiones de "que se ve en la web".
export async function toggleProductoPublicado(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const isPublished = formData.get("is_published") === "true";

  if (!id) {
    fail("Producto inválido");
  }

  const supabase = createServiceRoleClient();
  const newValue = !isPublished;

  const { data: product, error: productError } = await supabase
    .from("products")
    .update({ is_published: newValue })
    .eq("id", id)
    .select("design_id")
    .single();

  if (productError || !product) {
    fail("No se pudo actualizar la publicación: " + (productError?.message ?? "error desconocido"));
  }

  if (product.design_id) {
    const { error: designError } = await supabase
      .from("designs")
      .update({
        published_to_ecommerce: newValue,
        published_at: newValue ? new Date().toISOString() : null,
      })
      .eq("id", product.design_id);

    if (designError) {
      fail("El producto se actualizó pero no se pudo sincronizar el diseño: " + designError.message);
    }
  }

  redirect("/catalogo");
}
