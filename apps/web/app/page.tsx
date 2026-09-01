import Image from "next/image";
import Link from "next/link";
import { createClient } from "@ricamo/supabase/server";
import { ProductCard, type ProductCardData } from "../components/ProductCard";
import { MariaJoseSpotlight } from "../components/MariaJoseSpotlight";
import { attachCatalogData, type CatalogProductInput } from "../lib/catalog";

// Catalogo real, sin cache de build: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

const FEATURED_LIMIT = 8;
const PRODUCT_COLUMNS =
  "id, design_id, name, slug, garment_type, technique, base_price_cop, collection_id, is_bestseller, created_at";

interface CollectionTeaserRow {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
}

// "Destacados": lo que Maria Jose cura a mano (is_featured); si no alcanza
// el cupo, se rellena con los productos publicados mas recientes que no
// esten ya incluidos, para que la seccion nunca se vea vacia.
async function getFeaturedProducts(): Promise<ProductCardData[]> {
  const supabase = await createClient();

  const { data: featuredData } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(FEATURED_LIMIT);

  const featured = (featuredData ?? []) as unknown as CatalogProductInput[];
  let products = featured;

  if (products.length < FEATURED_LIMIT) {
    const { data: recentData } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(FEATURED_LIMIT);

    const seen = new Set(products.map((p) => p.id));
    const recent = ((recentData ?? []) as unknown as CatalogProductInput[]).filter((p) => !seen.has(p.id));
    products = [...products, ...recent].slice(0, FEATURED_LIMIT);
  }

  if (products.length === 0) return [];
  return attachCatalogData(supabase, products);
}

async function getBestsellerProducts(): Promise<ProductCardData[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_published", true)
    .eq("is_bestseller", true)
    .order("created_at", { ascending: false })
    .limit(FEATURED_LIMIT);

  const products = (data ?? []) as unknown as CatalogProductInput[];
  if (products.length === 0) return [];
  return attachCatalogData(supabase, products);
}

async function getActiveCollections(): Promise<CollectionTeaserRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("collections")
    .select("id, name, slug, cover_image_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(6);
  return (data ?? []) as unknown as CollectionTeaserRow[];
}

export default async function HomePage() {
  const [featured, bestsellers, collections] = await Promise.all([
    getFeaturedProducts(),
    getBestsellerProducts(),
    getActiveCollections(),
  ]);

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
            el negocio la entregue. Mientras tanto, el logo hace de placeholder. */}
        <div className="relative aspect-square rounded-[2.5rem] bg-ricamo-yellow overflow-hidden flex items-center justify-center p-16">
          <Image
            src="/brand/logo-transparente-negro.png"
            alt="Ricamo"
            width={480}
            height={480}
            className="w-full h-full object-contain"
            priority
          />
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

      {/* Colecciones */}
      {collections.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <h2 className="font-display text-3xl mb-6">Colecciones</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/catalogo?coleccion=${c.slug}`}
                className="group relative shrink-0 w-56 aspect-[4/5] rounded-2xl overflow-hidden bg-ricamo-bone"
              >
                {c.cover_image_url ? (
                  <Image src={c.cover_image_url} alt={c.name} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                ) : (
                  <div className="absolute inset-0 bg-ricamo-black/5" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                <p className="absolute bottom-4 left-4 right-4 text-white font-display text-xl leading-tight">
                  {c.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

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

      {/* Mas vendidos */}
      {bestsellers.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-3xl">Más vendidos</h2>
            <Link
              href="/catalogo"
              className="text-sm font-semibold text-ricamo-red hover:underline underline-offset-4"
            >
              Ver todo el catálogo
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
            {bestsellers.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      )}

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
