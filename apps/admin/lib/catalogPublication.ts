import { createServiceRoleClient } from "@ricamo/supabase/server";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

// designs.published_to_ecommerce es lo que deja leer el diseno y sus
// imagenes desde la web publica (RLS de designs/design_images). Un diseno
// puede tener varios listados (uno por prenda), asi que el flag debe ser
// "algun listado de este diseno esta publicado" -- no el valor del ultimo
// listado que se toco (despublicar el Buzo dejaba la Camiseta sin fotos).
export async function syncDesignPublication(
  supabase: ServiceClient,
  designId: string
): Promise<{ error: string | null }> {
  const { data: published, error: countError } = await supabase
    .from("products")
    .select("id")
    .eq("design_id", designId)
    .eq("is_published", true)
    .limit(1);

  if (countError) return { error: countError.message };
  const anyPublished = (published ?? []).length > 0;

  const { data: design } = await supabase
    .from("designs")
    .select("published_to_ecommerce, published_at")
    .eq("id", designId)
    .maybeSingle();

  if (design?.published_to_ecommerce === anyPublished) return { error: null };

  const { error } = await supabase
    .from("designs")
    .update({
      published_to_ecommerce: anyPublished,
      published_at: anyPublished ? new Date().toISOString() : null,
    })
    .eq("id", designId);

  return { error: error?.message ?? null };
}

// Un listado sin tallas publicado no se puede comprar (no hay selector de
// talla en /catalogo/[slug]).
export async function productHasSizes(supabase: ServiceClient, productId: string): Promise<boolean> {
  const { data } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)
    .limit(1);
  return (data ?? []).length > 0;
}
