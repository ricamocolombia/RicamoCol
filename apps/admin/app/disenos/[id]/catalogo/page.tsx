import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import {
  agregarPresentaciones,
  agregarTalla,
  eliminarTalla,
  actualizarListadoCatalogo,
  toggleListadoPublicado,
} from "./actions";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

interface DesignRow {
  id: string;
  name: string;
  technique: "bordado" | "estampado";
  status: string;
  image_url: string | null;
}

interface DesignImageRow {
  design_id: string;
  image_url: string;
  is_cover: boolean;
}

interface ProductRow {
  id: string;
  design_id: string | null;
  name: string;
  slug: string;
  garment_type: string;
  base_price_cop: number;
  is_published: boolean;
  collection_id: string | null;
  is_featured: boolean;
  is_bestseller: boolean;
}

interface VariantRow {
  id: string;
  product_id: string;
  size: string;
  price_cop: number;
}

interface CollectionRow {
  id: string;
  name: string;
}

interface GiftSegmentRow {
  id: string;
  name: string;
}

interface ProductGiftSegmentRow {
  product_id: string;
  gift_segment_id: string;
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

const SIZE_SEED = ["4", "6", "8", "10", "12", "14", "16", "S", "M", "L", "XL", "XXL"];

// Catalogo fijo de presentaciones (prenda + corte). En estampado el precio
// es fijo por presentacion (garment_presentation_prices, editable en
// /configuracion); en bordado el precio varia por diseño y se escribe a
// mano. Duplicado en actions.ts (esa copia valida lo que llega del form).
const PRESENTATIONS = [
  {
    key: "camiseta regular",
    label: "Camiseta Regular",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_camiseta_regular",
  },
  {
    key: "camiseta oversize",
    label: "Camiseta Oversize",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_camiseta_oversize",
  },
  {
    key: "buzo cuello redondo",
    label: "Buzo Cuello Redondo",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_buzo_cuello_redondo",
  },
  {
    key: "buzo capucha",
    label: "Buzo Capucha",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_buzo_capucha",
  },
  { key: "tank top", label: "Tank top", techniques: ["bordado"], estampadoPriceKey: null },
] as const;

const PRESENTATION_LABELS: Record<string, string> = Object.fromEntries(
  PRESENTATIONS.map((p) => [p.key, p.label])
);

function priceFieldName(key: string): string {
  return `price__${key.replace(/\s+/g, "_")}`;
}

export default async function DisenoCatalogoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: designId } = await params;
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data: designData, error: designError } = await supabase
    .from("designs")
    .select("id, name, technique, status, image_url")
    .eq("id", designId)
    .single();

  if (designError || !designData) {
    notFound();
  }

  const design = designData as unknown as DesignRow;

  const [
    { data: productsData, error: productsError },
    { data: imagesData },
    { data: collectionsData },
    { data: giftSegmentsData },
    { data: presentationPricesData },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, design_id, name, slug, garment_type, base_price_cop, is_published, collection_id, is_featured, is_bestseller"
      )
      .eq("design_id", designId)
      .order("created_at", { ascending: true }),
    supabase
      .from("design_images")
      .select("design_id, image_url, is_cover")
      .eq("design_id", designId),
    supabase.from("collections").select("id, name").order("name", { ascending: true }),
    supabase
      .from("gift_segments")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("garment_presentation_prices").select("presentation, cost_cop"),
  ]);

  const products = (productsData ?? []) as unknown as ProductRow[];
  const images = (imagesData ?? []) as unknown as DesignImageRow[];
  const collections = (collectionsData ?? []) as unknown as CollectionRow[];
  const giftSegments = (giftSegmentsData ?? []) as unknown as GiftSegmentRow[];
  const presentationPrices = (presentationPricesData ?? []) as unknown as {
    presentation: string;
    cost_cop: number | null;
  }[];
  const presentationPriceByKey = new Map(
    presentationPrices.map((p) => [p.presentation, p.cost_cop])
  );

  const productIds = products.map((p) => p.id);

  const [{ data: variantsData }, { data: productGiftSegmentsData }] = await Promise.all([
    productIds.length > 0
      ? supabase
          .from("product_variants")
          .select("id, product_id, size, price_cop")
          .in("product_id", productIds)
          .order("size", { ascending: true })
      : Promise.resolve({ data: [] as VariantRow[] }),
    productIds.length > 0
      ? supabase
          .from("product_gift_segments")
          .select("product_id, gift_segment_id")
          .in("product_id", productIds)
      : Promise.resolve({ data: [] as ProductGiftSegmentRow[] }),
  ]);

  const variants = (variantsData ?? []) as unknown as VariantRow[];
  const productGiftSegments = (productGiftSegmentsData ?? []) as unknown as ProductGiftSegmentRow[];

  const variantsByProductId = new Map<string, VariantRow[]>();
  for (const variant of variants) {
    const list = variantsByProductId.get(variant.product_id) ?? [];
    list.push(variant);
    variantsByProductId.set(variant.product_id, list);
  }

  const segmentIdsByProductId = new Map<string, Set<string>>();
  for (const row of productGiftSegments) {
    const set = segmentIdsByProductId.get(row.product_id) ?? new Set<string>();
    set.add(row.gift_segment_id);
    segmentIdsByProductId.set(row.product_id, set);
  }

  const cover =
    images.find((img) => img.is_cover)?.image_url ?? images[0]?.image_url ?? design.image_url;

  const existingGarmentTypes = new Set(products.map((p) => p.garment_type));
  const availablePresentations = PRESENTATIONS.filter(
    (p) =>
      (p.techniques as readonly string[]).includes(design.technique) &&
      !existingGarmentTypes.has(p.key)
  );

  return (
    <main className="px-6 py-10 max-w-4xl">
      <Link
        href="/disenos"
        className="text-sm text-neutral-500 hover:text-ricamo-black underline underline-offset-2"
      >
        ← Volver a Diseños
      </Link>

      <div className="flex items-center gap-4 mt-3 mb-6">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={design.name}
            className="w-16 h-16 rounded-lg object-cover border border-neutral-200 flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-neutral-100 flex-shrink-0" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{design.name}</h1>
          <p className="text-sm text-neutral-500">
            {TECHNIQUE_LABELS[design.technique] ?? design.technique} — el estado (
            {design.status}) es solo del flujo de producción, no bloquea publicar
            este diseño en el catálogo.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}
      {productsError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando productos: {productsError.message}
        </p>
      )}

      <div className="space-y-6">
        {products.map((product) => {
          const productVariants = variantsByProductId.get(product.id) ?? [];
          const selectedSegments = segmentIdsByProductId.get(product.id) ?? new Set<string>();

          return (
            <div key={product.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div>
                  <h2 className="font-semibold text-lg">
                    {PRESENTATION_LABELS[product.garment_type] ?? product.garment_type}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {product.name} · /{product.slug} · {currencyFormatter.format(product.base_price_cop)}
                  </p>
                </div>
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
                  <form action={toggleListadoPublicado}>
                    <input type="hidden" name="design_id" value={designId} />
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
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-neutral-500 mb-2">Tallas disponibles</p>
                {productVariants.length === 0 ? (
                  <p className="text-xs text-neutral-400 mb-2">
                    Todavía no tiene tallas cargadas — agrega al menos una para publicarlo.
                  </p>
                ) : (
                  <table className="w-full text-sm mb-2">
                    <tbody>
                      {productVariants.map((variant) => (
                        <tr key={variant.id} className="border-b border-neutral-100 last:border-0">
                          <td className="py-1.5 font-medium">{variant.size}</td>
                          <td className="py-1.5 text-neutral-500">
                            {currencyFormatter.format(variant.price_cop)}
                          </td>
                          <td className="py-1.5 text-right">
                            <form action={eliminarTalla}>
                              <input type="hidden" name="design_id" value={designId} />
                              <input type="hidden" name="variant_id" value={variant.id} />
                              <button
                                type="submit"
                                className="text-xs text-neutral-400 hover:text-ricamo-red underline underline-offset-2"
                              >
                                Eliminar
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <form action={agregarTalla} className="flex items-end gap-2 flex-wrap">
                  <input type="hidden" name="design_id" value={designId} />
                  <input type="hidden" name="product_id" value={product.id} />
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Talla</label>
                    <input
                      name="size"
                      list={`sizes-${product.id}`}
                      required
                      className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm w-24"
                    />
                    <datalist id={`sizes-${product.id}`}>
                      {SIZE_SEED.map((size) => (
                        <option key={size} value={size} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Precio</label>
                    <input
                      type="number"
                      name="price_cop"
                      min={0}
                      step={1}
                      defaultValue={product.base_price_cop}
                      required
                      className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm w-32"
                    />
                  </div>
                  <button
                    type="submit"
                    className="text-xs font-semibold text-ricamo-black bg-ricamo-yellow rounded-lg px-3 py-1.5 whitespace-nowrap"
                  >
                    + Agregar talla
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <p className="text-xs font-medium text-neutral-500 mb-2">Curación en el catálogo</p>
                <form action={actualizarListadoCatalogo} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="design_id" value={designId} />
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
                      <label className="block text-xs text-neutral-500 mb-1">Regalo para</label>
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
                              defaultChecked={selectedSegments.has(segment.id)}
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
              </div>
            </div>
          );
        })}

        {availablePresentations.length > 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-5">
            <p className="text-xs font-medium text-neutral-500 mb-1">+ Agregar prenda</p>
            <p className="text-xs text-neutral-400 mb-3">
              {design.technique === "estampado"
                ? "Precio fijo por presentación, configurable en Configuración."
                : "El precio de bordado varía por diseño — escríbelo para cada prenda que marques."}
            </p>
            <form action={agregarPresentaciones} className="space-y-2">
              <input type="hidden" name="design_id" value={designId} />
              {availablePresentations.map((presentation) => {
                const inputId = `presentation-${presentation.key.replace(/\s+/g, "-")}`;
                const estampadoPrice =
                  design.technique === "estampado"
                    ? presentationPriceByKey.get(presentation.estampadoPriceKey ?? "")
                    : undefined;

                return (
                  <div key={presentation.key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={inputId}
                      name="presentation_keys"
                      value={presentation.key}
                      className="rounded border-neutral-300"
                    />
                    <label htmlFor={inputId} className="text-sm flex-1">
                      {presentation.label}
                    </label>
                    {design.technique === "estampado" ? (
                      <span className="text-sm text-neutral-500 w-28 text-right">
                        {estampadoPrice != null
                          ? currencyFormatter.format(estampadoPrice)
                          : "Sin definir"}
                      </span>
                    ) : (
                      <input
                        type="number"
                        name={priceFieldName(presentation.key)}
                        min={0}
                        step={1}
                        placeholder="Precio"
                        className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm w-28"
                      />
                    )}
                  </div>
                );
              })}
              <button
                type="submit"
                className="text-xs font-semibold text-white bg-ricamo-black rounded-lg px-3 py-1.5 whitespace-nowrap mt-2"
              >
                Agregar prenda(s) seleccionada(s)
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
