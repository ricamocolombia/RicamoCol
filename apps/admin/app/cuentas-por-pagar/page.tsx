import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { marcarCuentaPorPagarPagada } from "./actions";

interface AccountPayable {
  id: string;
  supplier_id: string | null;
  purchase_id: string | null;
  amount_cop: number;
  due_date: string | null;
  status: "pendiente" | "pagado" | "vencido" | "anulado";
  notes: string | null;
  created_at: string;
}

interface SupplierRow {
  id: string;
  name: string;
  type: "maquiladora" | "prendas" | "insumos" | "otro";
  phone: string | null;
}

const STATUS_LABELS: Record<AccountPayable["status"], string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  vencido: "Vencido",
  anulado: "Anulado",
};

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

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

function isOverdue(row: AccountPayable): boolean {
  if (row.status === "pagado" || row.status === "anulado") return false;
  if (!row.due_date) return row.status === "vencido";
  return row.status === "vencido" || new Date(row.due_date) < new Date(new Date().toDateString());
}

function statusBadgeClass(row: AccountPayable): string {
  if (row.status === "pagado") return "bg-green-100 text-green-700";
  if (row.status === "anulado") return "bg-neutral-100 text-neutral-500";
  if (isOverdue(row)) return "bg-red-100 text-ricamo-red";
  return "bg-yellow-100 text-yellow-800";
}

function statusLabel(row: AccountPayable): string {
  if (row.status === "pendiente" && isOverdue(row)) return "Vencido";
  return STATUS_LABELS[row.status] ?? row.status;
}

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

export default async function CuentasPorPagarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: actionError } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: apData, error: apError }, { data: suppliersData }] = await Promise.all([
    supabase
      .from("accounts_payable")
      .select("id, supplier_id, purchase_id, amount_cop, due_date, status, notes, created_at")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("suppliers").select("id, name, type, phone"),
  ]);

  const payables = (apData ?? []) as unknown as AccountPayable[];
  const suppliers = (suppliersData ?? []) as unknown as SupplierRow[];
  const suppliersById = new Map(suppliers.map((s) => [s.id, s]));

  const totalPendiente = payables
    .filter((r) => r.status === "pendiente" || r.status === "vencido")
    .reduce((sum, r) => sum + r.amount_cop, 0);

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Cuentas por pagar</h1>
          <p className="text-neutral-600">
            Deudas pendientes con maquiladoras y proveedores de prendas o insumos.
          </p>
        </div>
        <Link
          href="/cuentas-por-pagar/nueva"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
        >
          + Nueva cuenta por pagar
        </Link>
      </div>

      {actionError && (
        <p className="text-sm text-ricamo-red mb-4">{actionError}</p>
      )}

      {apError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando cuentas por pagar: {apError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-6 inline-block">
        <p className="text-xs text-neutral-500 mb-1">Total pendiente por pagar</p>
        <p className="text-xl font-bold text-ricamo-black">
          {currencyFormatter.format(totalPendiente)}
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
        {payables.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay cuentas por pagar registradas.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Vence</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Compra vinculada</th>
                <th className="px-4 py-3 font-medium">Notas</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {payables.map((row) => {
                const supplier = row.supplier_id ? suppliersById.get(row.supplier_id) : undefined;
                return (
                  <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {supplier?.name ?? "Sin proveedor"}
                      {supplier && (
                        <div className="text-xs text-neutral-500 font-normal">
                          {SUPPLIER_TYPE_LABELS[supplier.type] ?? supplier.type}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {currencyFormatter.format(row.amount_cop)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      {row.due_date ? dateFormatter.format(new Date(row.due_date)) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full text-xs font-medium px-2 py-1 ${statusBadgeClass(row)}`}
                      >
                        {statusLabel(row)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 font-mono text-xs">
                      {row.purchase_id ? row.purchase_id.slice(0, 8) : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{row.notes ?? "—"}</td>
                    <td className="px-4 py-3">
                      {row.status !== "pagado" && row.status !== "anulado" && (
                        <form action={marcarCuentaPorPagarPagada}>
                          <input type="hidden" name="id" value={row.id} />
                          <button
                            type="submit"
                            className="text-xs font-semibold text-ricamo-black bg-ricamo-yellow rounded-lg px-3 py-1.5 whitespace-nowrap"
                          >
                            Marcar pagado
                          </button>
                        </form>
                      )}
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
