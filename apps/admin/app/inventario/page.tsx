import { createServiceRoleClient } from "@ricamo/supabase/server";
import { ajustarStock, crearItem } from "./actions";

interface InventoryItemRow {
  id: string;
  name: string;
  garment_type: "camiseta" | "buzo";
  size: string | null;
  color: string | null;
  supplier_id: string | null;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost_cop: number | null;
}

interface SupplierRow {
  id: string;
  name: string;
}

const GARMENT_LABELS: Record<InventoryItemRow["garment_type"], string> = {
  camiseta: "Camiseta",
  buzo: "Buzo",
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMessage } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: itemsData, error: itemsError }, { data: suppliersData }] =
    await Promise.all([
      supabase
        .from("inventory_items")
        .select(
          "id, name, garment_type, size, color, supplier_id, quantity_on_hand, reorder_level, unit_cost_cop"
        )
        .order("name", { ascending: true }),
      supabase.from("suppliers").select("id, name"),
    ]);

  const items = (itemsData ?? []) as unknown as InventoryItemRow[];
  const suppliers = (suppliersData ?? []) as unknown as SupplierRow[];
  const suppliersById = new Map(suppliers.map((s) => [s.id, s]));

  const lowStockCount = items.filter(
    (i) => i.quantity_on_hand <= i.reorder_level
  ).length;

  return (
    <main className="px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Inventario</h1>
        <p className="text-neutral-600">
          Stock de prendas en blanco (camisetas, buzos) esperando a ser
          estampadas o bordadas.
        </p>
        {lowStockCount > 0 && (
          <p className="text-sm text-ricamo-red font-medium mt-2">
            {lowStockCount} ítem(s) en o bajo su nivel de reorden.
          </p>
        )}
      </div>

      {itemsError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando inventario: {itemsError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto mb-8">
        {items.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay ítems de inventario registrados.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Talla</th>
                <th className="px-4 py-3 font-medium">Color</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Disponible</th>
                <th className="px-4 py-3 font-medium">Reorden</th>
                <th className="px-4 py-3 font-medium">Ajustar stock</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const low = item.quantity_on_hand <= item.reorder_level;
                const supplier = item.supplier_id
                  ? suppliersById.get(item.supplier_id)
                  : undefined;

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-neutral-100 last:border-0 ${low ? "bg-red-50" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {item.name}
                      {item.unit_cost_cop != null && (
                        <div className="text-xs text-neutral-500 font-normal">
                          {currencyFormatter.format(item.unit_cost_cop)} c/u
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {GARMENT_LABELS[item.garment_type] ?? item.garment_type}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {item.size ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {item.color ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {supplier?.name ?? "—"}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${low ? "text-ricamo-red" : ""}`}
                    >
                      {item.quantity_on_hand}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {item.reorder_level}
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={ajustarStock}
                        className="flex items-center gap-1"
                      >
                        <input
                          type="hidden"
                          name="inventory_item_id"
                          value={item.id}
                        />
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
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 max-w-xl">
        <h2 className="text-lg font-semibold mb-4">Agregar ítem de inventario</h2>

        {errorMessage && (
          <p className="text-sm text-ricamo-red mb-4">{errorMessage}</p>
        )}

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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="garment_type"
                className="block text-sm font-medium mb-1"
              >
                Tipo *
              </label>
              <select
                id="garment_type"
                name="garment_type"
                required
                defaultValue="camiseta"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
              >
                <option value="camiseta">Camiseta</option>
                <option value="buzo">Buzo</option>
              </select>
            </div>
            <div>
              <label htmlFor="size" className="block text-sm font-medium mb-1">
                Talla
              </label>
              <input
                id="size"
                name="size"
                type="text"
                placeholder="S, M, L..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium mb-1">
                Color
              </label>
              <input
                id="color"
                name="color"
                type="text"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="supplier_id"
              className="block text-sm font-medium mb-1"
            >
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
              <label
                htmlFor="quantity_on_hand"
                className="block text-sm font-medium mb-1"
              >
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
              <label
                htmlFor="reorder_level"
                className="block text-sm font-medium mb-1"
              >
                Nivel de reorden
              </label>
              <input
                id="reorder_level"
                name="reorder_level"
                type="number"
                min={0}
                defaultValue={0}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label
                htmlFor="unit_cost_cop"
                className="block text-sm font-medium mb-1"
              >
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
