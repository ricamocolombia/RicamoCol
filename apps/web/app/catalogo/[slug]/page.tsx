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
}

interface SiblingProductRow {
  id: string;
  name: string;
  slug: string;
  garment_type: string;
  base_price_cop: number;
}

const SIZE_ORDER = ["2", "4", "6", "8", "10", "12", "14", "16", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
function sizeRank(size: string): number {
  const index = SIZE_ORDER.indexOf(size.trim().toUpperCase());
  return index === -1 ? SIZE_ORDER.length : index;
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

  const [{ data: variantsData }, { data: galleryData }, { data: designData }, { data: siblingsData }] =
    await Promise.all([
      supabase
        .from("product_variants")
        .select("id, size, color, price_cop")
        .eq("product_id", product.id),
      product.design_id
        ? supabase
            .from("design_images")
            .select("id, image_url, is_cover")
            .eq("design_id", product.design_id)
            .order("is_cover", { ascending: false })
        : Promise.resolve({ data: [] }),
      product.design_id
        ? supabase.from("designs").select("image_url").eq("id", product.design_id).maybeSingle()
        : Promise.resolve({ data: null }),
      product.design_id
        ? supabase
            .from("products")
            .select("id, name, slug, garment_type, base_price_cop")
            .eq("design_id", product.design_id)
            .eq("is_published", true)
            .order("base_price_cop", { ascending: true })
        : Promise.resolve({ data: [] }),
    ]);

  const variants = (variantsData ?? []) as unknown as VariantRow[];
  const gallery = (galleryData ?? []) as unknown as { id: string; image_url: string }[];
  const legacyImageUrl = (designData as { image_url: string | null } | null)?.image_url ?? null;
  const images = gallery.length > 0 ? gallery.map((g) => g.image_url) : legacyImageUrl ? [legacyImageUrl] : [];
  const [mainImageUrl, ...restImages] = images;

  // Video del diseño (opcional, hasta 1). Consulta aparte y tolerante a
  // error: si falla, la pagina sigue mostrando las fotos normalmente.
  const { data: videoData } = product.design_id
    ? await supabase.from("designs").select("video_url").eq("id", product.design_id).maybeSingle()
    : { data: null };
  const videoUrl = (videoData as { video_url: string | null } | null)?.video_url ?? null;
  // Todas las prendas publicadas del mismo diseño (incluida esta): en los
  // listados el diseño sale una sola vez y la prenda se elige aqui. Cada
  // prenda es su propio producto/URL, asi el checkout no cambia.
  const garmentOptions = (siblingsData ?? []) as unknown as SiblingProductRow[];

  // Orden de tallas natural (ninos 4..16, luego S..XXL), no alfabetico.
  variants.sort((a, b) => sizeRank(a.size) - sizeRank(b.size) || a.size.localeCompare(b.size, "es"));
  const prices = variants.map((v) => v.price_cop);
  const minPrice = prices.length > 0 ? Math.min(...prices) : product.base_price_cop;
  const pricesVary = prices.some((p) => p !== prices[0]);
  const sizes = [...new Set(variants.map((v) => v.size))];
  const colors = [...new Set(variants.map((v) => v.color).filter((c): c is string => Boolean(c)))];

  const whatsappMessage = [
    `Hola! Me interesa "${product.name}" en ${GARMENT_LABELS[product.garment_type] ?? product.garment_type} (${pricesVary ? "desde " : ""}${currencyFormatter.format(minPrice)}) del catálogo de Ricamo.`,
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
        <div>
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-ricamo-bone">
            {mainImageUrl ? (
              <Image
                src={mainImageUrl}
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

          {videoUrl && (
            <video
              src={videoUrl}
              controls
              playsInline
              muted
              loop
              preload="metadata"
              className="w-full mt-3 rounded-2xl bg-ricamo-bone"
            />
          )}

          {restImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {restImages.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-ricamo-bone">
                  <Image
                    src={url}
                    alt={`${product.name} — foto ${i + 2}`}
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </div>
              ))}
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
            {pricesVary && <span className="text-base font-semibold text-ricamo-black/60">Desde </span>}
            {currencyFormatter.format(minPrice)}
          </p>

          {product.description && (
            <p className="text-ricamo-black/70 leading-relaxed mb-6">{product.description}</p>
          )}

          {garmentOptions.length > 1 && (
            <div className="mb-5">
              <p className="text-sm font-semibold mb-2">1. Elige tu prenda</p>
              <div className="flex flex-wrap gap-2">
                {garmentOptions.map((option) => {
                  const isCurrent = option.id === product.id;
                  return (
                    <Link
                      key={option.id}
                      href={`/catalogo/${option.slug}`}
                      scroll={false}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`px-4 py-2 rounded-2xl border text-sm transition-colors ${
                        isCurrent
                          ? "border-ricamo-black bg-ricamo-black text-white"
                          : "border-black/15 hover:border-ricamo-black"
                      }`}
                    >
                      <span className="font-semibold">
                        {GARMENT_LABELS[option.garment_type] ?? option.garment_type}
                      </span>
                      <span className={`block text-xs ${isCurrent ? "text-white/70" : "text-ricamo-black/60"}`}>
                        {currencyFormatter.format(option.base_price_cop)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {variants.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">
                {garmentOptions.length > 1 ? "2. Elige tu talla para comprar" : "Elige tu talla para comprar"}
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <Link
                    key={variant.id}
                    href={`/catalogo/${product.slug}/comprar?variante=${variant.id}`}
                    className="min-w-11 h-11 px-3 flex items-center justify-center rounded-full border border-black/15 text-sm font-semibold hover:border-ricamo-red hover:text-ricamo-red transition-colors"
                  >
                    {variant.size}
                    {pricesVary && (
                      <span className="ml-1.5 text-xs font-normal text-ricamo-black/60">
                        {currencyFormatter.format(variant.price_cop)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
              <p className="text-xs text-ricamo-black/50 mt-2">
                Pago por transferencia — subes el comprobante y Maria Jose lo confirma en máximo 4 horas hábiles.
              </p>
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

          <a
            href={buildWhatsAppLink(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto border border-black/15 text-ricamo-black font-semibold rounded-full px-8 py-4 hover:border-ricamo-black transition-colors"
          >
            Prefiero preguntar por WhatsApp
          </a>

          <p className="text-xs text-ricamo-black/50 mt-3">
            ¿Dudas antes de comprar, o quieres ajustar algo? Escríbenos y
            cerramos el pedido contigo por WhatsApp.
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
