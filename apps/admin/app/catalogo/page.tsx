import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { actualizarProductoCatalogo, toggleProductoPublicado } from "./actions";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

interface ProductRow {
  id: string;
  design_id: string | null;
  name: string;
  slug: string;
  base_price_cop: number;
  is_published: boolean;
  collection_id: string | null;
  is_featured: boolean;
  is_bestseller: boolean;
}

interface CollectionRow {
  id: string;
  name: string;
}

interface DesignRow {
  id: string;
  image_url: string | null;
}

interface DesignImageRow {
  design_id: string;
  image_url: string;
  is_cover: boolean;
}

interface GiftSegmentRow {
  id: string;
  name: string;
}

interface ProductGiftSegmentRow {
  product_id: string;
  gift_segment_id: string;
}

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [
    { data: productsData, error: productsError },
    { data: collectionsData },
    { data: designsData },
    { data: imagesData },
    { data: giftSegmentsData },
    { data: productGiftSegmentsData },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, design_id, name, slug, base_price_cop, is_published, collection_id, is_featured, is_bestseller"
      )
      .order("created_at", { ascending: false }),
    supabase.from("collections").select("id, name").order("name", { ascending: true }),
    supabase.from("designs").select("id, image_url"),
    supabase.from("design_images").select("design_id, image_url, is_cover"),
    supabase.from("gift_segments").select("id, name").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("product_gift_segments").select("product_id, gift_segment_id"),
  ]);

  const products = (productsData ?? []) as unknown as ProductRow[];
  const collections = (collectionsData ?? []) as unknown as CollectionRow[];
  const designs = (designsData ?? []) as unknown as DesignRow[];
  const images = (imagesData ?? []) as unknown as DesignImageRow[];
  const giftSegments = (giftSegmentsData ?? []) as unknown as GiftSegmentRow[];
  const productGiftSegments = (productGiftSegmentsData ?? []) as unknown as ProductGiftSegmentRow[];

  const designImageById = new Map(designs.map((d) => [d.id, d.image_url]));
  const coverByDesignId = new Map<string, string>();
  for (const img of images) {
    const current = coverByDesignId.get(img.design_id);
    if (!current || img.is_cover) {
      coverByDesignId.set(img.design_id, img.image_url);
    }
  }

  const segmentIdsByProductId = new Map<string, Set<string>>();
  for (const row of productGiftSegments) {
    const set = segmentIdsByProductId.get(row.product_id) ?? new Set<string>();
    set.add(row.gift_segment_id);
    segmentIdsByProductId.set(row.product_id, set);
  }

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Catálogo</h1>
          <p className="text-neutral-600">
            Qué se ve en la web: colecciones, destacados, más vendidos y
            publicación de cada producto.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/catalogo/regalos"
            className="bg-white border border-neutral-300 text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
          >
            Gestionar regalos
          </Link>
          <Link
            href="/catalogo/colecciones"
            className="bg-ricamo-black text-white font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
          >
            Gestionar colecciones
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}
      {productsError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando productos: {productsError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
        {products.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay productos publicables — crea uno desde Diseños
            (&quot;Crear producto y publicar&quot;).
          </p>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Colección y curación</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Publicación</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const thumbnail = product.design_id
                  ? (coverByDesignId.get(product.design_id) ?? designImageById.get(product.design_id))
                  : null;

                return (
                  <tr key={product.id} className="border-b border-neutral-100 last:border-0 align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnail}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-neutral-400">/{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={actualizarProductoCatalogo}
                        className="flex flex-wrap items-end gap-3"
                      >
                        <input type="hidden" name="id" value={product.id} />
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">Colección</label>
                          <select
                            name="collection_id"
                            defaultValue={product.collection_id ?? ""}
                            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm bg-white"
                          >
                            <option value="">— Ninguna —</option>
                            {collections.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                          <input
                            type="checkbox"
                            name="is_featured"
                            defaultChecked={product.is_featured}
                            className="rounded border-neutral-300"
                          />
                          Destacado
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                          <input
                            type="checkbox"
                            name="is_bestseller"
                            defaultChecked={product.is_bestseller}
                            className="rounded border-neutral-300"
                          />
                          Más vendido
                        </label>
                        {giftSegments.length > 0 && (
                          <div className="w-full">
                            <label className="block text-xs text-neutral-500 mb-1">
                              Regalo para
                            </label>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {giftSegments.map((segment) => (
                                <label
                                  key={segment.id}
                                  className="flex items-center gap-1.5 text-xs text-neutral-600"
                                >
                                  <input
                                    type="checkbox"
                                    name="gift_segment_ids"
                                    value={segment.id}
                                    defaultChecked={segmentIdsByProductId.get(product.id)?.has(segment.id) ?? false}
                                    className="rounded border-neutral-300"
                                  />
                                  {segment.name}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        <button
                          type="submit"
                          className="text-xs font-semibold text-ricamo-black bg-ricamo-yellow rounded-lg px-3 py-1.5 whitespace-nowrap"
                        >
                          Guardar
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {currencyFormatter.format(product.base_price_cop)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {product.is_published ? (
                          <span className="inline-block rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-1">
                            Publicado
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium px-2 py-1">
                            No publicado
                          </span>
                        )}
                        <form action={toggleProductoPublicado}>
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="is_published" value={String(product.is_published)} />
                          <button
                            type="submit"
                            className="text-xs text-neutral-500 hover:text-ricamo-black underline underline-offset-2 whitespace-nowrap"
                          >
                            {product.is_published ? "Despublicar" : "Publicar"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
