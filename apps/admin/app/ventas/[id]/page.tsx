import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { updateOrderStatus } from "./actions";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

type OrderStatus =
  | "pendiente"
  | "confirmado"
  | "en_produccion"
  | "enviado"
  | "entregado"
  | "cancelado";

interface OrderRow {
  id: string;
  customer_id: string | null;
  source: "web_catalogo" | "web_personalizado" | "whatsapp" | "manual";
  status: OrderStatus;
  total_cop: number;
  payment_status: "pendiente" | "anticipo_pagado" | "pagado" | "reembolsado";
  payment_method: string | null;
  courier_id: string | null;
  shipping_type: "nacional" | "local" | null;
  shipping_payment_status: "contraentrega" | "pagado" | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
  id: string;
  description: string | null;
  quantity: number;
  unit_price_cop: number;
  garment_type: string | null;
  design_category: string | null;
  color: string | null;
  size: string | null;
  technique: "bordado" | "estampado" | null;
  cost_cop: number | null;
}

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pendiente", label: "Pendiente" },
  { status: "confirmado", label: "Confirmado" },
  { status: "en_produccion", label: "En procesamiento" },
  { status: "enviado", label: "Enviado" },
  { status: "entregado", label: "Recibido" },
];

const FORWARD_ACTION: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pendiente: { status: "confirmado", label: "Confirmar pedido" },
  confirmado: { status: "en_produccion", label: "Pasar a procesamiento" },
  en_produccion: { status: "enviado", label: "Marcar como enviado" },
  enviado: { status: "entregado", label: "Marcar como recibido" },
};

const SOURCE_LABELS: Record<OrderRow["source"], string> = {
  web_catalogo: "Web · catálogo",
  web_personalizado: "Web · personalizado",
  whatsapp: "WhatsApp",
  manual: "Manual",
};

