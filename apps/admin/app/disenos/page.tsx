import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { cambiarPublicacionDiseno } from "./actions";
import { PRESENTATION_LABELS } from "../../lib/presentations";

interface DesignRow {
  id: string;
  name: string;
  technique: "bordado" | "estampado";
  image_url: string | null;
  created_at: string;
}

interface ProductRow {
  id: string;
  design_id: string | null;
  garment_type: string;
  is_published: boolean;
  base_price_cop: number;
}

interface DesignImageRow {
  design_id: string;
  image_url: string;
  is_cover: boolean;
}

const TECHNIQUE_LABELS: Record<string, string> = {
  bordado: "Bordado",
  estampado: "Estampado",
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

export default async function DisenosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error: errorParam, ok } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: designsData, error: designsError }, { data: productsData }, { data: imagesData }] =
    await Promise.all([
      supabase
        .from("designs")
        .select("id, name, technique, image_url, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("products").select("id, design_id, garment_type, is_published, base_price_cop"),
      supabase.from("design_images").select("design_id, image_url, is_cover"),
    ]);

  const designs = (designsData ?? []) as unknown as DesignRow[];
  const products = (productsData ?? []) as unknown as ProductRow[];
  const images = (imagesData ?? []) as unknown as DesignImageRow[];

  const productsByDesignId = new Map<string, ProductRow[]>();
  for (const product of products) {
    if (!product.design_id) continue;
    const list = productsByDesignId.get(product.design_id) ?? [];
    list.push(product);
    productsByDesignId.set(product.design_id, list);
  }

  // Portada de la galeria (is_cover), o la primera imagen si ninguna esta
  // marcada, por diseño.
  const coverByDesignId = new Map<string, string>();
  for (const img of images) {
    if (!coverByDesignId.get(img.design_id) || img.is_cover) {
      coverByDesignId.set(img.design_id, img.image_url);
    }
  }

  return (
    <main className="px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Diseños</h1>
          <p className="text-neutral-600">
            Los diseños del catálogo de Maria Jose. Lo que está publicado se ve en la página.
          </p>
        </div>
        <Link
          href="/disenos/nueva"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
        >
          + Montar diseño
        </Link>
      </div>

      {ok && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2 mb-4">
          {ok}
        </p>
      )}
      {errorParam && <p className="text-sm text-ricamo-red mb-4">{errorParam}</p>}
      {designsError && (
        <p className="text-sm text-ricamo-red mb-4">Error cargando diseños: {designsError.message}</p>
      )}

      {designs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="text-neutral-500 mb-4">Todavía no hay diseños.</p>
          <Link
            href="/disenos/nueva"
            className="inline-block bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
          >
            Montar el primero
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {designs.map((design) => {
            const designProducts = productsByDesignId.get(design.id) ?? [];
            const isPublished = designProducts.some((p) => p.is_published);
            const thumbnail = coverByDesignId.get(design.id) ?? design.image_url;
            const prices = designProducts.map((p) => p.base_price_cop);
            const minPrice = prices.length > 0 ? Math.min(...prices) : null;

            return (
              <div
                key={design.id}
                className="rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col"
              >
                <div className="relative aspect-square bg-neutral-100">
                  {thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbnail} alt={design.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                      Sin foto
                    </div>
                  )}
                  <span
                    className={`absolute top-2 left-2 rounded-full text-xs font-semibold px-2 py-1 ${
                      isPublished ? "bg-green-100 text-green-700" : "bg-white/90 text-neutral-500"
                    }`}
                  >
                    {isPublished ? "En la página" : "Oculto"}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div>
                    <p className="font-semibold leading-tight">{design.name}</p>
                    <p className="text-xs text-neutral-500">
                      {TECHNIQUE_LABELS[design.technique] ?? design.technique}
                      {minPrice !== null && ` · desde ${currencyFormatter.format(minPrice)}`}
                    </p>
                  </div>

                  <p className="text-xs text-neutral-600">
                    {designProducts.length > 0
                      ? designProducts
                          .map((p) => PRESENTATION_LABELS[p.garment_type] ?? p.garment_type)
                          .join(" · ")
                      : "Sin prendas todavía"}
                  </p>

                  <div className="mt-auto pt-2 flex flex-col gap-1.5">
                    {designProducts.length > 0 && (
                      <form action={cambiarPublicacionDiseno}>
                        <input type="hidden" name="id" value={design.id} />
                        <input type="hidden" name="publish" value={isPublished ? "false" : "true"} />
                        <button
                          type="submit"
                          className={`w-full text-xs font-semibold rounded-lg px-2 py-1.5 ${
                            isPublished
                              ? "border border-neutral-300 text-neutral-600 hover:border-ricamo-red hover:text-ricamo-red"
                              : "bg-ricamo-yellow text-ricamo-black"
                          }`}
                        >
                          {isPublished ? "Ocultar de la página" : "Publicar en la página"}
                        </button>
                      </form>
                    )}
                    <div className="flex gap-1.5">
                      <Link
                        href={`/disenos/${design.id}/editar`}
                        className="flex-1 text-xs text-center rounded-lg px-2 py-1.5 border border-neutral-300 text-neutral-700 hover:border-ricamo-black"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/disenos/${design.id}/catalogo`}
                        className="flex-1 text-xs text-center rounded-lg px-2 py-1.5 border border-neutral-300 text-neutral-700 hover:border-ricamo-black"
                      >
                        Prendas y tallas
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
