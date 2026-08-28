import { createServiceRoleClient } from "@ricamo/supabase/server";
import { currencyFormatter } from "../../lib/metrics";
import { actualizarCostoEstampado } from "./actions";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

type PrintSize = "punto_corazon" | "media_carta" | "carta" | "oficio" | "tabloide";

interface PrintSizePriceRow {
  print_size: PrintSize;
  cost_cop: number | null;
}

const PRINT_SIZE_LABELS: Record<PrintSize, string> = {
  punto_corazon: "Punto corazón",
  media_carta: "Media carta",
  carta: "Carta",
  oficio: "Oficio",
  tabloide: "Tabloide",
};

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data, error: fetchError } = await supabase
    .from("print_size_prices")
    .select("print_size, cost_cop")
    .order("print_size", { ascending: true });

  const prices = (data ?? []) as unknown as PrintSizePriceRow[];

  return (
    <main className="px-6 py-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Configuración</h1>
      <p className="text-neutral-600 mb-6">
        Costos de referencia que se muestran al registrar una venta con
        estampado. Actualízalos aquí cuando cambien — no requiere tocar
        código.
      </p>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}
      {fetchError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando los costos: {fetchError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {prices.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay costos configurados.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Tamaño de estampado</th>
                <th className="px-4 py-3 font-medium">Costo actual</th>
                <th className="px-4 py-3 font-medium">Actualizar</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr key={p.print_size} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {PRINT_SIZE_LABELS[p.print_size] ?? p.print_size}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {p.cost_cop !== null
                      ? currencyFormatter.format(p.cost_cop)
                      : "Sin definir"}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={actualizarCostoEstampado}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="print_size" value={p.print_size} />
                      <input
                        name="cost_cop"
                        type="number"
                        min={0}
                        step={1}
                        defaultValue={p.cost_cop ?? ""}
                        placeholder="COP"
                        className="w-28 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-ricamo-black bg-ricamo-yellow rounded-lg px-3 py-1.5 whitespace-nowrap"
                      >
                        Guardar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
