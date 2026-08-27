"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function crearCuentaPorCobrar(formData: FormData) {
  const customerId = String(formData.get("customer_id") ?? "").trim();
  const orderId = String(formData.get("order_id") ?? "").trim();
  const amountRaw = String(formData.get("amount_cop") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!customerId) {
    redirect(
      `/cuentas-por-cobrar/nueva?error=${encodeURIComponent("Elige un cliente")}`
    );
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(
      `/cuentas-por-cobrar/nueva?error=${encodeURIComponent("El monto debe ser un numero mayor a cero")}`
    );
  }

  if (orderId && !UUID_RE.test(orderId)) {
    redirect(
      `/cuentas-por-cobrar/nueva?error=${encodeURIComponent("El id de la venta debe ser un UUID valido")}`
    );
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("accounts_receivable").insert({
    customer_id: customerId,
    order_id: orderId || null,
    amount_cop: Math.round(amount),
    due_date: dueDate || null,
    notes: notes || null,
  });

  if (error) {
    redirect(
      `/cuentas-por-cobrar/nueva?error=${encodeURIComponent(
        "No se pudo crear la cuenta por cobrar: " + error.message
      )}`
    );
  }

  redirect("/cuentas-por-cobrar");
}

export async function marcarCuentaPorCobrarPagada(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect(
      `/cuentas-por-cobrar?error=${encodeURIComponent("Id de cuenta por cobrar invalido")}`
    );
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("accounts_receivable")
    .update({ status: "pagado" })
    .eq("id", id);

  if (error) {
    redirect(
      `/cuentas-por-cobrar?error=${encodeURIComponent(
        "No se pudo marcar como pagada: " + error.message
      )}`
    );
  }

  redirect("/cuentas-por-cobrar");
}
