import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { crearTransaccion } from "../actions";

interface BankAccount {
  id: string;
  name: string;
  bank_name: string | null;
}

export default async function NuevaTransaccionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("bank_accounts")
    .select("id, name, bank_name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const accounts = (data ?? []) as unknown as BankAccount[];

  const now = new Date();
  const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <main className="px-6 py-10 max-w-lg">
      <div className="mb-6">
        <Link href="/bancos" className="text-sm text-neutral-500 hover:text-ricamo-black">
          ← Bancos
        </Link>
        <h1 className="text-2xl font-bold mt-2">Nueva transacción</h1>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      {accounts.length === 0 ? (
        <p className="text-sm text-neutral-600">
          Primero necesitas crear una{" "}
          <Link href="/bancos/nueva-cuenta" className="text-ricamo-red underline">
            cuenta bancaria activa
          </Link>{" "}
          para poder registrar transacciones.
        </p>
      ) : (
        <form
          action={crearTransaccion}
          className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6"
        >
          <div>
            <label htmlFor="bank_account_id" className="block text-sm font-medium mb-1">
              Cuenta bancaria *
            </label>
            <select
              id="bank_account_id"
              name="bank_account_id"
              required
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="" disabled>
                Selecciona una cuenta
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                  {account.bank_name ? ` — ${account.bank_name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-1">
              Tipo *
            </label>
            <select
              id="type"
              name="type"
              required
              defaultValue="ingreso"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="ingreso">Ingreso</option>
              <option value="salida">Salida</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Categoría *
            </label>
            <input
              id="category"
              name="category"
              type="text"
              required
              placeholder="Ej. Venta, Materia prima, Domicilio, Nómina"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
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
            <label htmlFor="occurred_at" className="block text-sm font-medium mb-1">
              Fecha *
            </label>
            <input
              id="occurred_at"
              name="occurred_at"
              type="datetime-local"
              required
              defaultValue={localDatetime}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="reference_order_id" className="block text-sm font-medium mb-1">
              Id de venta vinculada (opcional)
            </label>
            <input
              id="reference_order_id"
              name="reference_order_id"
              type="text"
              placeholder="UUID de la venta en orders"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs"
            />
          </div>

          <div>
            <label htmlFor="reference_purchase_id" className="block text-sm font-medium mb-1">
              Id de compra vinculada (opcional)
            </label>
            <input
              id="reference_purchase_id"
              name="reference_purchase_id"
              type="text"
              placeholder="UUID de la compra en purchases"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg py-2"
          >
            Guardar transacción
          </button>
        </form>
      )}
    </main>
  );
}
