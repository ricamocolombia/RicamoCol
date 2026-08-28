import { createServiceRoleClient } from "@ricamo/supabase/server";
import { crearBodega, toggleBodegaActiva } from "./actions";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

interface WarehouseRow {
  id: string;
  name: string;
  supplier_id: string | null;
  is_active: boolean;
}

interface SupplierRow {
  id: string;
  name: string;
}

export default async function BodegasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: warehousesData, error: fetchError }, { data: suppliersData }] =
    await Promise.all([
      supabase
        .from("warehouses")
        .select("id, name, supplier_id, is_active")
        .order("name", { ascending: true }),
      supabase.from("suppliers").select("id, name"),
    ]);

  const warehouses = (warehousesData ?? []) as unknown as WarehouseRow[];
  const suppliers = (suppliersData ?? []) as unknown as SupplierRow[];
  const suppliersById = new Map(suppliers.map((s) => [s.id, s]));

  return (
    <main className="px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Bodegas</h1>
        <p className="text-neutral-600">
          Lugares físicos donde se guarda el stock de prendas en blanco. Se
          pueden agregar, renombrar o desactivar las que hagan falta — no hay
          un número fijo.
        </p>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}
      {fetchError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando bodegas: {fetchError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden mb-8">
        {warehouses.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay bodegas registradas.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Bodega</th>
                <th className="px-4 py-3 font-medium">Proveedor asociado</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{w.name}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {w.supplier_id ? suppliersById.get(w.supplier_id)?.name ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {w.is_active ? (
                      <span className="inline-block rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-1">
                        Activa
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium px-2 py-1">
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleBodegaActiva}>
                      <input type="hidden" name="id" value={w.id} />
                      <input type="hidden" name="is_active" value={String(w.is_active)} />
                      <button
                        type="submit"
                        className="text-xs text-neutral-500 hover:text-ricamo-black underline underline-offset-2"
                      >
                        {w.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Agregar bodega</h2>
        <form action={crearBodega} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nombre *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ej: Bodega estampados"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="supplier_id" className="block text-sm font-medium mb-1">
              Proveedor asociado (opcional)
            </label>
            <select
              id="supplier_id"
              name="supplier_id"
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="">— Ninguno —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
          >
            Guardar bodega
          </button>
        </form>
      </div>
    </main>
  );
}
