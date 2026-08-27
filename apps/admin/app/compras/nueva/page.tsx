import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { crearCompra } from "./actions";

interface SupplierRow {
  id: string;
  name: string;
  type: "maquiladora" | "prendas" | "insumos" | "otro";
}

interface InventoryItemRow {
  id: string;
  name: string;
  size: string | null;
  color: string | null;
}

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

export default async function NuevaCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: suppliersData }, { data: itemsData }] = await Promise.all([
    supabase.from("suppliers").select("id, name, type").order("name"),
    supabase
      .from("inventory_items")
      .select("id, name, size, color")
      .order("name"),
  ]);

  const suppliers = (suppliersData ?? []) as unknown as SupplierRow[];
  const items = (itemsData ?? []) as unknown as InventoryItemRow[];

  return (
    <main className="px-6 py-10">
      <div className="mb-6">
        <Link href="/compras" className="text-sm text-neutral-500 hover:text-ricamo-red">
          ← Volver a compras
        </Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Nueva compra</h1>
        <p className="text-neutral-600">
          Registra una compra a un proveedor (prendas en blanco o insumos).
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 max-w-2xl">
        {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

        {suppliers.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Todavía no hay proveedores registrados. Crea uno primero en{" "}
            <Link href="/proveedores" className="underline">
              Proveedores
            </Link>
            .
          </p>
        ) : (
          <form action={crearCompra} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="supplier_id"
                  className="block text-sm font-medium mb-1"
                >
                  Proveedor *
                </label>
                <select
                  id="supplier_id"
                  name="supplier_id"
                  required
                  defaultValue=""
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
                >
                  <option value="" disabled>
                    Selecciona un proveedor
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-1">
                  Estado *
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  defaultValue="pendiente"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="recibida">Recibida</option>
                  <option value="cancelada">Cancelada</option>
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  Si eliges "Recibida" y el renglón apunta a un ítem de
                  inventario existente, el stock se suma automáticamente.
                </p>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <h2 className="text-sm font-semibold mb-3">Detalle de la compra</h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="item_inventory_item_id"
                    className="block text-sm font-medium mb-1"
                  >
                    Ítem de inventario
                  </label>
                  <select
                    id="item_inventory_item_id"
                    name="item_inventory_item_id"
                    defaultValue=""
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
                  >
                    <option value="">— Usar descripción libre —</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                        {i.size ? ` · ${i.size}` : ""}
                        {i.color ? ` · ${i.color}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="item_description"
                    className="block text-sm font-medium mb-1"
                  >
                    Descripción (si no eliges un ítem)
                  </label>
                  <input
                    id="item_description"
                    name="item_description"
                    type="text"
                    placeholder="Ej. Camisetas oversized crudo talla M"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="item_quantity"
                    className="block text-sm font-medium mb-1"
                  >
                    Cantidad *
                  </label>
                  <input
                    id="item_quantity"
                    name="item_quantity"
                    type="number"
                    min={1}
                    required
                    defaultValue={1}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="item_unit_cost_cop"
                    className="block text-sm font-medium mb-1"
                  >
                    Costo unitario (COP) *
                  </label>
                  <input
                    id="item_unit_cost_cop"
                    name="item_unit_cost_cop"
                    type="number"
                    min={0}
                    required
                    defaultValue={0}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
            >
              Guardar compra
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
