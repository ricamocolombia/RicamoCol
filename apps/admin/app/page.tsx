import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { signOut } from "./login/actions";
import { currencyFormatter } from "../lib/metrics";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

const sections = [
  { href: "/ventas", label: "Ventas" },
  { href: "/clientes", label: "Clientes" },
  { href: "/campanas", label: "Campañas" },
  { href: "/compras", label: "Compras" },
  { href: "/inventario", label: "Inventario" },
  { href: "/bodegas", label: "Bodegas" },
  { href: "/cuentas-por-cobrar", label: "Cuentas por cobrar" },
  { href: "/cuentas-por-pagar", label: "Cuentas por pagar" },
  { href: "/bancos", label: "Bancos" },
  { href: "/proveedores", label: "Proveedores" },
  { href: "/domiciliarios", label: "Domiciliarios" },
  { href: "/disenos", label: "Diseños" },
  { href: "/configuracion", label: "Configuración" },
];

interface OrderRow {
  id: string;
  customer_id: string | null;
  source: string;
  status: string;
  total_cop: number;
  payment_status: string;
  created_at: string;
}

interface CustomerRow {
  id: string;
  full_name: string;
  city: string | null;
}

interface TransactionRow {
  type: "ingreso" | "salida";
  amount_cop: number;
  category: string;
  occurred_at: string;
}

interface ItemRow {
  order_id: string;
  quantity: number;
  unit_price_cop: number;
  cost_cop: number | null;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_produccion: "En producción",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const SOURCE_LABELS: Record<string, string> = {
  web_catalogo: "Web · catálogo",
  web_personalizado: "Web · personalizado",
  whatsapp: "WhatsApp",
  manual: "Manual",
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-ricamo-black">{value}</p>
      {hint && <p className="text-xs text-neutral-400 mt-1">{hint}</p>}
    </div>
  );
}

