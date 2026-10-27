import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { montarDiseno } from "./actions";
import { ImageDropzone } from "../../../components/ImageDropzone";
import { GarmentPicker } from "../../../components/GarmentPicker";
import { SIZE_OPTIONS } from "../../../lib/presentations";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

export default async function MontarDisenoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: pricesData }, { data: collectionsData }] = await Promise.all([
    supabase.from("garment_presentation_prices").select("presentation, cost_cop"),
    supabase.from("collections").select("id, name").order("name", { ascending: true }),
  ]);

  const estampadoPrices: Record<string, number | null> = Object.fromEntries(
    (pricesData ?? []).map((p) => [p.presentation, p.cost_cop])
  );
  const collections = (collectionsData ?? []) as { id: string; name: string }[];

  return (
    <main className="px-6 py-10 max-w-2xl">
      <div className="mb-6">
        <Link href="/disenos" className="text-sm text-neutral-500 hover:text-ricamo-black">
          ← Diseños
        </Link>
        <h1 className="text-2xl font-bold mt-2">Montar diseño</h1>
        <p className="text-neutral-600 text-sm mt-1">
          Sube el diseño con sus fotos, elige en qué prendas y tallas se vende, y queda
          publicado en la página de una vez.
        </p>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <form action={montarDiseno} className="space-y-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nombre del diseño *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ej: Mapa Medellín sello postal"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Lo que verán los clientes en la página del producto"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <p className="block text-sm font-medium mb-1">Fotos *</p>
            <p className="text-xs text-neutral-500 mb-2">La primera foto queda como portada.</p>
            <ImageDropzone name="images" multiple />
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-5">
          <GarmentPicker estampadoPrices={estampadoPrices} />

          <p className="text-xs text-neutral-500">
            Se publica en todas las tallas ({SIZE_OPTIONS.join(", ")}) — el cliente elige la suya
            al comprar y cuéntanos si quiere alguna adaptación.
          </p>

          {collections.length > 0 && (
            <div>
              <label htmlFor="collection_id" className="block text-sm font-medium mb-1">
                Colección (opcional)
              </label>
              <select
                id="collection_id"
                name="collection_id"
                defaultValue=""
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="">— Sin colección —</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" name="publish" defaultChecked className="rounded border-neutral-300" />
            Publicar en la página de una vez
          </label>
        </section>

        <button
          type="submit"
          className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg py-3"
        >
          Montar diseño
        </button>
      </form>
    </main>
  );
}
