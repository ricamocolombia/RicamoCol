import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { crearCompra } from "./actions";

interface SupplierRow {
  id: string;
  name: string;
  type: "maquiladora" | "prendas" | "insumos" | "otro";
}

interface WarehouseRow {
  id: string;
  name: string;
  is_active: boolean;
}

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

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

export default async function NuevaCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: suppliersData }, { data: warehousesData }, { data: itemAttrsData }] =
    await Promise.all([
      supabase.from("suppliers").select("id, name, type").order("name"),
      supabase
        .from("warehouses")
        .select("id, name, is_active")
        .order("name", { ascending: true }),
      supabase.from("inventory_items").select("garment_type, color, size"),
    ]);

  const suppliers = (suppliersData ?? []) as unknown as SupplierRow[];
  const warehouses = (warehousesData ?? []) as unknown as WarehouseRow[];
  const itemAttrs = (itemAttrsData ?? []) as unknown as {
    garment_type: string | null;
    color: string | null;
    size: string | null;
  }[];

  const garmentTypeOptions = mergeSuggestions(
    SEED_GARMENT_TYPES,
    itemAttrs.map((i) => i.garment_type)
  );
  const colorOptions = mergeSuggestions(SEED_COLORS, itemAttrs.map((i) => i.color));
  const sizeOptions = mergeSuggestions(SEED_SIZES, itemAttrs.map((i) => i.size));

  return (
    <main className="px-6 py-10">
      <div className="mb-6">
        <Link href="/compras" className="text-sm text-neutral-500 hover:text-ricamo-red">
          ← Volver a compras
        </Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Nueva compra</h1>
        <p className="text-neutral-600">
          Registra una compra a un proveedor. Si es prenda en blanco para una
          bodega, el stock de esa bodega se actualiza automáticamente.
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
                <label htmlFor="supplier_id" className="block text-sm font-medium mb-1">
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
                <label htmlFor="invoice_number" className="block text-sm font-medium mb-1">
                  Número de factura
                </label>
                <input
                  id="invoice_number"
                  name="invoice_number"
                  type="text"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
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
                Si eliges "Recibida" y la compra tiene bodega + tipo de
                prenda, el stock de esa bodega se suma automáticamente.
              </p>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <h2 className="text-sm font-semibold mb-1">Prenda para una bodega</h2>
              <p className="text-xs text-neutral-500 mb-3">
                Llena esto si es prenda en blanco que va a inventario.
                Déjalo vacío si es una compra de insumos u otra cosa que no
                se guarda en bodega (usa la descripción libre más abajo).
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="warehouse_id" className="block text-sm font-medium mb-1">
                    Bodega
                  </label>
                  <select
                    id="warehouse_id"
                    name="warehouse_id"
                    defaultValue=""
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
                  >
                    <option value="">— No aplica —</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                        {!w.is_active ? " (inactiva)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <label htmlFor="item_description" className="block text-sm font-medium mb-1">
                Descripción libre (solo si no es prenda para bodega)
              </label>
              <input
                id="item_description"
                name="item_description"
                type="text"
                placeholder="Ej. Hilos de bordar, empaques..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="item_quantity" className="block text-sm font-medium mb-1">
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
                <label htmlFor="item_unit_cost_cop" className="block text-sm font-medium mb-1">
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