const PAYMENT_LABELS: Record<OrderRow["payment_status"], string> = {
  pendiente: "Pendiente",
  anticipo_pagado: "Anticipo pagado",
  pagado: "Pagado",
  reembolsado: "Reembolsado",
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

export default async function DetalleVentaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, customer_id, source, status, total_cop, payment_status, payment_method, courier_id, shipping_type, shipping_payment_status, notes, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (orderError || !orderData) {
    notFound();
  }

  const order = orderData as unknown as OrderRow;

  const [{ data: customerData }, { data: courierData }, { data: itemsData }] = await Promise.all([
    order.customer_id
      ? supabase.from("customers").select("id, full_name, phone, city").eq("id", order.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    order.courier_id
      ? supabase.from("couriers").select("id, name").eq("id", order.courier_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("order_items")
      .select("id, description, quantity, unit_price_cop, garment_type, design_category, color, size, technique, cost_cop")
      .eq("order_id", id),
  ]);

  const customer = customerData as unknown as CustomerRow | null;
  const courier = courierData as unknown as CourierRow | null;
  const items = (itemsData ?? []) as unknown as ItemRow[];

  const isCancelled = order.status === "cancelado";
  const isDelivered = order.status === "entregado";
  const forward = FORWARD_ACTION[order.status];
  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.status === order.status);

  return (
    <main className="px-6 py-10 max-w-4xl">
      <Link href="/ventas" className="text-sm text-neutral-500 hover:text-ricamo-black">
        ← Ventas
      </Link>

      <div className="flex items-center justify-between mt-2 mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">
          Venta {customer?.full_name ? `· ${customer.full_name}` : ""}
        </h1>
        <Link
          href={`/ventas/${id}/editar`}
          className="text-sm font-semibold text-ricamo-black border border-neutral-300 rounded-lg px-4 py-2"
        >
          Editar datos
        </Link>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      {/* Linea de tiempo */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 mb-6">
        {isCancelled ? (
          <span className="inline-block rounded-full bg-red-100 text-ricamo-red text-sm font-semibold px-3 py-1.5">
            Pedido cancelado
          </span>
        ) : (
          <div className="flex items-center flex-wrap gap-y-3">
            {TIMELINE_STEPS.map((step, i) => (
              <div key={step.status} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i <= currentStepIndex
                        ? "bg-ricamo-yellow text-ricamo-black"
                        : "bg-neutral-100 text-neutral-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-xs whitespace-nowrap ${
                      i <= currentStepIndex ? "font-semibold" : "text-neutral-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <span
                    className={`w-8 sm:w-16 h-0.5 mx-1 ${
                      i < currentStepIndex ? "bg-ricamo-yellow" : "bg-neutral-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-neutral-100">
          {forward && (
            <form action={updateOrderStatus}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value={forward.status} />
              <button
                type="submit"
                className="text-sm font-semibold rounded-lg px-4 py-2 bg-ricamo-yellow text-ricamo-black"
              >
                {forward.label}
              </button>
            </form>
          )}
          {!isCancelled && !isDelivered && (
            <form action={updateOrderStatus}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value="cancelado" />
              <button
                type="submit"
                className="text-sm rounded-lg px-4 py-2 border border-neutral-300 text-neutral-600 hover:border-ricamo-red hover:text-ricamo-red"
              >
                Cancelar pedido
              </button>
            </form>
          )}
          {isCancelled && (
            <form action={updateOrderStatus}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value="pendiente" />
              <button
                type="submit"
                className="text-sm rounded-lg px-4 py-2 border border-neutral-300 text-neutral-600"
              >
                Reactivar a pendiente
              </button>
            </form>
          )}
        </div>
        {order.status !== "cancelado" && (
          <p className="text-xs text-neutral-400 mt-3">
            Cancelar no revierte pagos ya registrados en Bancos ni cuentas por
            cobrar/pagar generadas por esta venta — ajústalas manualmente si
            hace falta.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="font-semibold mb-3">Cliente</h2>
          {customer ? (
            <div className="text-sm space-y-1">
              <p className="font-medium">
                <Link href={`/clientes/${customer.id}`} className="hover:underline">
                  {customer.full_name}
                </Link>
              </p>
              {customer.phone && <p className="text-neutral-600">{customer.phone}</p>}
              {customer.city && <p className="text-neutral-600">{customer.city}</p>}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Sin cliente asociado</p>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="font-semibold mb-3">Pago y envío</h2>
          <div className="text-sm space-y-1 text-neutral-600">
            <p>
              Origen: <span className="font-medium text-ricamo-black">{SOURCE_LABELS[order.source]}</span>
            </p>
            <p>
              Pago: <span className="font-medium text-ricamo-black">{PAYMENT_LABELS[order.payment_status]}</span>
              {order.payment_method ? ` · ${order.payment_method}` : ""}
            </p>
            <p>
              Envío:{" "}
              <span className="font-medium text-ricamo-black">
                {order.shipping_type === "nacional" ? "Nacional" : order.shipping_type === "local" ? "Local" : "Sin definir"}
              </span>
            </p>
            <p>
              Domicilio:{" "}
              <span className="font-medium text-ricamo-black">
                {order.shipping_payment_status === "pagado"
                  ? "Pagado"
                  : order.shipping_payment_status === "contraentrega"
                    ? "Contraentrega"
                    : "Sin definir"}
              </span>
            </p>
            {courier && <p>Domiciliario: <span className="font-medium text-ricamo-black">{courier.name}</span></p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden mt-6">
        <h2 className="font-semibold p-6 pb-0">Detalle</h2>
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-6 py-3 font-medium">Producto</th>
              <th className="px-6 py-3 font-medium">Técnica</th>
              <th className="px-6 py-3 font-medium">Cant.</th>
              <th className="px-6 py-3 font-medium">Precio unit.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-6 py-3">
                  <p className="font-medium">{item.description ?? "—"}</p>
                  <p className="text-xs text-neutral-500">
                    {[item.garment_type, item.color, item.size ? `talla ${item.size}` : null, item.design_category]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </td>
                <td className="px-6 py-3 text-neutral-600">{item.technique ?? "—"}</td>
                <td className="px-6 py-3">{item.quantity}</td>
                <td className="px-6 py-3">{currencyFormatter.format(item.unit_price_cop)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-neutral-100 flex justify-between items-center">
          <span className="text-sm text-neutral-500">
            Creada {dateFormatter.format(new Date(order.created_at))}
          </span>
          <span className="font-bold">{currencyFormatter.format(order.total_cop)}</span>
        </div>
      </div>

      {order.notes && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 mt-6">
          <h2 className="font-semibold mb-2">Notas</h2>
          <p className="text-sm text-neutral-600 whitespace-pre-line">{order.notes}</p>
        </div>
      )}
    </main>
  );
}
