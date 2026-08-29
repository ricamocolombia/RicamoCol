import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { actualizarVenta } from "../actions";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

interface OrderRow {
  id: string;
  payment_status: "pendiente" | "anticipo_pagado" | "pagado" | "reembolsado";
  payment_method: string | null;
  courier_id: string | null;
  shipping_type: "nacional" | "local" | null;
  shipping_payment_status: "contraentrega" | "pagado" | null;
  notes: string | null;
}

interface CourierRow {
  id: string;
  name: string;
}

export default async function EditarVentaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: orderData, error: orderError }, { data: couriersData }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, payment_status, payment_method, courier_id, shipping_type, shipping_payment_status, notes")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("couriers").select("id, name"),
  ]);

  if (orderError || !orderData) {
    notFound();
  }

  const order = orderData as unknown as OrderRow;
  const couriers = (couriersData ?? []) as unknown as CourierRow[];

  return (
    <main className="px-6 py-10 max-w-2xl">
      <Link href={`/ventas/${id}`} className="text-sm text-neutral-500 hover:text-ricamo-black">
        ← Volver a la venta
      </Link>

      <h1 className="text-2xl font-bold mt-2 mb-6">Editar venta</h1>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <form action={actualizarVenta} className="rounded-xl border border-neutral-200 bg-white p-6 space-y-5">
        <input type="hidden" name="id" value={id} />

        <div>
          <label htmlFor="payment_status" className="block text-sm font-medium mb-1">
            Estado de pago
          </label>
          <select
            id="payment_status"
            name="payment_status"
            defaultValue={order.payment_status}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="pendiente">Pendiente</option>
            <option value="anticipo_pagado">Anticipo pagado</option>
            <option value="pagado">Pagado</option>
            <option value="reembolsado">Reembolsado</option>
          </select>
        </div>

        <div>
          <label htmlFor="payment_method" className="block text-sm font-medium mb-1">
            Método de pago
          </label>
          <input
            id="payment_method"
            name="payment_method"
            defaultValue={order.payment_method ?? ""}
            placeholder="Nequi, transferencia, efectivo…"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="shipping_type" className="block text-sm font-medium mb-1">
            Tipo de envío
          </label>
          <select
            id="shipping_type"
            name="shipping_type"
            defaultValue={order.shipping_type ?? ""}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Sin definir</option>
            <option value="nacional">Nacional</option>
            <option value="local">Local</option>
          </select>
        </div>

        <div>
          <label htmlFor="courier_id" className="block text-sm font-medium mb-1">
            Domiciliario
          </label>
          <select
            id="courier_id"
            name="courier_id"
            defaultValue={order.courier_id ?? ""}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Sin asignar</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="shipping_payment_status" className="block text-sm font-medium mb-1">
            Pago del domicilio
          </label>
          <select
            id="shipping_payment_status"
            name="shipping_payment_status"
            defaultValue={order.shipping_payment_status ?? ""}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Sin definir</option>
            <option value="contraentrega">Contraentrega</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={order.notes ?? ""}
            rows={4}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-5 py-2.5 text-sm"
          >
            Guardar cambios
          </button>
          <Link
            href={`/ventas/${id}`}
            className="text-sm text-neutral-500 px-5 py-2.5 border border-neutral-300 rounded-lg"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
