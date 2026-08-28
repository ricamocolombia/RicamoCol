import Link from "next/link";
import { createClient } from "@ricamo/supabase/server";
import { ProductCard, type ProductCardData } from "../components/ProductCard";
import { MariaJoseSpotlight } from "../components/MariaJoseSpotlight";

// Catalogo real, sin cache de build: nunca prerenderizar de forma estatica.
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

async function getFeaturedProducts(): Promise<ProductCardData[]> {
  const supabase = await createClient();

  const { data: productsData } = await supabase
    .from("products")
    .select("id, design_id, name, slug, garment_type, technique, base_price_cop")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(8);

  const products = (productsData ?? []) as unknown as ProductRow[];
  if (products.length === 0) return [];

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

  return products.map((p) => ({
    slug: p.slug,
    name: p.name,
    imageUrl: p.design_id ? designsById.get(p.design_id)?.image_url ?? null : null,
    priceCop: p.base_price_cop,
    garmentType: p.garment_type,
    technique: p.technique,
  }));
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <main>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="uppercase tracking-widest text-ricamo-red text-sm font-bold mb-4">
            Lo creas, lo llevas
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mb-6">
            Bordados y estampados{" "}
            <span className="marker-underline text-ricamo-red">100% tuyos</span>
          </h1>
          <p className="text-ricamo-black/70 text-base sm:text-lg max-w-md mb-8">
            Diseñados por Maria Jose Ruiz, uno por uno. Camisetas y buzos que
            empiezan como una idea tuya y terminan siendo una prenda que
            nadie más tiene.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/personalizados"
              className="inline-flex items-center bg-ricamo-red text-white font-semibold rounded-full px-7 py-3.5 hover:bg-ricamo-black transition-colors"
            >
              Personaliza tu prenda
            </Link>
            <Link
              href="/catalogo"
              className="inline-flex items-center bg-ricamo-black text-white font-semibold rounded-full px-7 py-3.5 hover:bg-ricamo-red transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        </div>

        {/* TODO: reemplazar por una foto real de producto/lifestyle cuando
            el negocio la entregue. Placeholder de marca mientras tanto. */}
        <div className="relative aspect-square rounded-[2.5rem] bg-ricamo-yellow overflow-hidden flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-2/3 h-2/3 text-ricamo-black/90"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M60 30 C40 35, 30 55, 32 78 C34 105, 55 125, 82 128 C112 132, 140 112, 145 82 C150 55, 132 32, 105 30" />
            <path d="M62 82 L70 90 L82 76" />
            <circle cx="70" cy="60" r="4" fill="currentColor" stroke="none" />
            <circle cx="98" cy="58" r="4" fill="currentColor" stroke="none" />
          </svg>
        </div>
      </section>

      {/* Tecnicas */}
      <section className="max-w-6xl mx-auto px-6 pb-16 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link
          href="/catalogo?tecnica=bordado"
          className="group rounded-3xl bg-white border border-black/10 p-8 flex items-center justify-between hover:border-ricamo-black transition-colors cursor-pointer"
        >
          <div>
            <p className="font-display text-2xl mb-1">Bordado</p>
            <p className="text-sm text-ricamo-black/60">
              Hilo, textura y detalle que dura
            </p>
          </div>
          <span className="text-ricamo-red group-hover:translate-x-1 transition-transform">→</span>
        </Link>
        <Link
          href="/catalogo?tecnica=estampado"
          className="group rounded-3xl bg-white border border-black/10 p-8 flex items-center justify-between hover:border-ricamo-black transition-colors cursor-pointer"
        >
          <div>
            <p className="font-display text-2xl mb-1">Estampado</p>
            <p className="text-sm text-ricamo-black/60">
              Diseños a color, tamaño y precisión
            </p>
          </div>
          <span className="text-ricamo-red group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </section>

      {/* Destacados */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl">Destacados</h2>
          <Link
            href="/catalogo"
            className="text-sm font-semibold text-ricamo-red hover:underline underline-offset-4"
          >
            Ver todo el catálogo
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-black/15 bg-white px-8 py-16 text-center">
            <p className="font-display text-xl mb-2">
              El catálogo está tomando forma
            </p>
            <p className="text-sm text-ricamo-black/60 max-w-md mx-auto mb-6">
              Los primeros diseños de Maria Jose están por publicarse. Mientras
              tanto, cuéntanos qué quieres y te lo diseñamos a tu medida.
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
            {featured.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Como funciona */}
      <section className="bg-white border-y border-black/10">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-display text-3xl mb-10 text-center">
            Así de simple
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Cuéntanos tu idea",
                text: "Escríbenos qué prenda quieres, bordado o estampado, y qué diseño tienes en mente.",
              },
              {
                step: "2",
                title: "Apruebas el diseño",
                text: "Maria Jose lo dibuja y te lo muestra antes de producirlo. Nada se hace sin tu ok.",
              },
              {
                step: "3",
                title: "Lo recibes en tu casa",
                text: "Lo enviamos a toda Colombia, listo para usar.",
              },
            ].map((item) => (
              <div key={item.step}>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-ricamo-yellow font-display text-lg mb-4">
                  {item.step}
                </span>
                <p className="font-semibold mb-1">{item.title}</p>
                <p className="text-sm text-ricamo-black/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="py-20">
        <MariaJoseSpotlight compact />
      </div>
    </main>
  );
}
