import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import {
  ajustarStock,
  cambiarNivelReorden,
  crearItem,
  enviarAlertaInventarioAhora,
  toggleAlerta,
} from "./actions";

interface InventoryItemRow {
  id: string;
  name: string;
  garment_type: string;
  size: string | null;
  color: string | null;
  supplier_id: string | null;
  warehouse_id: string | null;
  alert_enabled: boolean;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost_cop: number | null;
}

interface SupplierRow {
  id: string;
  name: string;
}

interface WarehouseRow {
  id: string;
  name: string;
  is_active: boolean;
}

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const SEED_GARMENT_TYPES = ["Regular", "Oversize", "Hoodie", "Crop top", "Manga larga"];
const SEED_COLORS = ["Negro", "Blanco", "Beige", "Gris"];
const SEED_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function mergeSuggestions(seed: string[], used: (string | null)[]): string[] {
  const set = new Set(seed);
  for (const value of used) {
    if (value) set.add(value);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  const { error: errorMessage, info: infoMessage } = await searchParams;
  const supabase = createServiceRoleClient();

  const [
    { data: itemsData, error: itemsError },
    { data: suppliersData },
    { data: warehousesData },
  ] = await Promise.all([
    supabase
      .from("inventory_items")
      .select(
        "id, name, garment_type, size, color, supplier_id, warehouse_id, alert_enabled, quantity_on_hand, reorder_level, unit_cost_cop"
      )
      .order("name", { ascending: true }),
    supabase.from("suppliers").select("id, name"),
    supabase.from("warehouses").select("id, name, is_active").order("name", { ascending: true }),
  ]);

  const items = (itemsData ?? []) as unknown as InventoryItemRow[];
  const suppliers = (suppliersData ?? []) as unknown as SupplierRow[];
  const warehouses = (warehousesData ?? []) as unknown as WarehouseRow[];
  const suppliersById = new Map(suppliers.map((s) => [s.id, s]));

  const garmentTypeOptions = mergeSuggestions(SEED_GARMENT_TYPES, items.map((i) => i.garment_type));
  const colorOptions = mergeSuggestions(SEED_COLORS, items.map((i) => i.color));
  const sizeOptions = mergeSuggestions(SEED_SIZES, items.map((i) => i.size));

  const itemsByWarehouse = new Map<string, InventoryItemRow[]>();
  const noWarehouseItems: InventoryItemRow[] = [];
  for (const item of items) {
    if (!item.warehouse_id) {
      noWarehouseItems.push(item);
      continue;
    }
    const list = itemsByWarehouse.get(item.warehouse_id) ?? [];
    list.push(item);
    itemsByWarehouse.set(item.warehouse_id, list);
  }

  const lowStockCount = items.filter(
    (i) => i.alert_enabled && i.quantity_on_hand <= i.reorder_level
  ).length;

  function renderTable(rows: InventoryItemRow[]) {
    if (rows.length === 0) {
      return <p className="p-6 text-neutral-500 text-sm">Sin ítems en esta bodega.</p>;
    }
    return (
      <table className="w-full text-sm min-w-[1000px]">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Talla</th>
            <th className="px-4 py-3 font-medium">Color</th>
            <th className="px-4 py-3 font-medium">Proveedor</th>
            <th className="px-4 py-3 font-medium">Disponible</th>
            <th className="px-4 py-3 font-medium">Nivel mínimo</th>
            <th className="px-4 py-3 font-medium">Alerta</th>
            <th className="px-4 py-3 font-medium">Ajustar stock</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const low = item.alert_enabled && item.quantity_on_hand <= item.reorder_level;
            const supplier = item.supplier_id ? suppliersById.get(item.supplier_id) : undefined;

            return (
              <tr
                key={item.id}
                className={`border-b border-neutral-100 last:border-0 align-top ${low ? "bg-red-50" : ""}`}
              >
                <td className="px-4 py-3 font-medium">
                  {item.name}
                  {item.unit_cost_cop != null && (
                    <div className="text-xs text-neutral-500 font-normal">
                      {currencyFormatter.format(item.unit_cost_cop)} c/u
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">{item.garment_type}</td>
                <td className="px-4 py-3 text-neutral-600">{item.size ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-600">{item.color ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-600">{supplier?.name ?? "—"}</td>
                <td className={`px-4 py-3 font-semibold ${low ? "text-ricamo-red" : ""}`}>
                  {item.quantity_on_hand}
                </td>
                <td className="px-4 py-3">
                  <form action={cambiarNivelReorden} className="flex items-center gap-1">
                    <input type="hidden" name="inventory_item_id" value={item.id} />
                    <input
                      type="number"
                      name="reorder_level"
                      min={0}
                      defaultValue={item.reorder_level}
                      className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="submit"
                      className="text-xs text-neutral-500 hover:text-ricamo-black underline underline-offset-2 whitespace-nowrap"
                    >
                      Guardar
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={toggleAlerta}>
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="alert_enabled"
                      value={String(item.alert_enabled)}
                    />
                    <button
                      type="submit"
                      className={`text-xs rounded-full px-2 py-1 font-medium ${
                        item.alert_enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {item.alert_enabled ? "Activa" : "Silenciada"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={ajustarStock} className="flex items-center gap-1">
                    <input type="hidden" name="inventory_item_id" value={item.id} />
                    <input
                      type="number"
                      name="delta"
                      placeholder="±cant."
                      required
                      className="w-20 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="submit"
                      className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-2 py-1 text-xs whitespace-nowrap"
                    >
                      Aplicar
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <main className="px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Inventario</h1>
          <p className="text-neutral-600">
            Stock de prendas en blanco por bodega, esperando a ser estampadas
            o bordadas.{" "}
            <Link href="/bodegas" className="underline">
              Gestionar bodegas
            </Link>
            .
          </p>
          {lowStockCount > 0 && (
            <p className="text-sm text-ricamo-red font-medium mt-2">
              {lowStockCount} ítem(s) en o bajo su nivel mínimo (con alerta activa).
            </p>
          )}
        </div>
        <form action={enviarAlertaInventarioAhora}>
          <button
            type="submit"
            className="text-sm font-semibold text-ricamo-black border border-neutral-300 rounded-lg px-4 py-2 whitespace-nowrap"
          >
            Enviar alerta por correo ahora
          </button>
        </form>
      </div>

      {infoMessage && (
        <p className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 mb-4">
          {infoMessage}
        </p>
      )}
      {errorMessage && <p className="text-sm text-ricamo-red mb-4">{errorMessage}</p>}
      {itemsError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando inventario: {itemsError.message}
        </p>
      )}

      <div className="space-y-8 mb-8">
        {warehouses.map((w) => (
          <div key={w.id}>
            <h2 className="font-semibold mb-2">
              {w.name}
              {!w.is_active && (
                <span className="ml-2 text-xs font-normal text-neutral-400">(inactiva)</span>
              )}
            </h2>
            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
              {renderTable(itemsByWarehouse.get(w.id) ?? [])}
            </div>
          </div>
        ))}

        {noWarehouseItems.length > 0 && (
          <div>
            <h2 className="font-semibold mb-2 text-neutral-500">Sin bodega asignada</h2>
            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
              {renderTable(noWarehouseItems)}
            </div>
          </div>
        )}

        {warehouses.length === 0 && noWarehouseItems.length === 0 && (
          <p className="text-sm text-neutral-500">
            Todavía no hay bodegas ni ítems de inventario.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 max-w-xl">
        <h2 className="text-lg font-semibold mb-4">Agregar ítem de inventario</h2>

        <form action={crearItem} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nombre *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ej. Camiseta oversized crudo"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="warehouse_id" className="block text-sm font-medium mb-1">
              Bodega *
            </label>
            <select
              id="warehouse_id"
              name="warehouse_id"
              required
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="" disabled>
                Selecciona una bodega
              </option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="garment_type" className="block text-sm font-medium mb-1">
                Tipo *
              </label>
              <input
                id="garment_type"
                name="garment_type"
                type="text"
                required
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
          </div>

          <div>
            <label htmlFor="supplier_id" className="block text-sm font-medium mb-1">
              Proveedor de la prenda
            </label>
            <select
              id="supplier_id"
              name="supplier_id"
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="">Sin especificar</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="quantity_on_hand" className="block text-sm font-medium mb-1">
                Cantidad inicial
              </label>
              <input
                id="quantity_on_hand"
                name="quantity_on_hand"
                type="number"
                min={0}
                defaultValue={0}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="reorder_level" className="block text-sm font-medium mb-1">
                Nivel mínimo
              </label>
              <input
                id="reorder_level"
                name="reorder_level"
                type="number"
                min={0}
                defaultValue={2}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="unit_cost_cop" className="block text-sm font-medium mb-1">
                Costo unitario
              </label>
              <input
                id="unit_cost_cop"
                name="unit_cost_cop"
                type="number"
                min={0}
                placeholder="COP"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
          >
            Guardar ítem
          </button>
        </form>
      </div>
    </main>
  );
}
