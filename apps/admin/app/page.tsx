import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { currencyFormatter } from "../lib/metrics";
import { StatCard } from "../components/dashboard/StatCard";
import { RankedList } from "../components/dashboard/RankedList";
import { TrendChart } from "../components/dashboard/TrendChart";
import {
  IconAlert,
  IconArchive,
  IconArrowDownCircle,
  IconArrowUpCircle,
  IconBank,
  IconCart,
  IconPalette,
  IconShoppingBag,
  IconTrendUp,
  IconUsers,
} from "../components/icons";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/ventas", label: "Ventas", icon: IconCart },
  { href: "/clientes", label: "Clientes", icon: IconUsers },
  { href: "/compras", label: "Compras", icon: IconShoppingBag },
  { href: "/inventario", label: "Inventario", icon: IconArchive },
  { href: "/cuentas-por-cobrar", label: "Por cobrar", icon: IconArrowDownCircle },
  { href: "/cuentas-por-pagar", label: "Por pagar", icon: IconArrowUpCircle },
  { href: "/bancos", label: "Bancos", icon: IconBank },
  { href: "/disenos", label: "Diseños", icon: IconPalette },
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

interface AccountRow {
  amount_cop: number;
  status: "pendiente" | "pagado" | "vencido" | "anulado";
  due_date: string | null;
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

const today = new Date(new Date().toDateString());

function isOverdue(row: AccountRow) {
  if (row.status === "vencido") return true;
  if (row.status !== "pendiente") return false;
  return row.due_date !== null && new Date(row.due_date) < today;
}

function countFormatter(n: number) {
  return String(n);
}

function shortDate(d: Date) {
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(d);
}

// Arma los baldes de la tendencia de ventas: diario si el rango cabe en 45
// dias, semanal si es mas largo (para no saturar el grafico de puntos).
function buildSalesTrend(orders: OrderRow[], rangeStart: Date, rangeEnd: Date) {
  const totalDays = Math.max(
    1,
    Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1
  );
  const stepDays = totalDays > 45 ? 7 : 1;

  const buckets: { key: string; label: string; value: number; from: Date; to: Date }[] = [];
  const cursor = new Date(rangeStart);
  while (cursor <= rangeEnd) {
    const from = new Date(cursor);
    const to = new Date(cursor);
    to.setDate(to.getDate() + stepDays - 1);
    buckets.push({
      key: from.toISOString(),
      label: stepDays === 1 ? shortDate(from) : `sem. ${shortDate(from)}`,
      value: 0,
      from,
      to,
    });
    cursor.setDate(cursor.getDate() + stepDays);
  }

  for (const order of orders) {
    const orderDate = new Date(order.created_at);
    const bucket = buckets.find((b) => orderDate >= b.from && orderDate <= new Date(b.to.getTime() + 86399999));
    if (bucket) bucket.value += order.total_cop;
  }

  return buckets.map(({ label, value }) => ({ label, value }));
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
    supabase.from("accounts_receivable").select("amount_cop, status, due_date"),
    supabase.from("accounts_payable").select("amount_cop, status, due_date"),
    supabase.from("inventory_items").select("quantity_on_hand, reorder_level"),
    supabase.from("order_items").select("order_id, quantity, unit_price_cop, cost_cop"),
  ]);

  const allOrders = (ordersData ?? []) as unknown as OrderRow[];
  const customers = (customersData ?? []) as unknown as CustomerRow[];
  const allTransactions = (transactionsData ?? []) as unknown as TransactionRow[];
  const receivables = (receivableData ?? []) as unknown as AccountRow[];
  const payables = (payableData ?? []) as unknown as AccountRow[];
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

  const cxcVencidas = receivables.filter(isOverdue);
  const cxpVencidas = payables.filter(isOverdue);
  const montoVencidoCxc = cxcVencidas.reduce((sum, r) => sum + r.amount_cop, 0);
  const montoVencidoCxp = cxpVencidas.reduce((sum, p) => sum + p.amount_cop, 0);

  // Operacion
  const pedidosPorEstado = new Map<string, number>();
  for (const order of orders) {
    pedidosPorEstado.set(order.status, (pedidosPorEstado.get(order.status) ?? 0) + 1);
  }
  const estadoRows = [...pedidosPorEstado.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({ label: ORDER_STATUS_LABELS[status] ?? status, value: count }));

  const pedidosPendientesConfirmar = allOrders.filter((o) => o.status === "pendiente").length;

  const stockAlertItems = inventoryItems.filter((i) => i.quantity_on_hand <= i.reorder_level);
  const stockEnAlerta = stockAlertItems.length;

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

  // Tendencia de ventas: respeta el filtro de periodo si existe, si no
  // muestra los ultimos 30 dias por defecto.
  const trendEnd = hastaDate ?? new Date();
  const trendStart = desdeDate ?? new Date(trendEnd.getTime() - 29 * 86400000);
  const salesTrend = buildSalesTrend(orders, trendStart, trendEnd);

  const attentionItems = [
    pedidosPendientesConfirmar > 0 && {
      href: "/ventas",
      label: "Pedidos por confirmar",
      value: String(pedidosPendientesConfirmar),
      detail: "esperando pasar a confirmado",
    },
    cxcVencidas.length > 0 && {
      href: "/cuentas-por-cobrar",
      label: "Cuentas por cobrar vencidas",
      value: currencyFormatter.format(montoVencidoCxc),
      detail: `${cxcVencidas.length} cuenta${cxcVencidas.length === 1 ? "" : "s"}`,
    },
    cxpVencidas.length > 0 && {
      href: "/cuentas-por-pagar",
      label: "Cuentas por pagar vencidas",
      value: currencyFormatter.format(montoVencidoCxp),
      detail: `${cxpVencidas.length} cuenta${cxpVencidas.length === 1 ? "" : "s"}`,
    },
    stockEnAlerta > 0 && {
      href: "/inventario",
      label: "Ítems con stock bajo",
      value: String(stockEnAlerta),
      detail: "por debajo del nivel de reorden",
    },
  ].filter((x): x is { href: string; label: string; value: string; detail: string } => Boolean(x));

  return (
    <main className="px-5 sm:px-8 py-8 max-w-[1400px]">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Panel de control</h1>
      </div>
      <p className="text-sm text-neutral-500 mb-6">
        Vista general del negocio — ventas, finanzas y operación en un solo lugar.
      </p>

      <form className="flex flex-wrap items-end gap-3 mb-8 rounded-2xl border border-neutral-200 bg-white p-4">
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
          className="bg-ricamo-black text-white text-sm font-semibold rounded-lg px-4 py-1.5 cursor-pointer hover:bg-ricamo-red transition-colors"
        >
          Filtrar
        </button>
        {(desde || hasta) && (
          <Link href="/" className="text-sm text-neutral-500 hover:underline">
            Ver todo el histórico
          </Link>
        )}
      </form>

      {/* Accesos rapidos: la navegacion principal vive en el sidebar, esto
          es solo un atajo a los modulos de uso mas frecuente. */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-2.5">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-2 rounded-full border border-neutral-200 bg-white pl-2.5 pr-4 py-2 text-sm font-medium text-neutral-700 hover:border-ricamo-black hover:text-ricamo-black transition-colors cursor-pointer"
            >
              <span className="w-6 h-6 rounded-full bg-neutral-100 group-hover:bg-ricamo-yellow/40 flex items-center justify-center transition-colors">
                <link.icon className="w-3.5 h-3.5" />
              </span>
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      {attentionItems.length > 0 && (
        <section className="mb-8">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ricamo-red mb-3">
            <IconAlert className="w-4 h-4" />
            Pendiente de atención
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {attentionItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="rounded-2xl border border-ricamo-red/25 bg-ricamo-red/5 p-5 hover:border-ricamo-red/60 transition-colors cursor-pointer"
              >
                <p className="text-xs font-medium text-ricamo-red/80 mb-2">{item.label}</p>
                <p className="text-xl font-bold text-ricamo-black">{item.value}</p>
                <p className="text-xs text-neutral-500 mt-1">{item.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Ventas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Ventas totales"
            value={String(ventasTotales)}
            hint="pedidos registrados"
            icon={IconCart}
            accent="yellow"
          />
          <StatCard
            label="Ingresos cobrados"
            value={currencyFormatter.format(ingresosPorVentas)}
            hint="pagado o con anticipo"
            icon={IconBank}
            accent="yellow"
          />
          <StatCard label="Ticket promedio" value={currencyFormatter.format(ticketPromedio)} icon={IconTrendUp} accent="neutral" />
          <StatCard
            label="% de recompra"
            value={`${porcentajeRecompra.toFixed(0)}%`}
            hint={`${clientesRecurrentes} de ${clientesConCompras} clientes`}
            icon={IconUsers}
            accent="neutral"
          />
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="text-sm font-semibold mb-1">Ventas en el tiempo</h3>
          <TrendChart points={salesTrend} formatValue={(n) => currencyFormatter.format(n)} color="#D7263D" />
        </div>
        <RankedList title="Pedidos por estado" rows={estadoRows} formatValue={countFormatter} emptyLabel="Sin pedidos todavía." />
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Finanzas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Ingresos en bancos" value={currencyFormatter.format(ingresosBancos)} icon={IconBank} accent="neutral" />
          <StatCard label="Salidas / gastos" value={currencyFormatter.format(salidasBancos)} icon={IconArrowUpCircle} accent="neutral" />
          <StatCard
            label="Balance neto"
            value={currencyFormatter.format(balanceBancos)}
            icon={IconBank}
            accent={balanceBancos >= 0 ? "yellow" : "red"}
          />
          <StatCard
            label="Por cobrar vs. por pagar"
            value={`${currencyFormatter.format(cxcPendiente)} / ${currencyFormatter.format(cxpPendiente)}`}
            icon={IconArrowDownCircle}
            accent="neutral"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Rentabilidad
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Rentabilidad bruta"
            value={currencyFormatter.format(rentabilidadBruta)}
            hint="precio de venta menos costo de bordado/estampado"
            icon={IconTrendUp}
            accent="red"
          />
          <StatCard label="Margen bruto" value={`${margenBruto.toFixed(0)}%`} icon={IconTrendUp} accent="red" />
          <StatCard
            label="Ítems con costo registrado"
            value={`${itemsConCosto} de ${items.length}`}
            hint={
              items.length > itemsConCosto
                ? "los items sin costo no se incluyen en el cálculo"
                : undefined
            }
            icon={IconShoppingBag}
            accent="neutral"
          />
        </div>
      </section>

      <section className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RankedList title="Top 5 ciudades por ventas" rows={topCiudades} formatValue={(n) => currencyFormatter.format(n)} />
        <RankedList title="Top 5 clientes por valor" rows={topClientes} formatValue={(n) => currencyFormatter.format(n)} />
        <RankedList title="Ventas por origen" rows={origenRows} formatValue={(n) => currencyFormatter.format(n)} />
        <RankedList title="Gastos por categoría" rows={topGastos} formatValue={(n) => currencyFormatter.format(n)} />
      </section>
    </main>
  );
}
