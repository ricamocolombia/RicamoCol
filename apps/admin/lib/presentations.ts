import type { createServiceRoleClient } from "@ricamo/supabase/server";

// Catalogo fijo de presentaciones (prenda + corte) que ofrece el negocio.
// En estampado el precio es fijo por presentacion (garment_presentation_prices,
// editable en /configuracion); en bordado el precio varia por diseño y se
// escribe a mano. `key` es lo que se guarda en products.garment_type (y lo
// que apps/web/lib/format.ts traduce a etiqueta).
export const PRESENTATIONS = [
  {
    key: "camiseta regular",
    label: "Camiseta Regular",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_camiseta_regular",
  },
  {
    key: "camiseta oversize",
    label: "Camiseta Oversize",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_camiseta_oversize",
  },
  {
    key: "buzo cuello redondo",
    label: "Buzo Cuello Redondo",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_buzo_cuello_redondo",
  },
  {
    key: "buzo capucha",
    label: "Buzo Capucha",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_buzo_capucha",
  },
  { key: "tank top", label: "Tank top", techniques: ["bordado"], estampadoPriceKey: null },
] as const;

export type Presentation = (typeof PRESENTATIONS)[number];

export const PRESENTATION_LABELS: Record<string, string> = Object.fromEntries(
  PRESENTATIONS.map((p) => [p.key, p.label])
);

// Todas las tallas que maneja el negocio. Todo se produce a la medida
// despues del pago, asi que cada prenda publicada se ofrece SIEMPRE en todas
// (el cliente elige la suya en la web). Para agregar o quitar una talla del
// negocio se cambia aqui, y los listados existentes se completan con el
// boton "Completar tallas" de /disenos/[id]/catalogo.
export const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];

// El input de precio de cada presentacion (solo aplica en bordado) se
// nombra price__<key con espacios como guion bajo>.
export function priceFieldName(key: string): string {
  return `price__${key.replace(/\s+/g, "_")}`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Slug unico en products (agrega -2, -3... si ya existe).
export async function crearSlugUnico(
  supabase: ReturnType<typeof createServiceRoleClient>,
  base: string,
  reserved: Set<string> = new Set()
): Promise<string> {
  const baseSlug = slugify(base) || "producto";
  let slug = baseSlug;
  let suffix = 1;
  while (suffix <= 50) {
    if (!reserved.has(slug)) {
      const { data: collision } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!collision) break;
    }
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
  return slug;
}

// Agrega a un listado las tallas de SIZE_OPTIONS que le falten, al precio
// del listado.
export async function insertarTallasFaltantes(
  supabase: ReturnType<typeof createServiceRoleClient>,
  productId: string
): Promise<{ error: string | null }> {
  const [{ data: product }, { data: variants }] = await Promise.all([
    supabase.from("products").select("base_price_cop").eq("id", productId).maybeSingle(),
    supabase.from("product_variants").select("size").eq("product_id", productId),
  ]);
  if (!product) return { error: "No se encontró la prenda" };
  const have = new Set((variants ?? []).map((v) => v.size));
  const missing = SIZE_OPTIONS.filter((size) => !have.has(size));
  if (missing.length === 0) return { error: null };
  const { error } = await supabase
    .from("product_variants")
    .insert(missing.map((size) => ({ product_id: productId, size, price_cop: product.base_price_cop })));
  return { error: error?.message ?? null };
}
