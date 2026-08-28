import Link from "next/link";
import { createClient } from "@ricamo/supabase/server";
import { ProductCard, type ProductCardData } from "../../components/ProductCard";
import { GARMENT_LABELS, TECHNIQUE_LABELS } from "../../lib/format";

export const dynamic = "force-dynamic";

interface ProductRow {
  id: string;
  design_id: string | null;
  name: string;
  slug: string;
  garment_type: string;
  technique: string;
  base_price_cop: number;
}

interface DesignRow {
  id: string;
  image_url: string | null;
}

const GARMENT_FILTERS = ["camiseta", "buzo"];
const TECHNIQUE_FILTERS = ["bordado", "estampado"];

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ tecnica?: string; prenda?: string }>;
}) {
  const { tecnica, prenda } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, design_id, name, slug, garment_type, technique, base_price_cop")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (tecnica && TECHNIQUE_FILTERS.includes(tecnica)) {
    query = query.eq("technique", tecnica);
  }
  if (prenda && GARMENT_FILTERS.includes(prenda)) {
    query = query.eq("garment_type", prenda);
  }

  const { data: productsData, error } = await query;
  const products = (productsData ?? []) as unknown as ProductRow[];

  const designIds = products.map((p) => p.design_id).filter((id): id is string => Boolean(id));
  const designsById = new Map<string, DesignRow>();
  if (designIds.length > 0) {
    const { data: designsData } = await supabase
      .from("designs")
      .select("id, image_url")
      .in("id", designIds);
    for (const d of (designsData ?? []) as unknown as DesignRow[]) {
      designsById.set(d.id, d);
    }
  }

  const items: ProductCardData[] = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    imageUrl: p.design_id ? designsById.get(p.design_id)?.image_url ?? null : null,
    priceCop: p.base_price_cop,
    garmentType: p.garment_type,
    technique: p.technique,
  }));

  function filterHref(next: { tecnica?: string; prenda?: string }) {
    const params = new URLSearchParams();
    const t = next.tecnica ?? tecnica;
    const p = next.prenda ?? prenda;
    if (t) params.set("tecnica", t);
    if (p) params.set("prenda", p);
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
