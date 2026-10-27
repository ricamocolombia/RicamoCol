import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@ricamo/supabase/server";
import { currencyFormatter, GARMENT_LABELS, TECHNIQUE_LABELS } from "../../../../lib/format";
import { PaymentProofDropzone } from "../../../../components/PaymentProofDropzone";
import { QuantityTotal } from "../../../../components/QuantityTotal";
import { crearPedidoConComprobante } from "./actions";

export const dynamic = "force-dynamic";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  garment_type: string;
  technique: string;
  base_price_cop: number;
}

interface VariantRow {
  id: string;
  product_id: string;
  size: string;
  price_cop: number;
}

export default async function ComprarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variante?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { variante, error } = await searchParams;
  const supabase = await createClient();

  const { data: productData } = await supabase
    .from("products")
    .select("id, name, slug, garment_type, technique, base_price_cop")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!productData) {
    notFound();
  }
  const product = productData as unknown as ProductRow;

  const { data: variantData } = variante
    ? await supabase
        .from("product_variants")
        .select("id, product_id, size, price_cop")
        .eq("id", variante)
        .maybeSingle()
    : { data: null };

  const variant = variantData as unknown as VariantRow | null;

  if (!variant || variant.product_id !== product.id) {
    notFound();
  }

  const { data: settingsData } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["payment_qr_image_url", "payment_bank_account_info"]);

  const settingsRows = (settingsData ?? []) as unknown as { key: string; value: string | null }[];
  const settings = new Map(settingsRows.map((s) => [s.key, s.value]));
  const qrImageUrl = settings.get("payment_qr_image_url");
  const bankAccountInfo = settings.get("payment_bank_account_info");

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link
        href={`/catalogo/${product.slug}`}
        className="text-sm font-semibold text-ricamo-black/60 hover:text-ricamo-black"
      >
        ← {product.name}
      </Link>

      <h1 className="font-display text-3xl sm:text-4xl mt-4 mb-1">Finaliza tu compra</h1>
      <p className="text-ricamo-black/60 mb-8">
        Transfiere el valor, sube el comprobante y Maria Jose confirma tu
        pedido en máximo 4 horas hábiles.
      </p>

      {error && (
        <p className="text-sm text-ricamo-red bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">
          {error}
        </p>
      )}

      <div className="rounded-3xl bg-white border border-black/10 p-6 mb-6">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-ricamo-black/50 mb-3">
          Tu pedido
        </h2>
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-semibold">{product.name}</p>
            <p className="text-ricamo-black/60">
              {TECHNIQUE_LABELS[product.technique] ?? product.technique} ·{" "}
              {GARMENT_LABELS[product.garment_type] ?? product.garment_type} · Talla {variant.size}
            </p>
          </div>
          <p className="text-right">
            <span className="font-bold text-lg">{currencyFormatter.format(variant.price_cop)}</span>
            <span className="block text-xs text-ricamo-black/50">por unidad</span>
          </p>
        </div>
      </div>

      <form action={crearPedidoConComprobante} className="space-y-6">
        <input type="hidden" name="product_id" value={product.id} />
        <input type="hidden" name="variant_id" value={variant.id} />

        <div className="rounded-3xl bg-white border border-black/10 p-6 space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-ricamo-black/50">
            Tus datos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nombre *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded-xl border border-black/15 px-4 py-2.5"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                WhatsApp *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="300 000 0000"
                className="w-full rounded-xl border border-black/15 px-4 py-2.5"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Correo (opcional)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-xl border border-black/15 px-4 py-2.5"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1">
                Ciudad
              </label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="Medellín"
                className="w-full rounded-xl border border-black/15 px-4 py-2.5"
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Dirección de envío
              </label>
              <input
                id="address"
                name="address"
                type="text"
                className="w-full rounded-xl border border-black/15 px-4 py-2.5"
              />
            </div>
            <QuantityTotal unitPriceCop={variant.price_cop} max={20} />
          </div>
          <div>
            <label htmlFor="adaptation" className="block text-sm font-medium mb-1">
              ¿Quieres alguna adaptación? (opcional)
            </label>
            <textarea
              id="adaptation"
              name="adaptation"
              rows={3}
              maxLength={1000}
              placeholder="Ej: cambiar el nombre de la ciudad, otro color de hilo, agregar una fecha..."
              className="w-full rounded-xl border border-black/15 px-4 py-2.5"
            />
            <p className="text-xs text-ricamo-black/50 mt-1">
              Cada prenda se hace a tu medida. Si pides un cambio, Maria Jose te
              confirma por WhatsApp antes de producirla.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-black/10 p-6 space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-ricamo-black/50">
            Transfiere y sube tu comprobante
          </h2>

          {qrImageUrl ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative w-48 h-48 rounded-2xl overflow-hidden border border-black/10 bg-ricamo-bone">
                <Image src={qrImageUrl} alt="QR de pago Ricamo" fill sizes="192px" className="object-contain" />
              </div>
              {bankAccountInfo && (
                <p className="text-sm text-center text-ricamo-black/70 whitespace-pre-line">
                  {bankAccountInfo}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-ricamo-black/60">
              Escríbenos por WhatsApp y te compartimos los datos de la cuenta
              para transferir.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Comprobante de pago *</label>
            <PaymentProofDropzone name="payment_proof" />
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center bg-ricamo-red text-white font-semibold rounded-full px-8 py-4 hover:bg-ricamo-black transition-colors"
        >
          Enviar comprobante
        </button>
        <p className="text-xs text-ricamo-black/50">
          Al enviar, Maria Jose recibe tu pedido y lo confirma en máximo 4
          horas hábiles — no se produce nada hasta que el pago quede
          validado.
        </p>
      </form>
    </main>
  );
}
