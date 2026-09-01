import Link from "next/link";
import { createClient } from "@ricamo/supabase/server";
import { ProductCard, type ProductCardData } from "../../components/ProductCard";
import { GARMENT_LABELS, TECHNIQUE_LABELS } from "../../lib/format";
import { attachCatalogData, type CatalogProductInput } from "../../lib/catalog";

export const dynamic = "force-dynamic";

interface CollectionRow {
  id: string;
  name: string;
  slug: string;
}

const GARMENT_FILTERS = ["camiseta", "buzo"];
const TECHNIQUE_FILTERS = ["bordado", "estampado"];

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ tecnica?: string; prenda?: string; coleccion?: string }>;
}) {
  const { tecnica, prenda, coleccion } = await searchParams;
  const supabase = await createClient();

  const { data: collectionsData } = await supabase
    .from("collections")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });
  const collections = (collectionsData ?? []) as unknown as CollectionRow[];
  const activeCollection = coleccion ? collections.find((c) => c.slug === coleccion) : undefined;

  let query = supabase
    .from("products")
    .select(
      "id, design_id, name, slug, garment_type, technique, base_price_cop, collection_id, is_bestseller, created_at"
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (tecnica && TECHNIQUE_FILTERS.includes(tecnica)) {
    query = query.eq("technique", tecnica);
  }
  if (prenda && GARMENT_FILTERS.includes(prenda)) {
    query = query.eq("garment_type", prenda);
  }
  if (activeCollection) {
    query = query.eq("collection_id", activeCollection.id);
  }

  const { data: productsData, error } = await query;
  const products = (productsData ?? []) as unknown as CatalogProductInput[];

  const items: ProductCardData[] = await attachCatalogData(supabase, products);

  function filterHref(next: { tecnica?: string; prenda?: string; coleccion?: string }) {
    const params = new URLSearchParams();
    const t = next.tecnica ?? tecnica;
    const p = next.prenda ?? prenda;
    const c = next.coleccion ?? coleccion;
    if (t) params.set("tecnica", t);
    if (p) params.set("prenda", p);
    if (c) params.set("coleccion", c);
    const qs = params.toString();
    return qs ? `/catalogo?${qs}` : "/catalogo";
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Catálogo</h1>
        <p className="text-ricamo-black/60 max-w-xl">
          Prendas ya diseñadas por Maria Jose, listas para pedir. ¿No ves lo
          tuyo?{" "}
          <Link href="/personalizados" className="text-ricamo-red font-semibold underline underline-offset-4">
            Personalízalo desde cero
          </Link>
          .
        </p>
      </div>

      {collections.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={coleccion === c.slug ? filterHref({ coleccion: undefined }) : filterHref({ coleccion: c.slug })}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                coleccion === c.slug
                  ? "bg-ricamo-red text-white border-ricamo-red"
                  : "border-ricamo-red/30 text-ricamo-red hover:border-ricamo-red"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/catalogo"
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            !tecnica && !prenda
              ? "bg-ricamo-black text-white border-ricamo-black"
              : "border-black/15 hover:border-ricamo-black"
          }`}
        >
          Todo
        </Link>
        {TECHNIQUE_FILTERS.map((t) => (
          <Link
            key={t}
            href={tecnica === t ? filterHref({ tecnica: undefined }) : filterHref({ tecnica: t })}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              tecnica === t
                ? "bg-ricamo-black text-white border-ricamo-black"
                : "border-black/15 hover:border-ricamo-black"
            }`}
          >
            {TECHNIQUE_LABELS[t]}
          </Link>
        ))}
        <span className="w-px bg-black/10 mx-1" />
        {GARMENT_FILTERS.map((g) => (
          <Link
            key={g}
            href={prenda === g ? filterHref({ prenda: undefined }) : filterHref({ prenda: g })}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              prenda === g
                ? "bg-ricamo-black text-white border-ricamo-black"
                : "border-black/15 hover:border-ricamo-black"
            }`}
          >
            {GARMENT_LABELS[g]}
          </Link>
        ))}
      </div>

      {error && (
        <p className="text-sm text-ricamo-red mb-6">
          No se pudo cargar el catálogo en este momento.
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/15 bg-white px-8 py-20 text-center">
          <p className="font-display text-xl mb-2">
            Todavía no hay prendas con estos filtros
          </p>
          <p className="text-sm text-ricamo-black/60 max-w-md mx-auto mb-6">
            Prueba con otro filtro, o cuéntanos exactamente qué buscas y te lo
            diseñamos.
          </p>
          <Link
            href="/personalizados"
            className="inline-flex items-center bg-ricamo-red text-white font-semibold rounded-full px-6 py-3 hover:bg-ricamo-black transition-colors"
          >
            Personaliza tu prenda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
          {items.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
