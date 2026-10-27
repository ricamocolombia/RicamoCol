import { createServiceRoleClient } from "@ricamo/supabase/server";
import { currencyFormatter } from "../../lib/metrics";
import { ImageDropzone } from "../../components/ImageDropzone";
import {
  actualizarCostoEstampado,
  actualizarEmailAlertas,
  actualizarProveedoresProduccion,
  actualizarPagoTransferencia,
  actualizarPrecioPresentacion,
} from "./actions";

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

type GarmentPresentation =
  | "estampado_camiseta_regular"
  | "estampado_camiseta_oversize"
  | "estampado_buzo_cuello_redondo"
  | "estampado_buzo_capucha";

interface GarmentPresentationPriceRow {
  presentation: GarmentPresentation;
  cost_cop: number | null;
}

const GARMENT_PRESENTATION_LABELS: Record<GarmentPresentation, string> = {
  estampado_camiseta_regular: "Camiseta Regular",
  estampado_camiseta_oversize: "Camiseta Oversize",
  estampado_buzo_cuello_redondo: "Buzo Cuello Redondo",
  estampado_buzo_capucha: "Buzo Capucha",
};

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [
    { data, error: fetchError },
    { data: settingsData },
    { data: suppliersData },
    { data: presentationPricesData, error: presentationPricesError },
  ] = await Promise.all([
    supabase
      .from("print_size_prices")
      .select("print_size, cost_cop")
      .order("print_size", { ascending: true }),
    supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "stock_alert_email",
        "supplier_estampado_id",
        "supplier_bordado_id",
        "payment_qr_image_url",
        "payment_bank_account_info",
      ]),
    supabase.from("suppliers").select("id, name").order("name", { ascending: true }),
    supabase
      .from("garment_presentation_prices")
      .select("presentation, cost_cop")
      .order("presentation", { ascending: true }),
  ]);

  const prices = (data ?? []) as unknown as PrintSizePriceRow[];
  const settings = new Map((settingsData ?? []).map((s) => [s.key, s.value]));
  const alertEmail = settings.get("stock_alert_email") ?? "";
  const supplierEstampadoId = settings.get("supplier_estampado_id") ?? "";
  const supplierBordadoId = settings.get("supplier_bordado_id") ?? "";
  const paymentQrImageUrl = settings.get("payment_qr_image_url") ?? "";
  const paymentBankAccountInfo = settings.get("payment_bank_account_info") ?? "";
  const suppliers = (suppliersData ?? []) as unknown as { id: string; name: string }[];
  const presentationPrices = (presentationPricesData ?? []) as unknown as GarmentPresentationPriceRow[];

  return (
    <main className="px-6 py-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Configuración</h1>
      <p className="text-neutral-600 mb-6">
        Ajustes generales del negocio que cambian con el tiempo — se
        actualizan aquí, sin tocar código.
      </p>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <div className="rounded-xl border border-neutral-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold mb-1">Alertas de inventario</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Correo al que llega el resumen de ítems con stock bajo, todas las
          noches (y cuando lo envíes manualmente desde Inventario).
        </p>
        <form action={actualizarEmailAlertas} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="stock_alert_email" className="block text-sm font-medium mb-1">
              Correo de alertas
            </label>
            <input
              id="stock_alert_email"
              name="stock_alert_email"
              type="email"
              defaultValue={alertEmail}
              placeholder="mariajose@ricamo.co"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
          >
            Guardar
          </button>
        </form>
        <p className="text-xs text-neutral-500 mt-3">
          El nivel mínimo que dispara la alerta se ajusta por ítem en{" "}
          <a href="/inventario" className="underline">
            Inventario
          </a>
          . El horario del envío nocturno está fijado en el código
          (`apps/admin/vercel.json`, 11pm hora Colombia) — cambiarlo requiere
          editar ese archivo y volver a desplegar.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold mb-1">Proveedores de producción</h2>
        <p className="text-sm text-neutral-500 mb-4">
          A quién se le carga automáticamente la cuenta por pagar cuando una
          venta registra estampado o bordado. Sin esto configurado, esas
          ventas no generan cuenta por pagar.
        </p>
        <form
          action={actualizarProveedoresProduccion}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <label htmlFor="supplier_estampado_id" className="block text-sm font-medium mb-1">
              Proveedor de estampados
            </label>
            <select
              id="supplier_estampado_id"
              name="supplier_estampado_id"
              defaultValue={supplierEstampadoId}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="">— Sin definir —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="supplier_bordado_id" className="block text-sm font-medium mb-1">
              Proveedor de bordados
            </label>
            <select
              id="supplier_bordado_id"
              name="supplier_bordado_id"
              defaultValue={supplierBordadoId}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="">— Sin definir —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
            >
              Guardar
            </button>
          </div>
        </form>
        {suppliers.length === 0 && (
          <p className="text-xs text-neutral-500 mt-3">
            Todavía no hay proveedores registrados — créalos primero en{" "}
            <a href="/proveedores" className="underline">
              Proveedores
            </a>
            .
          </p>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold mb-1">Pago por transferencia</h2>
        <p className="text-sm text-neutral-500 mb-4">
          QR y datos de cuenta que ve el cliente al pagar en el checkout del
          catálogo (`/catalogo/[producto]/comprar`). Sin esto configurado, el
          checkout solo le pide que escriba por WhatsApp.
        </p>
        <form action={actualizarPagoTransferencia} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">QR de la cuenta</label>
            <ImageDropzone name="qr_image" label="Arrastra el QR aquí o haz clic para elegir" />
            {paymentQrImageUrl && (
              <div className="flex items-center gap-2 mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={paymentQrImageUrl}
                  alt="QR de pago actual"
                  className="w-16 h-16 rounded-lg object-contain border border-neutral-200 bg-neutral-50"
                />
                <span className="text-xs text-neutral-500">QR actual — sube uno nuevo para reemplazarlo</span>
              </div>
            )}
            <input type="hidden" name="current_qr_image_url" value={paymentQrImageUrl} />
          </div>
          <div>
            <label htmlFor="bank_account_info" className="block text-sm font-medium mb-1">
              Datos de la cuenta
            </label>
            <textarea
              id="bank_account_info"
              name="bank_account_info"
              rows={4}
              defaultValue={paymentBankAccountInfo}
              placeholder={"Bancolombia — Ahorros\n123-456789-00\nMaria Jose Ruiz"}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
          >
            Guardar
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold mb-1">Precios de prenda — estampado</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Precio fijo de cada presentación en estampado — se usa directo al
          crear un listado de catálogo desde un diseño (
          <code>/disenos/[id]/catalogo</code>). En bordado el precio varía
          por diseño y se escribe a mano ahí, no aquí.
        </p>

        {presentationPricesError && (
          <p className="text-sm text-ricamo-red mb-4">
            Error cargando los precios: {presentationPricesError.message}
          </p>
        )}

        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Presentación</th>
                <th className="px-4 py-3 font-medium">Precio actual</th>
                <th className="px-4 py-3 font-medium">Actualizar</th>
              </tr>
            </thead>
            <tbody>
              {presentationPrices.map((p) => (
                <tr key={p.presentation} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {GARMENT_PRESENTATION_LABELS[p.presentation] ?? p.presentation}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {p.cost_cop !== null ? currencyFormatter.format(p.cost_cop) : "Sin definir"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={actualizarPrecioPresentacion} className="flex items-center gap-2">
                      <input type="hidden" name="presentation" value={p.presentation} />
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
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-1">Costos de estampado</h2>
      <p className="text-sm text-neutral-500 mb-4">
        Se muestran como referencia al registrar una venta con estampado.
      </p>

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
