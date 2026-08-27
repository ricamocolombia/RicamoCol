import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import {
  classifyCustomerSegment,
  currencyFormatter,
  dateFormatter,
  SEGMENT_LABELS,
  SEGMENT_STYLES,
} from "../../lib/metrics";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  instagram_handle: string | null;
  created_at: string;
}

interface OrderRow {
  id: string;
  customer_id: string | null;
  total_cop: number;
  created_at: string;
}

export default async function ClientesPage() {
  const supabase = createServiceRoleClient();

  const [{ data: customersData, error: customersError }, { data: ordersData }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, full_name, phone, email, city, instagram_handle, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id, customer_id, total_cop, created_at")
        .order("created_at", { ascending: false }),
    ]);

  const customers = (customersData ?? []) as unknown as CustomerRow[];
  const orders = (ordersData ?? []) as unknown as OrderRow[];

  const ordersByCustomer = new Map<string, OrderRow[]>();
  for (const order of orders) {
    if (!order.customer_id) continue;
    const list = ordersByCustomer.get(order.customer_id) ?? [];
    list.push(order);
    ordersByCustomer.set(order.customer_id, list);
  }

  const rows = customers.map((customer) => {
    const customerOrders = ordersByCustomer.get(customer.id) ?? [];
    const orderCount = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total_cop, 0);
    const lastOrderAt = customerOrders[0]?.created_at ?? null; // ya viene ordenado desc
    const segment = classifyCustomerSegment(orderCount, lastOrderAt);
    return { customer, orderCount, totalSpent, lastOrderAt, segment };
  });

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Clientes</h1>
          <p className="text-neutral-600">
            Base de clientes con segmento de recompra, para dar seguimiento y
            armar campañas de marketing.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/campanas"
            className="text-sm font-semibold text-ricamo-black border border-neutral-300 rounded-lg px-4 py-2 whitespace-nowrap"
          >
            Ver campañas
          </Link>
          <Link
            href="/clientes/nueva"
            className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
          >
            + Nuevo cliente
          </Link>
        </div>
      </div>

      {customersError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando clientes: {customersError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay clientes registrados.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Ciudad</th>
                <th className="px-4 py-3 font-medium">Segmento</th>
                <th className="px-4 py-3 font-medium">Pedidos</th>
                <th className="px-4 py-3 font-medium">Total gastado</th>
                <th className="px-4 py-3 font-medium">Última compra</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ customer, orderCount, totalSpent, lastOrderAt, segment }) => (
                <tr key={customer.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clientes/${customer.id}`}
                      className="font-medium hover:underline"
                    >
                      {customer.full_name}
                    </Link>
                    <div className="text-xs text-neutral-500">
                      {customer.phone ?? customer.email ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {customer.city ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full text-xs font-medium px-2 py-1 ${SEGMENT_STYLES[segment]}`}
                    >
                      {SEGMENT_LABELS[segment]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{orderCount}</td>
                  <td className="px-4 py-3 font-medium">
                    {currencyFormatter.format(totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                    {lastOrderAt ? dateFormatter.format(new Date(lastOrderAt)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
