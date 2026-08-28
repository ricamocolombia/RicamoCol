import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";

interface PurchaseRow {
  id: string;
  supplier_id: string;
  invoice_number: string | null;
  status: "pendiente" | "recibida" | "cancelada";
  total_cop: number;
  notes: string | null;
  created_at: string;
}

interface SupplierRow {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<PurchaseRow["status"], string> = {
  pendiente: "Pendiente",
  recibida: "Recibida",
  cancelada: "Cancelada",
};

const STATUS_STYLES: Record<PurchaseRow["status"], string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  recibida: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const supabase = createServiceRoleClient();

  const [{ data: purchasesData, error: purchasesError }, { data: suppliersData }] =
    await Promise.all([
      supabase
        .from("purchases")
        .select("id, supplier_id, invoice_number, status, total_cop, notes, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("suppliers").select("id, name"),
    ]);

  const purchases = (purchasesData ?? []) as unknown as PurchaseRow[];
  const suppliers = (suppliersData ?? []) as unknown as SupplierRow[];
  const suppliersById = new Map(suppliers.map((s) => [s.id, s]));

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Compras</h1>
          <p className="text-neutral-600">
            Compras a proveedores: prendas en blanco e insumos.
          </p>
        </div>
        <Link
          href="/compras/nueva"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
        >
          + Nueva compra
        </Link>
      </div>

      {purchasesError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando compras: {purchasesError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
        {purchases.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay compras registradas.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Factura</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Notas</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                const supplier = suppliersById.get(purchase.supplier_id);

                return (
                  <tr
                    key={purchase.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {supplier?.name ?? "Proveedor eliminado"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {purchase.invoice_number ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full text-xs font-medium px-2 py-1 ${STATUS_STYLES[purchase.status] ?? "bg-neutral-100 text-neutral-600"}`}
                      >
                        {STATUS_LABELS[purchase.status] ?? purchase.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {currencyFormatter.format(purchase.total_cop)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 max-w-xs truncate">
                      {purchase.notes ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {dateFormatter.format(new Date(purchase.created_at))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
