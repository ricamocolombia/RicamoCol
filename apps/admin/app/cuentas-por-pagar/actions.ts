"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function crearCuentaPorPagar(formData: FormData) {
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const purchaseId = String(formData.get("purchase_id") ?? "").trim();
  const amountRaw = String(formData.get("amount_cop") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!supplierId) {
    redirect(
      `/cuentas-por-pagar/nueva?error=${encodeURIComponent("Elige un proveedor")}`
    );
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(
      `/cuentas-por-pagar/nueva?error=${encodeURIComponent("El monto debe ser un numero mayor a cero")}`
    );
  }

  if (purchaseId && !UUID_RE.test(purchaseId)) {
    redirect(
      `/cuentas-por-pagar/nueva?error=${encodeURIComponent("El id de la compra debe ser un UUID valido")}`
    );
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("accounts_payable").insert({
    supplier_id: supplierId,
    purchase_id: purchaseId || null,
    amount_cop: Math.round(amount),
    due_date: dueDate || null,
    notes: notes || null,
  });

  if (error) {
    redirect(
      `/cuentas-por-pagar/nueva?error=${encodeURIComponent(
        "No se pudo crear la cuenta por pagar: " + error.message
      )}`
    );
  }

  redirect("/cuentas-por-pagar");
}

export async function marcarCuentaPorPagarPagada(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect(
      `/cuentas-por-pagar?error=${encodeURIComponent("Id de cuenta por pagar invalido")}`
    );
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("accounts_payable")
    .update({ status: "pagado" })
    .eq("id", id);

  if (error) {
    redirect(
      `/cuentas-por-pagar?error=${encodeURIComponent(
        "No se pudo marcar como pagada: " + error.message
      )}`
    );
  }

  redirect("/cuentas-por-pagar");
}
