import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { crearCuentaPorCobrar } from "../actions";

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
}

interface OrderRow {
  id: string;
  customer_id: string | null;
  total_cop: number;
  created_at: string;
}

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default async function NuevaCuentaPorCobrarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: customersData }, { data: ordersData }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone")
      .order("full_name", { ascending: true }),
    supabase
      .from("orders")
      .select("id, customer_id, total_cop, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const customers = (customersData ?? []) as unknown as CustomerRow[];
  const orders = (ordersData ?? []) as unknown as OrderRow[];
  const customersById = new Map(customers.map((c) => [c.id, c]));

  return (
    <main className="px-6 py-10 max-w-lg">
      <div className="mb-6">
        <Link
          href="/cuentas-por-cobrar"
          className="text-sm text-neutral-500 hover:text-ricamo-black"
        >
          ← Cuentas por cobrar
        </Link>
        <h1 className="text-2xl font-bold mt-2">Nueva cuenta por cobrar</h1>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      {customers.length === 0 ? (
        <p className="text-sm text-neutral-600">
          Todavía no hay clientes registrados. Primero se debe crear el cliente
          (por ejemplo, al registrar una venta) antes de poder abrir una cuenta
          por cobrar.
        </p>
      ) : (
        <form
          action={crearCuentaPorCobrar}
          className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6"
        >
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium mb-1">
              Cliente *
            </label>
            <select
              id="customer_id"
              name="customer_id"
              required
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="" disabled>
                Selecciona un cliente
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name}
                  {customer.phone ? ` — ${customer.phone}` : ""}
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
            <label htmlFor="order_id" className="block text-sm font-medium mb-1">
              Venta vinculada (opcional)
            </label>
            <select
              id="order_id"
              name="order_id"
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="">Sin vincular</option>
              {orders.map((order) => {
                const customer = order.customer_id
                  ? customersById.get(order.customer_id)
                  : undefined;
                return (
                  <option key={order.id} value={order.id}>
                    {new Date(order.created_at).toLocaleDateString("es-CO")} —{" "}
                    {customer?.full_name ?? "Sin cliente"} —{" "}
                    {currencyFormatter.format(order.total_cop)}
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
            Guardar cuenta por cobrar
          </button>
        </form>
      )}
    </main>
  );
}