function BarList({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number; sublabel?: string }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-400">Sin datos todavía.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium truncate pr-2">
                  {row.label}
                  {row.sublabel && (
                    <span className="text-neutral-400 font-normal">
                      {" "}
                      · {row.sublabel}
                    </span>
                  )}
                </span>
                <span className="text-neutral-600 whitespace-nowrap">
                  {currencyFormatter.format(row.value)}
                </span>
              </div>
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ricamo-yellow rounded-full"
                  style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { desde, hasta } = await searchParams;
  const supabase = createServiceRoleClient();

  const [
    { data: ordersData },
    { data: customersData },
    { data: transactionsData },
    { data: receivableData },
    { data: payableData },
    { data: inventoryData },
    { data: itemsData },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, customer_id, source, status, total_cop, payment_status, created_at"),
    supabase.from("customers").select("id, full_name, city"),
    supabase.from("transactions").select("type, amount_cop, category, occurred_at"),
    supabase.from("accounts_receivable").select("amount_cop, status"),
    supabase.from("accounts_payable").select("amount_cop, status"),
    supabase.from("inventory_items").select("quantity_on_hand, reorder_level"),
    supabase.from("order_items").select("order_id, quantity, unit_price_cop, cost_cop"),
  ]);

  const allOrders = (ordersData ?? []) as unknown as OrderRow[];
  const customers = (customersData ?? []) as unknown as CustomerRow[];
  const allTransactions = (transactionsData ?? []) as unknown as TransactionRow[];
  const receivables = receivableData ?? [];
  const payables = payableData ?? [];
  const inventoryItems = inventoryData ?? [];
  const allItems = (itemsData ?? []) as unknown as ItemRow[];

  // Filtro de periodo (opcional, via ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD).
  // Sin filtro se muestra todo el historico.
  const desdeDate = desde ? new Date(`${desde}T00:00:00`) : null;
  const hastaDate = hasta ? new Date(`${hasta}T23:59:59`) : null;
  const inRange = (isoDate: string) => {
    const d = new Date(isoDate);
    if (desdeDate && d < desdeDate) return false;
    if (hastaDate && d > hastaDate) return false;
    return true;
  };

  const orders = allOrders.filter((o) => inRange(o.created_at));
  const orderIds = new Set(orders.map((o) => o.id));
  const items = allItems.filter((i) => orderIds.has(i.order_id));
  const transactions = allTransactions.filter((t) => inRange(t.occurred_at));

  const customersById = new Map(customers.map((c) => [c.id, c]));

  // Rentabilidad bruta: precio de venta menos costo de decoracion, solo
  // sobre los items donde ya se registro el costo (no se asume 0 en los que
  // faltan, para no inflar la cifra).
  let rentabilidadBruta = 0;
  let ingresosConCosto = 0;
  let itemsConCosto = 0;
  for (const item of items) {
    if (item.cost_cop === null) continue;
    itemsConCosto += 1;
    ingresosConCosto += item.unit_price_cop * item.quantity;
    rentabilidadBruta += (item.unit_price_cop - item.cost_cop) * item.quantity;
  }
  const margenBruto = ingresosConCosto > 0 ? (rentabilidadBruta / ingresosConCosto) * 100 : 0;

  // Ventas
  const ventasTotales = orders.length;
  const ingresosPorVentas = orders
    .filter((o) => o.payment_status === "pagado" || o.payment_status === "anticipo_pagado")
    .reduce((sum, o) => sum + o.total_cop, 0);
  const valorTotalPedidos = orders.reduce((sum, o) => sum + o.total_cop, 0);
  const ticketPromedio = ventasTotales > 0 ? valorTotalPedidos / ventasTotales : 0;

  // % de recompra: sobre clientes que ya compraron al menos una vez.
  const ordersByCustomer = new Map<string, number>();
  for (const order of orders) {
    if (!order.customer_id) continue;
    ordersByCustomer.set(order.customer_id, (ordersByCustomer.get(order.customer_id) ?? 0) + 1);
  }
  const clientesConCompras = ordersByCustomer.size;
  const clientesRecurrentes = [...ordersByCustomer.values()].filter((n) => n >= 2).length;
  const porcentajeRecompra =
    clientesConCompras > 0 ? (clientesRecurrentes / clientesConCompras) * 100 : 0;

  // Finanzas (bancos)
  const ingresosBancos = transactions
    .filter((t) => t.type === "ingreso")
    .reduce((sum, t) => sum + t.amount_cop, 0);
  const salidasBancos = transactions
    .filter((t) => t.type === "salida")
    .reduce((sum, t) => sum + t.amount_cop, 0);
  const balanceBancos = ingresosBancos - salidasBancos;

  const cxcPendiente = receivables
    .filter((r) => r.status === "pendiente" || r.status === "vencido")
    .reduce((sum, r) => sum + r.amount_cop, 0);
  const cxpPendiente = payables
    .filter((p) => p.status === "pendiente" || p.status === "vencido")
    .reduce((sum, p) => sum + p.amount_cop, 0);

  // Operacion
  const pedidosPorEstado = new Map<string, number>();
  for (const order of orders) {
    pedidosPorEstado.set(order.status, (pedidosPorEstado.get(order.status) ?? 0) + 1);
  }
  const stockEnAlerta = inventoryItems.filter(
    (i) => i.quantity_on_hand <= i.reorder_level
  ).length;

  // Ciudades con mayor venta
  const ventasPorCiudad = new Map<string, number>();
  for (const order of orders) {
    if (!order.customer_id) continue;
    const city = customersById.get(order.customer_id)?.city;
    if (!city) continue;
    ventasPorCiudad.set(city, (ventasPorCiudad.get(city) ?? 0) + order.total_cop);
  }
  const topCiudades = [...ventasPorCiudad.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));

  // Top clientes por valor
  const ventasPorCliente = new Map<string, number>();
  for (const order of orders) {
    if (!order.customer_id) continue;
    ventasPorCliente.set(
      order.customer_id,
      (ventasPorCliente.get(order.customer_id) ?? 0) + order.total_cop
    );
  }
  const topClientes = [...ventasPorCliente.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([customerId, value]) => ({
      label: customersById.get(customerId)?.full_name ?? "Cliente eliminado",
      value,
    }));

  // Ventas por origen
  const ventasPorOrigen = new Map<string, number>();
  for (const order of orders) {
    ventasPorOrigen.set(order.source, (ventasPorOrigen.get(order.source) ?? 0) + order.total_cop);
  }
  const origenRows = [...ventasPorOrigen.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([source, value]) => ({ label: SOURCE_LABELS[source] ?? source, value }));

  // Gastos por categoria
  const gastosPorCategoria = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "salida") continue;
    gastosPorCategoria.set(t.category, (gastosPorCategoria.get(t.category) ?? 0) + t.amount_cop);
  }
  const topGastos = [...gastosPorCategoria.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Panel Ricamo</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-neutral-500 hover:text-ricamo-red"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <form className="flex flex-wrap items-end gap-3 mb-6 rounded-xl border border-neutral-200 bg-white p-4">
        <div>
          <label htmlFor="desde" className="block text-xs font-medium mb-1 text-neutral-500">
            Desde
          </label>
          <input
            id="desde"
            name="desde"
            type="date"
            defaultValue={desde ?? ""}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="hasta" className="block text-xs font-medium mb-1 text-neutral-500">
            Hasta
          </label>
          <input
            id="hasta"
            name="hasta"
            type="date"
            defaultValue={hasta ?? ""}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-ricamo-black text-white text-sm font-semibold rounded-lg px-4 py-1.5"
        >
          Filtrar
        </button>
        {(desde || hasta) && (
          <Link href="/" className="text-sm text-neutral-500 hover:underline">
            Ver todo el histórico
          </Link>
        )}
      </form>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Ventas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Ventas totales" value={String(ventasTotales)} hint="pedidos registrados" />
          <Stat label="Ingresos cobrados" value={currencyFormatter.format(ingresosPorVentas)} hint="pagado o con anticipo" />
          <Stat label="Ticket promedio" value={currencyFormatter.format(ticketPromedio)} />
          <Stat
            label="% de recompra"
            value={`${porcentajeRecompra.toFixed(0)}%`}
            hint={`${clientesRecurrentes} de ${clientesConCompras} clientes`}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Finanzas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Ingresos en bancos" value={currencyFormatter.format(ingresosBancos)} />
          <Stat label="Salidas / gastos" value={currencyFormatter.format(salidasBancos)} />
          <Stat label="Balance neto" value={currencyFormatter.format(balanceBancos)} />
          <Stat label="Por cobrar / por pagar" value={`${currencyFormatter.format(cxcPendiente)} / ${currencyFormatter.format(cxpPendiente)}`} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Rentabilidad
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat
            label="Rentabilidad bruta"
            value={currencyFormatter.format(rentabilidadBruta)}
            hint="precio de venta menos costo de bordado/estampado"
          />
          <Stat label="Margen bruto" value={`${margenBruto.toFixed(0)}%`} />
          <Stat
            label="Items con costo registrado"
            value={`${itemsConCosto} de ${items.length}`}
            hint={
              items.length > itemsConCosto
                ? "los items sin costo no se incluyen en el cálculo"
                : undefined
            }
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Operación
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h3 className="text-sm font-semibold mb-3">Pedidos por estado</h3>
            {pedidosPorEstado.size === 0 ? (
              <p className="text-sm text-neutral-400">Sin pedidos todavía.</p>
            ) : (
              <ul className="text-sm space-y-1.5">
                {[...pedidosPorEstado.entries()].map(([status, count]) => (
                  <li key={status} className="flex justify-between">
                    <span className="text-neutral-600">
                      {ORDER_STATUS_LABELS[status] ?? status}
                    </span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Stat
            label="Ítems de inventario en alerta de stock"
            value={String(stockEnAlerta)}
            hint="cantidad disponible por debajo del nivel de reorden"
          />
        </div>
      </section>

      <section className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarList title="Top 5 ciudades por ventas" rows={topCiudades} />
        <BarList title="Top 5 clientes por valor" rows={topClientes} />
        <BarList title="Ventas por origen" rows={origenRows} />
        <BarList title="Gastos por categoría" rows={topGastos} />
      </section>

      <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
        Módulos
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-neutral-200 bg-white p-6 font-medium hover:border-ricamo-yellow"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
