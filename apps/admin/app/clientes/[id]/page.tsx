import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import {
  classifyCustomerSegment,
  currencyFormatter,
  dateTimeFormatter,
  SEGMENT_LABELS,
  SEGMENT_STYLES,
} from "../../../lib/metrics";
import { actualizarCliente } from "./actions";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  instagram_handle: string | null;
  notes: string | null;
  created_at: string;
}

interface OrderRow {
  id: string;
  source: string;
  status: string;
  total_cop: number;
  payment_status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_produccion: "En producción",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default async function DetalleClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: actionError } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: customerData, error: customerError }, { data: ordersData }] =
    await Promise.all([
      supabase
        .from("customers")
        .select(
          "id, full_name, phone, email, city, instagram_handle, notes, created_at"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("orders")
        .select("id, source, status, total_cop, payment_status, created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (customerError || !customerData) {
    notFound();
  }

  const customer = customerData as unknown as CustomerRow;
  const orders = (ordersData ?? []) as unknown as OrderRow[];

  const orderCount = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + o.total_cop, 0);
  const lastOrderAt = orders[0]?.created_at ?? null;
  const segment = classifyCustomerSegment(orderCount, lastOrderAt);

  return (
    <main className="px-6 py-10">
      <Link href="/clientes" className="text-sm text-neutral-500 hover:underline">
        ← Clientes
      </Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="text-2xl font-bold">{customer.full_name}</h1>
        <span
          className={`inline-block rounded-full text-xs font-medium px-2 py-1 ${SEGMENT_STYLES[segment]}`}
        >
          {SEGMENT_LABELS[segment]}
        </span>
      </div>

      {actionError && (
        <p className="text-sm text-ricamo-red mb-4">{actionError}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500 mb-1">Pedidos</p>
          <p className="text-xl font-bold">{orderCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500 mb-1">Total gastado</p>
          <p className="text-xl font-bold">{currencyFormatter.format(totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500 mb-1">Última compra</p>
          <p className="text-xl font-bold">
            {lastOrderAt ? dateTimeFormatter.format(new Date(lastOrderAt)) : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Datos del cliente</h2>
          <form action={actualizarCliente} className="space-y-4">
            <input type="hidden" name="id" value={customer.id} />

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium mb-1">
                Nombre completo *
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                defaultValue={customer.full_name}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  defaultValue={customer.phone ?? ""}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Correo
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={customer.email ?? ""}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1">
                  Ciudad
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  defaultValue={customer.city ?? ""}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label
                  htmlFor="instagram_handle"
                  className="block text-sm font-medium mb-1"
                >
                  Instagram
                </label>
                <input
                  id="instagram_handle"
                  name="instagram_handle"
                  type="text"
                  defaultValue={customer.instagram_handle ?? ""}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={customer.notes ?? ""}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
            >
              Guardar cambios
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <h2 className="text-lg font-semibold p-6 pb-0">Historial de pedidos</h2>
          {orders.length === 0 ? (
            <p className="p-6 text-neutral-500 text-sm">
              Este cliente todavía no tiene pedidos.
            </p>
          ) : (
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3">
                      {STATUS_LABELS[order.status] ?? order.status}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {currencyFormatter.format(order.total_cop)}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {dateTimeFormatter.format(new Date(order.created_at))}
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
