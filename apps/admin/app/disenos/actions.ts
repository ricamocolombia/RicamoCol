"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { syncDesignPublication } from "../../lib/catalogPublication";

function fail(message: string): never {
  redirect(`/disenos?error=${encodeURIComponent(message)}`);
}

// Publica u oculta de la pagina TODAS las prendas de un diseño de una vez.
// Al publicar solo se publican las prendas que tienen tallas (una sin
// tallas no se puede comprar); el ajuste fino por prenda sigue en
// /disenos/[id]/catalogo.
export async function cambiarPublicacionDiseno(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const publish = formData.get("publish") === "true";

  if (!id) {
    fail("Diseño inválido");
  }

  const supabase = createServiceRoleClient();

  const { data: products } = await supabase.from("products").select("id").eq("design_id", id);
  const productIds = (products ?? []).map((p) => p.id);

  if (productIds.length === 0) {
    fail("Ese diseño no tiene prendas — agrégalas en \"Prendas y tallas\"");
  }

  let targetIds = productIds;
  if (publish) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("product_id")
      .in("product_id", productIds);
    const withSizes = new Set((variants ?? []).map((v) => v.product_id));
    targetIds = productIds.filter((pid) => withSizes.has(pid));
    if (targetIds.length === 0) {
      fail("Ninguna prenda de ese diseño tiene tallas — agrégalas en \"Prendas y tallas\"");
    }
  }

  const { error } = await supabase
    .from("products")
    .update({ is_published: publish })
    .in("id", targetIds);

  if (error) {
    fail("No se pudo actualizar la publicación: " + error.message);
  }

  const { error: syncError } = await syncDesignPublication(supabase, id);
  if (syncError) {
    fail("Se actualizaron las prendas, pero no se pudo sincronizar el diseño: " + syncError);
  }

  redirect("/disenos");
}
