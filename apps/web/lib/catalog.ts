import { createClient } from "@ricamo/supabase/server";
import type { ProductCardData } from "../components/ProductCard";

// "Nuevo" es automatico: cualquier producto publicado hace menos de este
// numero de dias se ve como nuevo, sin necesidad de un campo manual.
const NEW_WITHIN_DAYS = 30;

export interface CatalogProductInput {
  id: string;
  design_id: string | null;
  name: string;
  slug: string;
  garment_type: string;
  technique: string;
  base_price_cop: number;
  collection_id?: string | null;
  is_bestseller?: boolean;
  created_at?: string;
}

// Resuelve, para un lote de productos, su imagen de portada (galeria del
// diseno -> imagen de portada marcada, o la primera; si no hay galeria
// todavia, cae al designs.image_url viejo), el nombre de su coleccion, y una
// insignia (mas vendido tiene prioridad sobre nuevo si aplican ambas).
// Centraliza el join que antes se repetia en cada pagina del ecommerce.
export async function attachCatalogData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  products: CatalogProductInput[]
): Promise<ProductCardData[]> {
  const designIds = products.map((p) => p.design_id).filter((id): id is string => Boolean(id));
  const collectionIds = products
    .map((p) => p.collection_id)
    .filter((id): id is string => Boolean(id));

  const [imagesResult, designsResult, collectionsResult] = await Promise.all([
    designIds.length > 0
      ? supabase
          .from("design_images")
          .select("design_id, image_url, is_cover")
          .in("design_id", designIds)
      : Promise.resolve({ data: [] }),
    designIds.length > 0
      ? supabase.from("designs").select("id, image_url").in("id", designIds)
      : Promise.resolve({ data: [] }),
    collectionIds.length > 0
      ? supabase.from("collections").select("id, name").in("id", collectionIds)
      : Promise.resolve({ data: [] }),
  ]);

  const coverByDesignId = new Map<string, string>();
  for (const img of (imagesResult.data ?? []) as { design_id: string; image_url: string; is_cover: boolean }[]) {
    const current = coverByDesignId.get(img.design_id);
    if (!current || img.is_cover) {
      coverByDesignId.set(img.design_id, img.image_url);
    }
  }

  const legacyImageByDesignId = new Map(
    ((designsResult.data ?? []) as { id: string; image_url: string | null }[]).map((d) => [d.id, d.image_url])
  );

  const collectionNameById = new Map(
    ((collectionsResult.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name])
  );

  const newCutoff = Date.now() - NEW_WITHIN_DAYS * 24 * 60 * 60 * 1000;

  // Un mismo diseño se publica como un producto por prenda (Camiseta
  // Regular, Buzo Capucha...), pero en los listados debe salir UNA sola
  // vez: la prenda se elige dentro del detalle (/catalogo/[slug]). Se
  // agrupa por diseño respetando el orden de llegada; la tarjeta enlaza a
  // la prenda mas barata del grupo y muestra "Desde" ese precio. Los
  // productos sin diseño quedan sueltos.
  const groups: CatalogProductInput[][] = [];
  const groupByDesignId = new Map<string, CatalogProductInput[]>();
  for (const p of products) {
    if (!p.design_id) {
      groups.push([p]);
      continue;
    }
    const existing = groupByDesignId.get(p.design_id);
    if (existing) {
      existing.push(p);
    } else {
      const group = [p];
      groupByDesignId.set(p.design_id, group);
      groups.push(group);
    }
  }

  return groups.map((group) => {
    const p = group.reduce((min, cur) => (cur.base_price_cop < min.base_price_cop ? cur : min));
    const garmentCount = new Set(group.map((g) => g.garment_type)).size;
    const pricesVary = group.some((g) => g.base_price_cop !== p.base_price_cop);
    const imageUrl = p.design_id
      ? (coverByDesignId.get(p.design_id) ?? legacyImageByDesignId.get(p.design_id) ?? null)
      : null;

    let badge: ProductCardData["badge"];
    if (group.some((g) => g.is_bestseller)) {
      badge = "mas_vendido";
    } else if (group.some((g) => g.created_at && new Date(g.created_at).getTime() >= newCutoff)) {
      badge = "nuevo";
    }
    const collectionId = group.find((g) => g.collection_id)?.collection_id;

    return {
      slug: p.slug,
      name: p.name,
      imageUrl,
      priceCop: p.base_price_cop,
      priceFrom: pricesVary,
      garmentType: p.garment_type,
      garmentCount,
      technique: p.technique,
      badge,
      collectionName: collectionId ? collectionNameById.get(collectionId) : null,
    };
  });
}

export interface GiftSegmentWithProducts {
  id: string;
  name: string;
  slug: string;
  products: ProductCardData[];
}

// Para la pagina /regalos: cada segmento activo (para parejas, para
// familiares...) con sus productos publicados. Un producto puede aparecer
// en varios segmentos a la vez (relacion muchos-a-muchos).
export async function getGiftSegmentsWithProducts(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<GiftSegmentWithProducts[]> {
  const { data: segmentsData } = await supabase
    .from("gift_segments")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const segments = (segmentsData ?? []) as { id: string; name: string; slug: string }[];
  if (segments.length === 0) return [];

  const { data: linksData } = await supabase
    .from("product_gift_segments")
    .select("product_id, gift_segment_id")
    .in("gift_segment_id", segments.map((s) => s.id));

  const links = (linksData ?? []) as { product_id: string; gift_segment_id: string }[];
  const productIds = [...new Set(links.map((l) => l.product_id))];
  if (productIds.length === 0) return segments.map((s) => ({ ...s, products: [] }));

  const { data: productsData } = await supabase
    .from("products")
    .select(
      "id, design_id, name, slug, garment_type, technique, base_price_cop, collection_id, is_bestseller, created_at"
    )
    .eq("is_published", true)
    .in("id", productIds);

  const products = (productsData ?? []) as unknown as CatalogProductInput[];
  const productById = new Map(products.map((p) => [p.id, p]));

  // Una tarjeta por diseño dentro de cada segmento (ver attachCatalogData).
  return Promise.all(
    segments.map(async (segment) => {
      const segmentProducts = links
        .filter((l) => l.gift_segment_id === segment.id)
        .map((l) => productById.get(l.product_id))
        .filter((p): p is CatalogProductInput => Boolean(p));
      const cards = segmentProducts.length > 0 ? await attachCatalogData(supabase, segmentProducts) : [];
      return { ...segment, products: cards };
    })
  );
}
