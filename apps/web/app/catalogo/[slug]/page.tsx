import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@ricamo/supabase/server";
import { currencyFormatter, GARMENT_LABELS, TECHNIQUE_LABELS } from "../../../lib/format";
import { buildWhatsAppLink } from "../../../lib/whatsapp";

export const dynamic = "force-dynamic";

interface ProductRow {
  id: string;
  design_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  garment_type: string;
  technique: string;
  base_price_cop: number;
}

interface VariantRow {
  id: string;
  size: string;
  color: string | null;
  price_cop: number;
  stock_quantity: number;
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: productData } = await supabase
    .from("products")
    .select("id, design_id, name, slug, description, garment_type, technique, base_price_cop")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!productData) {
    notFound();
  }

  const product = productData as unknown as ProductRow;

  const [{ data: variantsData }, { data: designData }] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id, size, color, price_cop, stock_quantity")
      .eq("product_id", product.id)
      .order("size", { ascending: true }),
    product.design_id
      ? supabase.from("designs").select("image_url").eq("id", product.design_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const variants = (variantsData ?? []) as unknown as VariantRow[];
  const imageUrl = (designData as { image_url: string | null } | null)?.image_url ?? null;

  const sizes = [...new Set(variants.map((v) => v.size))];
  const colors = [...new Set(variants.map((v) => v.color).filter((c): c is string => Boolean(c)))];
  const inStock = variants.some((v) => v.stock_quantity > 0);

  const whatsappMessage = [
    `Hola! Me interesa "${product.name}" ($${currencyFormatter.format(product.base_price_cop)}) del catálogo de Ricamo.`,
    sizes.length > 0 ? `Tallas disponibles: ${sizes.join(", ")}.` : null,
    "¿Me ayudas con el pedido?",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <Link href="/catalogo" className="text-sm font-semibold text-ricamo-black/60 hover:text-ricamo-black">
        ← Catálogo
      </Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-ricamo-bone">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-ricamo-black/15"
                aria-hidden="true"
              >
                <path d="M8 3 6 6H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2l-2-3H8Z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          )}
        </div>

        <div>
          <div className="flex gap-2 mb-4">
            <span className="inline-block rounded-full bg-ricamo-yellow px-3 py-1 text-xs font-semibold">
              {TECHNIQUE_LABELS[product.technique] ?? product.technique}
            </span>
            <span className="inline-block rounded-full bg-black/5 px-3 py-1 text-xs font-semibold">
              {GARMENT_LABELS[product.garment_type] ?? product.garment_type}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl mb-3">{product.name}</h1>
          <p className="text-2xl font-bold mb-6">
            {currencyFormatter.format(product.base_price_cop)}
          </p>

          {product.description && (
            <p className="text-ricamo-black/70 leading-relaxed mb-6">{product.description}</p>
          )}

          {sizes.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">Tallas disponibles</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <span
                    key={size}
                    className="w-11 h-11 flex items-center justify-center rounded-full border border-black/15 text-sm font-semibold"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold mb-2">Colores</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <span
                    key={color}
                    className="px-3 py-1.5 rounded-full border border-black/15 text-sm"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!inStock && variants.length > 0 && (
            <p className="text-sm text-ricamo-red font-semibold mb-4">
              Agotado por ahora — escríbenos y te avisamos cuando vuelva.
            </p>
          )}

          <a
            href={buildWhatsAppLink(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto bg-ricamo-red text-white font-semibold rounded-full px-8 py-4 hover:bg-ricamo-black transition-colors"
          >
            Pedir por WhatsApp
          </a>

          <p className="text-xs text-ricamo-black/50 mt-3">
            Cerramos el pedido contigo por WhatsApp — talla, color y envío se
            confirman ahí.
          </p>

          <div className="mt-8 pt-6 border-t border-black/10">
            <p className="text-sm text-ricamo-black/60">
              ¿Quieres este diseño pero en otra técnica o con tu toque? {" "}
              <Link href="/personalizados" className="text-ricamo-red font-semibold underline underline-offset-4">
                Personalízalo
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
