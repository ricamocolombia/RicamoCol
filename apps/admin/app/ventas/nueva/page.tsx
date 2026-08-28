import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { crearVenta } from "./actions";
import { currencyFormatter } from "../../../lib/metrics";

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
}

interface CourierRow {
  id: string;
  name: string;
  is_active: boolean;
}

interface BankAccountRow {
  id: string;
  name: string;
  bank_name: string | null;
  is_active: boolean;
}

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

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

// Listas semilla para las sugerencias de <datalist> -- el negocio pidio que
// estos campos sean abiertos (Maria Jose puede escribir uno nuevo y queda
// disponible la proxima vez, sin tocar codigo). Se combinan con los valores
// que ya se hayan usado en ventas anteriores.
const SEED_GARMENT_TYPES = ["Regular", "Oversize", "Hoodie", "Crop top", "Manga larga"];
const SEED_DESIGN_CATEGORIES = ["Ciudades", "Parejas", "Mascotas", "Viajes", "Humor"];
const SEED_COLORS = ["Negro", "Blanco", "Beige", "Gris"];
const SEED_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function mergeSuggestions(seed: string[], used: (string | null)[]): string[] {
  const set = new Set(seed);
  for (const value of used) {
    if (value) set.add(value);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

export default async function NuevaVentaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [
    { data: customersData },
    { data: couriersData },
    { data: bankAccountsData },
    { data: itemAttrsData },
    { data: printPricesData },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone")
      .order("full_name", { ascending: true }),
    supabase
      .from("couriers")
      .select("id, name, is_active")
      .order("name", { ascending: true }),
    supabase
      .from("bank_accounts")
      .select("id, name, bank_name, is_active")
      .order("name", { ascending: true }),
    supabase
      .from("order_items")
      .select("garment_type, design_category, color, size"),
    supabase.from("print_size_prices").select("print_size, cost_cop"),
  ]);

  const customers = (customersData ?? []) as unknown as CustomerRow[];
  const couriers = (couriersData ?? []) as unknown as CourierRow[];
  const bankAccounts = (bankAccountsData ?? []) as unknown as BankAccountRow[];
  const itemAttrs = (itemAttrsData ?? []) as unknown as {
    garment_type: string | null;
    design_category: string | null;
    color: string | null;
    size: string | null;
  }[];
  const printPrices = (printPricesData ?? []) as unknown as PrintSizePriceRow[];
  const printPricesBySize = new Map(printPrices.map((p) => [p.print_size, p.cost_cop]));

  const garmentTypeOptions = mergeSuggestions(
    SEED_GARMENT_TYPES,
    itemAttrs.map((i) => i.garment_type)
  );
  const designCategoryOptions = mergeSuggestions(
    SEED_DESIGN_CATEGORIES,
    itemAttrs.map((i) => i.design_category)
  );
  const colorOptions = mergeSuggestions(SEED_COLORS, itemAttrs.map((i) => i.color));
  const sizeOptions = mergeSuggestions(SEED_SIZES, itemAttrs.map((i) => i.size));

  return (
    <main className="px-6 py-10 max-w-2xl">
      <div className="mb-6">
        <Link href="/ventas" className="text-sm text-neutral-500 hover:text-ricamo-black">
          ← Ventas
        </Link>
        <h1 className="text-2xl font-bold mt-2">Nueva venta</h1>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <form action={crearVenta} className="space-y-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold">Cliente</h2>

          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium mb-1">
              Cliente existente
            </label>
            <select
              id="customer_id"
              name="customer_id"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              defaultValue=""
            >
              <option value="">— Ninguno / crear cliente nuevo abajo —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                  {c.phone ? ` · ${c.phone}` : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              Si el cliente ya existe, los datos de abajo no se usan — se
              toman los que ya tiene guardados (editables desde{" "}
              <Link href="/clientes" className="underline">
                Clientes
              </Link>
              ).
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <p className="text-sm text-neutral-500 mb-3">
              Cliente nuevo (déjalo vacío si escogiste uno existente arriba)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="new_customer_name" className="block text-sm font-medium mb-1">
                  Nombre completo
                </label>
                <input
                  id="new_customer_name"
                  name="new_customer_name"
                  type="text"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="new_customer_id_number" className="block text-sm font-medium mb-1">
                  Cédula
                </label>
                <input
                  id="new_customer_id_number"
                  name="new_customer_id_number"
                  type="text"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="new_customer_phone" className="block text-sm font-medium mb-1">
                  Teléfono
                </label>
                <input
                  id="new_customer_phone"
                  name="new_customer_phone"
                  type="tel"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="new_customer_email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="new_customer_email"
                  name="new_customer_email"
                  type="email"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="new_customer_address" className="block text-sm font-medium mb-1">
                  Dirección
                </label>
                <input
                  id="new_customer_address"
                  name="new_customer_address"
                  type="text"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="new_customer_city" className="block text-sm font-medium mb-1">
                  Ciudad
                </label>
                <input
                  id="new_customer_city"
                  name="new_customer_city"
                  type="text"
                  placeholder="Medellín"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="new_customer_neighborhood" className="block text-sm font-medium mb-1">
                  Barrio
                </label>
                <input
                  id="new_customer_neighborhood"
                  name="new_customer_neighborhood"
                  type="text"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold">Detalle de la venta</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="source" className="block text-sm font-medium mb-1">
                Origen
              </label>
              <select
                id="source"
                name="source"
                defaultValue="manual"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="manual">Manual</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="web_catalogo">Web · catálogo</option>
                <option value="web_personalizado">Web · personalizado</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Estado
              </label>
              <select
                id="status"
                name="status"
                defaultValue="pendiente"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="en_produccion">En producción</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="item_description" className="block text-sm font-medium mb-1">
              Descripción del producto *
            </label>
            <input
              id="item_description"
              name="item_description"
              type="text"
              required
              placeholder="Ej: Camiseta bordada personalizada"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="garment_type" className="block text-sm font-medium mb-1">
                Tipo de prenda
              </label>
              <input
                id="garment_type"
                name="garment_type"
                type="text"
                list="garment-type-options"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
              <datalist id="garment-type-options">
                {garmentTypeOptions.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="design_category" className="block text-sm font-medium mb-1">
                Categoría
              </label>
              <input
                id="design_category"
                name="design_category"
                type="text"
                list="design-category-options"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
              <datalist id="design-category-options">
                {designCategoryOptions.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium mb-1">
                Color
              </label>
              <input
                id="color"
                name="color"
                type="text"
                list="color-options"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
              <datalist id="color-options">
                {colorOptions.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="size" className="block text-sm font-medium mb-1">
                Talla
              </label>
              <input
                id="size"
                name="size"
                type="text"
                list="size-options"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
              <datalist id="size-options">
                {sizeOptions.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="item_quantity" className="block text-sm font-medium mb-1">
                Cantidad *
              </label>
              <input
                id="item_quantity"
                name="item_quantity"
                type="number"
                min={1}
                step={1}
                defaultValue={1}
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="item_unit_price_cop" className="block text-sm font-medium mb-1">
                Precio de venta unitario (COP) *
              </label>
              <input
                id="item_unit_price_cop"
                name="item_unit_price_cop"
                type="number"
                min={0}
                step={1}
                required
                placeholder="Ej: 85000"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            El total de la venta se calcula automáticamente (cantidad × precio unitario).
          </p>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold">Técnica y costo de producción</h2>
          <p className="text-xs text-neutral-500">
            Esto es lo que nos cuesta a nosotros (no el precio de venta) — sirve
            para calcular la rentabilidad bruta de la venta en el Dashboard.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="technique" className="block text-sm font-medium mb-1">
                Técnica
              </label>
              <select
                id="technique"
                name="technique"
                defaultValue=""
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="">— Sin definir —</option>
                <option value="estampado">Estampado</option>
                <option value="bordado">Bordado</option>
              </select>
            </div>
            <div>
              <label htmlFor="print_size" className="block text-sm font-medium mb-1">
                Tamaño de estampado (si aplica)
              </label>
              <select
                id="print_size"
                name="print_size"
                defaultValue=""
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="">— No aplica —</option>
                {(Object.keys(PRINT_SIZE_LABELS) as PrintSize[]).map((size) => {
                  const cost = printPricesBySize.get(size);
                  return (
                    <option key={size} value={size}>
                      {PRINT_SIZE_LABELS[size]}
                      {cost != null
                        ? ` (ref. ${currencyFormatter.format(cost)})`
                        : " (costo sin definir — ver Configuración)"}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                Los costos de referencia se actualizan en{" "}
                <Link href="/configuracion" className="underline">
                  Configuración
                </Link>
                .
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="cost_cop" className="block text-sm font-medium mb-1">
              Costo unitario de la decoración (COP)
            </label>
            <input
              id="cost_cop"
              name="cost_cop"
              type="number"
              min={0}
              step={1}
              placeholder="Ej: 5000"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold">Pago</h2>

          <div>
            <label htmlFor="payment_status" className="block text-sm font-medium mb-1">
              Tipo de pago
            </label>
            <select
              id="payment_status"
              name="payment_status"
              defaultValue="pendiente"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              <option value="pendiente">Pendiente (sin pago todavía)</option>
              <option value="anticipo_pagado">Abono (pago parcial)</option>
              <option value="pagado">Pago total</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bank_account_id" className="block text-sm font-medium mb-1">
                Banco al que entró el dinero
              </label>
              <select
                id="bank_account_id"
                name="bank_account_id"
                defaultValue=""
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="">— No aplica —</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.bank_name ? ` · ${b.bank_name}` : ""}
                    {!b.is_active ? " (inactiva)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="amount_received_cop" className="block text-sm font-medium mb-1">
                Monto recibido ahora (COP)
              </label>
              <input
                id="amount_received_cop"
                name="amount_received_cop"
                type="number"
                min={0}
                step={1}
                placeholder="Ej: 50000"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            Si es abono y el monto recibido queda por debajo del total de la
            venta, se crea automáticamente una cuenta por cobrar por el saldo
            pendiente.
          </p>

          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium mb-1">
              Método de pago
            </label>
            <input
              id="payment_method"
              name="payment_method"
              type="text"
              placeholder="Ej: Nequi, transferencia, efectivo"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold">Envío</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="shipping_type" className="block text-sm font-medium mb-1">
                Tipo de envío
              </label>
              <select
                id="shipping_type"
                name="shipping_type"
                defaultValue=""
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="">— Sin definir —</option>
                <option value="local">Local</option>
                <option value="nacional">Nacional</option>
              </select>
            </div>
            <div>
              <label htmlFor="shipping_payment_status" className="block text-sm font-medium mb-1">
                Pago del domicilio
              </label>
              <select
                id="shipping_payment_status"
                name="shipping_payment_status"
                defaultValue=""
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="">— Sin definir —</option>
                <option value="contraentrega">Contraentrega</option>
                <option value="pagado">Ya está pago</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="courier_id" className="block text-sm font-medium mb-1">
              Domiciliario (opcional)
            </label>
            <select
              id="courier_id"
              name="courier_id"
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              <option value="">— Sin asignar —</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {!c.is_active ? " (inactivo)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
        </section>

        <button
          type="submit"
          className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg py-3"
        >
          Registrar venta
        </button>
      </form>
    </main>
  );
}
