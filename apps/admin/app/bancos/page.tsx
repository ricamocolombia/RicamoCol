import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";

interface BankAccount {
  id: string;
  name: string;
  bank_name: string | null;
  account_type: string | null;
  is_active: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  bank_account_id: string;
  type: "ingreso" | "salida";
  category: string;
  amount_cop: number;
  description: string | null;
  reference_order_id: string | null;
  reference_purchase_id: string | null;
  occurred_at: string;
  created_at: string;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ahorros: "Ahorros",
  corriente: "Corriente",
  billetera_digital: "Billetera digital",
  efectivo: "Efectivo",
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
});

export default async function BancosPage() {
  const supabase = createServiceRoleClient();

  const [{ data: accountsData, error: accountsError }, { data: txData, error: txError }] =
    await Promise.all([
      supabase
        .from("bank_accounts")
        .select("id, name, bank_name, account_type, is_active, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("transactions")
        .select(
          "id, bank_account_id, type, category, amount_cop, description, reference_order_id, reference_purchase_id, occurred_at, created_at"
        )
        .order("occurred_at", { ascending: false })
        .limit(50),
    ]);

  const accounts = (accountsData ?? []) as unknown as BankAccount[];
  const transactions = (txData ?? []) as unknown as Transaction[];

  const accountsById = new Map(accounts.map((a) => [a.id, a]));

  return (
    <main className="px-6 py-10">
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Bancos</h1>
            <p className="text-neutral-600">
              Cuentas bancarias y billeteras donde se recibe y sale el dinero del negocio.
            </p>
          </div>
          <Link
            href="/bancos/nueva-cuenta"
            className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
          >
            + Nueva cuenta
          </Link>
        </div>

        {accountsError && (
          <p className="text-sm text-ricamo-red mb-4">
            Error cargando cuentas: {accountsError.message}
          </p>
        )}

        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          {accounts.length === 0 ? (
            <p className="p-6 text-neutral-500 text-sm">
              Todavía no hay cuentas bancarias registradas.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Banco</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-medium">{account.name}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {account.bank_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {account.account_type
                        ? ACCOUNT_TYPE_LABELS[account.account_type] ?? account.account_type
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {account.is_active ? (
                        <span className="inline-block rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-1">
                          Activa
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium px-2 py-1">
                          Inactiva
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Movimientos recientes</h2>
            <p className="text-neutral-600">
              Últimas 50 transacciones de ingresos y salidas de dinero.
            </p>
          </div>
          <Link
            href="/bancos/nueva-transaccion"
            className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
          >
            + Nueva transacción
          </Link>
        </div>

        {txError && (
          <p className="text-sm text-ricamo-red mb-4">
            Error cargando transacciones: {txError.message}
          </p>
        )}

        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
          {transactions.length === 0 ? (
            <p className="p-6 text-neutral-500 text-sm">
              Todavía no hay transacciones registradas.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Monto</th>
                  <th className="px-4 py-3 font-medium">Cuenta</th>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      {dateFormatter.format(new Date(tx.occurred_at))}
                    </td>
                    <td className="px-4 py-3">
                      {tx.type === "ingreso" ? (
                        <span className="inline-block rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-1">
                          Ingreso
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-red-100 text-ricamo-red text-xs font-medium px-2 py-1">
                          Salida
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{tx.category}</td>
                    <td
                      className={`px-4 py-3 font-medium whitespace-nowrap ${
                        tx.type === "ingreso" ? "text-green-700" : "text-ricamo-red"
                      }`}
                    >
                      {tx.type === "ingreso" ? "+" : "-"}
                      {currencyFormatter.format(tx.amount_cop)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      {accountsById.get(tx.bank_account_id)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {tx.description ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
