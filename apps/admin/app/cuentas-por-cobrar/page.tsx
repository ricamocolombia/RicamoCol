import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { marcarCuentaPorCobrarPagada } from "./actions";

interface AccountReceivable {
  id: string;
  customer_id: string | null;
  order_id: string | null;
  amount_cop: number;
  due_date: string | null;
  status: "pendiente" | "pagado" | "vencido" | "anulado";
  notes: string | null;
  created_at: string;
}

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
}

const STATUS_LABELS: Record<AccountReceivable["status"], string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  vencido: "Vencido",
  anulado: "Anulado",
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

function isOverdue(row: AccountReceivable): boolean {
  if (row.status === "pagado" || row.status === "anulado") return false;
  if (!row.due_date) return row.status === "vencido";
  return row.status === "vencido" || new Date(row.due_date) < new Date(new Date().toDateString());
}

function statusBadgeClass(row: AccountReceivable): string {
  if (row.status === "pagado") return "bg-green-100 text-green-700";
  if (row.status === "anulado") return "bg-neutral-100 text-neutral-500";
  if (isOverdue(row)) return "bg-red-100 text-ricamo-red";
  return "bg-yellow-100 text-yellow-800";
}

function statusLabel(row: AccountReceivable): string {
  if (row.status === "pendiente" && isOverdue(row)) return "Vencido";
  return STATUS_LABELS[row.status] ?? row.status;
}

export default async function CuentasPorCobrarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: actionError } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: arData, error: arError }, { data: customersData }] = await Promise.all([
    supabase
      .from("accounts_receivable")
      .select("id, customer_id, order_id, amount_cop, due_date, status, notes, created_at")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("customers").select("id, full_name, phone"),
  ]);

  const receivables = (arData ?? []) as unknown as AccountReceivable[];
  const customers = (customersData ?? []) as unknown as CustomerRow[];
  const customersById = new Map(customers.map((c) => [c.id, c]));

  const totalPendiente = receivables
    .filter((r) => r.status === "pendiente" || r.status === "vencido")
    .reduce((sum, r) => sum + r.amount_cop, 0);

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Cuentas por cobrar</h1>
          <p className="text-neutral-600">
            Saldos pendientes de clientes: anticipos y pedidos a crédito.
          </p>
        </div>
        <Link
          href="/cuentas-por-cobrar/nueva"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
        >
          + Nueva cuenta por cobrar
        </Link>
      </div>

      {actionError && (
        <p className="text-sm text-ricamo-red mb-4">{actionError}</p>
      )}

      {arError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando cuentas por cobrar: {arError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-6 inline-block">
        <p className="text-xs text-neutral-500 mb-1">Total pendiente por cobrar</p>
        <p className="text-xl font-bold text-ricamo-black">
          {currencyFormatter.format(totalPendiente)}
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
        {receivables.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay cuentas por cobrar registradas.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Vence</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Venta vinculada</th>
                <th className="px-4 py-3 font-medium">Notas</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {receivables.map((row) => {
                const customer = row.customer_id ? customersById.get(row.customer_id) : undefined;
                return (
                  <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {customer?.full_name ?? "Sin cliente"}
                      {customer?.phone && (
                        <div className="text-xs text-neutral-500 font-normal">
                          {customer.phone}
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
                      {row.order_id ? row.order_id.slice(0, 8) : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{row.notes ?? "—"}</td>
                    <td className="px-4 py-3">
                      {row.status !== "pagado" && row.status !== "anulado" && (
                        <form action={marcarCuentaPorCobrarPagada}>
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
