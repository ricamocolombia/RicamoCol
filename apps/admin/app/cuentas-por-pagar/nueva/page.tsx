import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { crearCuentaPorPagar } from "../actions";

interface SupplierRow {
  id: string;
  name: string;
  type: "maquiladora" | "prendas" | "insumos" | "otro";
}

interface PurchaseRow {
  id: string;
  supplier_id: string;
  total_cop: number;
  created_at: string;
}

const SUPPLIER_TYPE_LABELS: Record<SupplierRow["type"], string> = {
  maquiladora: "Maquiladora",
  prendas: "Prendas",
  insumos: "Insumos",
  otro: "Otro",
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default async function NuevaCuentaPorPagarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: suppliersData }, { data: purchasesData }] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id, name, type")
      .order("name", { ascending: true }),
    supabase
      .from("purchases")
      .select("id, supplier_id, total_cop, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const suppliers = (suppliersData ?? []) as unknown as SupplierRow[];
  const purchases = (purchasesData ?? []) as unknown as PurchaseRow[];
  const suppliersById = new Map(suppliers.map((s) => [s.id, s]));

  return (
    <main className="px-6 py-10 max-w-lg">
      <div className="mb-6">
        <Link
          href="/cuentas-por-pagar"
          className="text-sm text-neutral-500 hover:text-ricamo-black"
        >
          ← Cuentas por pagar
        </Link>
        <h1 className="text-2xl font-bold mt-2">Nueva cuenta por pagar</h1>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      {suppliers.length === 0 ? (
        <p className="text-sm text-neutral-600">
          Todavía no hay proveedores registrados. Primero se debe crear el
          proveedor antes de poder abrir una cuenta por pagar.
        </p>
      ) : (
        <form
          action={crearCuentaPorPagar}
          className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6"
        >
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
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} — {SUPPLIER_TYPE_LABELS[supplier.type] ?? supplier.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount_cop" className="block text-sm font-medium mb-1">
              Monto (COP) *
            </label>
            <input
              id="amount_cop"
              name="amount_cop"
              type="number"
              min="1"
              step="1"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium mb-1">
              Fecha de vencimiento
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="purchase_id" className="block text-sm font-medium mb-1">
              Compra vinculada (opcional)
            </label>
            <select
              id="purchase_id"
              name="purchase_id"
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="">Sin vincular</option>
              {purchases.map((purchase) => {
                const supplier = suppliersById.get(purchase.supplier_id);
                return (
                  <option key={purchase.id} value={purchase.id}>
                    {new Date(purchase.created_at).toLocaleDateString("es-CO")} —{" "}
                    {supplier?.name ?? "Sin proveedor"} —{" "}
                    {currencyFormatter.format(purchase.total_cop)}
                  </option>
                );
              })}
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

          <button
            type="submit"
            className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg py-2"
          >
            Guardar cuenta por pagar
          </button>
        </form>
      )}
    </main>
  );
}
