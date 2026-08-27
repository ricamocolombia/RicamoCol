import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { crearVenta } from "./actions";

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
}

interface CourierRow {
  id: string;
  name: string;
  is_active: boolean;
}

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

export default async function NuevaVentaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: customersData }, { data: couriersData }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone")
      .order("full_name", { ascending: true }),
    supabase
      .from("couriers")
      .select("id, name, is_active")
      .order("name", { ascending: true }),
  ]);

  const customers = (customersData ?? []) as unknown as CustomerRow[];
  const couriers = (couriersData ?? []) as unknown as CourierRow[];

  return (
    <main className="px-6 py-10 max-w-2xl">
      <div className="mb-6">
        <Link href="/ventas" className="text-sm text-neutral-500 hover:text-ricamo-black">
          ← Ventas
        </Link>
        <h1 className="text-2xl font-bold mt-2">Nueva venta</h1>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <form action={crearVenta} className="space-y-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold">Cliente</h2>

          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium mb-1">
              Cliente existente
            </label>
            <select
              id="customer_id"
              name="customer_id"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              defaultValue=""
            >
              <option value="">— Ninguno / crear cliente nuevo abajo —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                  {c.phone ? ` · ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <p className="text-sm text-neutral-500 mb-3">
              Cliente nuevo (déjalo vacío si escogiste uno existente arriba)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="new_customer_name"
                  className="block text-sm font-medium mb-1"
                >
                  Nombre completo
                </label>
                <input
                  id="new_customer_name"
                  name="new_customer_name"
                  type="text"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label
                  htmlFor="new_customer_phone"
                  className="block text-sm font-medium mb-1"
                >
                  Teléfono
                </label>
                <input
                  id="new_customer_phone"
                  name="new_customer_phone"
                  type="tel"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label
                  htmlFor="new_customer_email"
                  className="block text-sm font-medium mb-1"
                >
                  Email
                </label>
                <input
                  id="new_customer_email"
                  name="new_customer_email"
                  type="email"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold">Detalle de la venta</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="source" className="block text-sm font-medium mb-1">
                Origen
              </label>
              <select
                id="source"
                name="source"
                defaultValue="manual"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="manual">Manual</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="web_catalogo">Web · catálogo</option>
                <option value="web_personalizado">Web · personalizado</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Estado
              </label>
              <select
                id="status"
                name="status"
                defaultValue="pendiente"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="en_produccion">En producción</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="item_description"
                className="block text-sm font-medium mb-1"
              >
                Descripción del producto/servicio *
              </label>
              <input
                id="item_description"
                name="item_description"
                type="text"
                required
                placeholder="Ej: Camiseta bordada personalizada"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label
                htmlFor="item_quantity"
                className="block text-sm font-medium mb-1"
              >
                Cantidad *
              </label>
              <input
                id="item_quantity"
                name="item_quantity"
                type="number"
                min={1}
                step={1}
                defaultValue={1}
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="item_unit_price_cop"
              className="block text-sm font-medium mb-1"
            >
              Precio unitario (COP) *
            </label>
            <input
              id="item_unit_price_cop"
              name="item_unit_price_cop"
              type="number"
              min={0}
              step={1}
              required
              placeholder="Ej: 85000"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
            <p className="text-xs text-neutral-500 mt-1">
              El total de la venta se calcula automáticamente (cantidad × precio unitario).
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold">Pago y despacho</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="payment_status"
                className="block text-sm font-medium mb-1"
              >
                Estado de pago
              </label>
              <select
                id="payment_status"
                name="payment_status"
                defaultValue="pendiente"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="pendiente">Pendiente</option>
                <option value="anticipo_pagado">Anticipo pagado</option>
                <option value="pagado">Pagado</option>
                <option value="reembolsado">Reembolsado</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="payment_method"
                className="block text-sm font-medium mb-1"
              >
                Método de pago
              </label>
              <input
                id="payment_method"
                name="payment_method"
                type="text"
                placeholder="Ej: Nequi, transferencia, efectivo"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="courier_id" className="block text-sm font-medium mb-1">
              Domiciliario (opcional)
            </label>
            <select
              id="courier_id"
              name="courier_id"
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              <option value="">— Sin asignar —</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {!c.is_active ? " (inactivo)" : ""}
                </option>
              ))}
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
        </section>

        <button
          type="submit"
          className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg py-3"
        >
          Registrar venta
        </button>
      </form>
    </main>
  );
}
