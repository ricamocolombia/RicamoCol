import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { registrarPagoProveedor } from "./actions";

interface AccountPayable {
  id: string;
  supplier_id: string | null;
  purchase_id: string | null;
  order_id: string | null;
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
}

interface BankAccountRow {
  id: string;
  name: string;
  is_active: boolean;
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

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

function isOverdue(row: AccountPayable): boolean {
  if (row.status === "pagado" || row.status === "anulado") return false;
  if (!row.due_date) return row.status === "vencido";
  return row.status === "vencido" || new Date(row.due_date) < new Date(new Date().toDateString());
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

  const [{ data: apData, error: apError }, { data: suppliersData }, { data: bankAccountsData }] =
    await Promise.all([
      supabase
        .from("accounts_payable")
        .select("id, supplier_id, purchase_id, order_id, amount_cop, due_date, status, notes, created_at")
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("suppliers").select("id, name, type"),
      supabase.from("bank_accounts").select("id, name, is_active").order("name", { ascending: true }),
    ]);

  const payables = (apData ?? []) as unknown as AccountPayable[];
  const suppliers = (suppliersData ?? []) as unknown as SupplierRow[];
  const bankAccounts = (bankAccountsData ?? []) as unknown as BankAccountRow[];
  const suppliersById = new Map(suppliers.map((s) => [s.id, s]));

  const pending = payables.filter((r) => r.status === "pendiente" || r.status === "vencido");
  const history = payables.filter((r) => r.status === "pagado" || r.status === "anulado");

  const totalPendiente = pending.reduce((sum, r) => sum + r.amount_cop, 0);

  const pendingBySupplier = new Map<string, AccountPayable[]>();
  for (const row of pending) {
    const key = row.supplier_id ?? "__sin_proveedor__";
    const list = pendingBySupplier.get(key) ?? [];
    list.push(row);
    pendingBySupplier.set(key, list);
  }

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Cuentas por pagar</h1>
          <p className="text-neutral-600">
            Deudas con maquiladoras (estampado/bordado) y proveedores de
            prendas o insumos. Las ventas con técnica y costo cargan aquí
            automáticamente — ver{" "}
            <Link href="/configuracion" className="underline">
              Configuración
            </Link>
            .
          </p>
        </div>
        <Link
          href="/cuentas-por-pagar/nueva"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
        >
          + Nueva cuenta por pagar
        </Link>
      </div>

      {actionError && <p className="text-sm text-ricamo-red mb-4">{actionError}</p>}
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

      {pending.length === 0 ? (
        <p className="text-sm text-neutral-500 mb-8">
          No hay cuentas por pagar pendientes.
        </p>
      ) : (
        <div className="space-y-6 mb-10">
          {[...pendingBySupplier.entries()].map(([supplierKey, rows]) => {
            const supplier = supplierKey !== "__sin_proveedor__" ? suppliersById.get(supplierKey) : undefined;
            const supplierLabel = supplier?.name ?? "Sin proveedor";
            const subtotal = rows.reduce((sum, r) => sum + r.amount_cop, 0);

            return (
              <div key={supplierKey} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-semibold">{supplierLabel}</span>
                    {supplier && (
                      <span className="text-xs text-neutral-500 ml-2">
                        {SUPPLIER_TYPE_LABELS[supplier.type] ?? supplier.type}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-neutral-600">
                    Subtotal: {currencyFormatter.format(subtotal)}
                  </span>
                </div>

                <form action={registrarPagoProveedor}>
                  <input type="hidden" name="supplier_label" value={supplierLabel} />
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100 text-left text-neutral-500">
                        <th className="px-4 py-2 font-medium w-8"></th>
                        <th className="px-4 py-2 font-medium">Origen</th>
                        <th className="px-4 py-2 font-medium">Monto</th>
                        <th className="px-4 py-2 font-medium">Vence</th>
                        <th className="px-4 py-2 font-medium">Estado</th>
                        <th className="px-4 py-2 font-medium">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b border-neutral-50 last:border-0">
                          <td className="px-4 py-2">
                            <input type="checkbox" name="selected_ids" value={row.id} />
                          </td>
                          <td className="px-4 py-2 text-neutral-500 font-mono text-xs">
                            {row.order_id
                              ? `Venta #${row.order_id.slice(0, 8)}`
                              : row.purchase_id
                                ? `Compra #${row.purchase_id.slice(0, 8)}`
                                : "—"}
                          </td>
                          <td className="px-4 py-2 font-medium">
                            {currencyFormatter.format(row.amount_cop)}
                          </td>
                          <td className="px-4 py-2 text-neutral-600 whitespace-nowrap">
                            {row.due_date ? dateFormatter.format(new Date(row.due_date)) : "—"}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-block rounded-full text-xs font-medium px-2 py-1 ${
                                isOverdue(row)
                                  ? "bg-red-100 text-ricamo-red"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {isOverdue(row) ? "Vencido" : "Pendiente"}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-neutral-600">{row.notes ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="p-4 bg-neutral-50 flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Pagar desde el banco
                      </label>
                      <select
                        name="bank_account_id"
                        required
                        defaultValue=""
                        className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm bg-white"
                      >
                        <option value="" disabled>
                          Selecciona un banco
                        </option>
                        {bankAccounts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                            {!b.is_active ? " (inactiva)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Monto pagado</label>
                      <input
                        name="amount_paid_cop"
                        type="number"
                        min={1}
                        step={1}
                        required
                        placeholder={String(subtotal)}
                        className="w-32 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="text-xs font-semibold text-ricamo-black bg-ricamo-yellow rounded-lg px-4 py-2 whitespace-nowrap"
                    >
                      Confirmar pago de lo marcado
                    </button>
                  </div>
                </form>
              </div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Historial
          </h2>
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Monto</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => {
                  const supplier = row.supplier_id ? suppliersById.get(row.supplier_id) : undefined;
                  return (
                    <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3 font-medium">{supplier?.name ?? "Sin proveedor"}</td>
                      <td className="px-4 py-3 text-neutral-500 font-mono text-xs">
                        {row.order_id
                          ? `Venta #${row.order_id.slice(0, 8)}`
                          : row.purchase_id
                            ? `Compra #${row.purchase_id.slice(0, 8)}`
                            : "—"}
                      </td>
                      <td className="px-4 py-3">{currencyFormatter.format(row.amount_cop)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full text-xs font-medium px-2 py-1 ${
                            row.status === "pagado"
                              ? "bg-green-100 text-green-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {row.status === "pagado" ? "Pagado" : "Anulado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{row.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
