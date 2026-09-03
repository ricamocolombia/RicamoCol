import Link from "next/link";
import { createClient } from "@ricamo/supabase/server";
import { ProductCard } from "../../components/ProductCard";
import { getGiftSegmentsWithProducts } from "../../lib/catalog";

export const dynamic = "force-dynamic";

export default async function RegalosPage() {
  const supabase = await createClient();
  const segments = await getGiftSegmentsWithProducts(supabase);
  const hasAnyProduct = segments.some((s) => s.products.length > 0);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-12 max-w-2xl">
        <p className="uppercase tracking-widest text-ricamo-red text-sm font-bold mb-3">
          Ideas de regalo
        </p>
        <h1 className="font-display text-4xl mb-3">Regalos</h1>
        <p className="text-ricamo-black/60">
          Prendas bordadas y estampadas, pensadas para regalar. Elige para
          quién es y encuentra algo que nadie más tiene.
        </p>
      </div>

      {!hasAnyProduct ? (
        <div className="rounded-3xl border border-dashed border-black/15 bg-white px-8 py-20 text-center">
          <p className="font-display text-xl mb-2">
            Las ideas de regalo están tomando forma
          </p>
          <p className="text-sm text-ricamo-black/60 max-w-md mx-auto mb-6">
            Muy pronto vas a encontrar aquí prendas pensadas para regalar.
            Mientras tanto, cuéntanos para quién es y te ayudamos a diseñarlo.
          </p>
          <Link
            href="/personalizados"
            className="inline-flex items-center bg-ricamo-red text-white font-semibold rounded-full px-6 py-3 hover:bg-ricamo-black transition-colors"
          >
            Personaliza un regalo
          </Link>
        </div>
      ) : (
        <div className="space-y-16">
          {segments
            .filter((segment) => segment.products.length > 0)
            .map((segment) => (
              <section key={segment.id}>
                <h2 className="font-display text-3xl mb-6">{segment.name}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
                  {segment.products.map((product) => (
                    <ProductCard key={product.slug} product={product} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </main>
  );
}
