import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";

interface OrderRow {
  id: string;
  customer_id: string | null;
  source: "web_catalogo" | "web_personalizado" | "whatsapp" | "manual";
  status:
    | "pendiente"
    | "confirmado"
    | "en_produccion"
    | "enviado"
    | "entregado"
    | "cancelado";
  total_cop: number;
  payment_status: "pendiente" | "anticipo_pagado" | "pagado" | "reembolsado";
  payment_method: string | null;
  courier_id: string | null;
  created_at: string;
}

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
}

interface CourierRow {
  id: string;
  name: string;
}

interface ItemRow {
  order_id: string;
  quantity: number;
  unit_price_cop: number;
  cost_cop: number | null;
}

const SOURCE_LABELS: Record<OrderRow["source"], string> = {
  web_catalogo: "Web · catálogo",
  web_personalizado: "Web · personalizado",
  whatsapp: "WhatsApp",
  manual: "Manual",
};

const STATUS_LABELS: Record<OrderRow["status"], string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_produccion: "En producción",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_STYLES: Record<OrderRow["status"], string> = {
  pendiente: "bg-neutral-100 text-neutral-600",
  confirmado: "bg-blue-100 text-blue-700",
  en_produccion: "bg-yellow-100 text-yellow-800",
  enviado: "bg-purple-100 text-purple-700",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

const PAYMENT_LABELS: Record<OrderRow["payment_status"], string> = {
  pendiente: "Pendiente",
  anticipo_pagado: "Anticipo pagado",
  pagado: "Pagado",
  reembolsado: "Reembolsado",
};

const PAYMENT_STYLES: Record<OrderRow["payment_status"], string> = {
  pendiente: "bg-neutral-100 text-neutral-600",
  anticipo_pagado: "bg-yellow-100 text-yellow-800",
  pagado: "bg-green-100 text-green-700",
  reembolsado: "bg-red-100 text-red-700",
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

export default async function VentasPage() {
  const supabase = createServiceRoleClient();

  const [
    { data: ordersData, error: ordersError },
    { data: customersData },
    { data: couriersData },
    { data: itemsData },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, customer_id, source, status, total_cop, payment_status, payment_method, courier_id, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("customers").select("id, full_name, phone, city"),
    supabase.from("couriers").select("id, name"),
    supabase.from("order_items").select("order_id, quantity, unit_price_cop, cost_cop"),
  ]);

  const orders = (ordersData ?? []) as unknown as OrderRow[];
  const customers = (customersData ?? []) as unknown as CustomerRow[];
  const couriers = (couriersData ?? []) as unknown as CourierRow[];
  const items = (itemsData ?? []) as unknown as ItemRow[];

  const customersById = new Map(customers.map((c) => [c.id, c]));
  const couriersById = new Map(couriers.map((c) => [c.id, c]));

  const profitByOrder = new Map<string, { profit: number; hasCost: boolean }>();
  for (const item of items) {
    const current = profitByOrder.get(item.order_id) ?? { profit: 0, hasCost: false };
    current.profit += (item.unit_price_cop - (item.cost_cop ?? 0)) * item.quantity;
    if (item.cost_cop !== null) current.hasCost = true;
    profitByOrder.set(item.order_id, current);
  }

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Ventas</h1>
          <p className="text-neutral-600">
            Pedidos registrados desde el ecommerce, WhatsApp o manualmente.
          </p>
        </div>
        <Link
          href="/ventas/nueva"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
        >
          + Nueva venta
        </Link>
      </div>

      {ordersError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando ventas: {ordersError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
        {orders.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay ventas registradas.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Ciudad</th>
                <th className="px-4 py-3 font-medium">Origen</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Rentabilidad</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Domiciliario</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const customer = order.customer_id
                  ? customersById.get(order.customer_id)
                  : undefined;
                const courier = order.courier_id
                  ? couriersById.get(order.courier_id)
                  : undefined;
                const profit = profitByOrder.get(order.id);

                return (
                  <tr key={order.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/ventas/${order.id}`} className="hover:underline">
                        {customer?.full_name ?? "Sin cliente"}
                      </Link>
                      {customer?.phone && (
                        <div className="text-xs text-neutral-500 font-normal">
                          {customer.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {customer?.city ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {SOURCE_LABELS[order.source] ?? order.source}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full text-xs font-medium px-2 py-1 ${STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-600"}`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {currencyFormatter.format(order.total_cop)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {profit && profit.hasCost
                        ? currencyFormatter.format(profit.profit)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full text-xs font-medium px-2 py-1 ${PAYMENT_STYLES[order.payment_status] ?? "bg-neutral-100 text-neutral-600"}`}
                      >
                        {PAYMENT_LABELS[order.payment_status] ?? order.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {courier?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {dateFormatter.format(new Date(order.created_at))}
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
