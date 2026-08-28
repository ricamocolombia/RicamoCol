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

// Paga en un solo movimiento una o varias cuentas por pagar seleccionadas
// (normalmente todas del mismo proveedor, agrupadas en la UI). Registra el
// pago como una transaccion de salida en Bancos y marca cada cuenta
// seleccionada como pagada. El monto pagado se guarda tal cual lo confirme
// el usuario -- no se exige que coincida centavo a centavo con la suma de
// lo seleccionado.
export async function registrarPagoProveedor(formData: FormData) {
  const selectedIds = formData.getAll("selected_ids").map((v) => String(v)).filter(Boolean);
  const bankAccountId = String(formData.get("bank_account_id") ?? "").trim();
  const amountRaw = String(formData.get("amount_paid_cop") ?? "").trim();
  const supplierLabel = String(formData.get("supplier_label") ?? "proveedor").trim();

  if (selectedIds.length === 0) {
    redirect(
      `/cuentas-por-pagar?error=${encodeURIComponent("Selecciona al menos una cuenta por pagar")}`
    );
  }
  if (!bankAccountId) {
    redirect(`/cuentas-por-pagar?error=${encodeURIComponent("Elige de qué banco sale el pago")}`);
  }
  const amount = Number.parseInt(amountRaw, 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(
      `/cuentas-por-pagar?error=${encodeURIComponent("El monto pagado debe ser un número mayor a 0")}`
    );
  }

  const supabase = createServiceRoleClient();

  const { error: updateError } = await supabase
    .from("accounts_payable")
    .update({ status: "pagado" })
    .in("id", selectedIds);

  if (updateError) {
    redirect(
      `/cuentas-por-pagar?error=${encodeURIComponent(
        "No se pudo marcar como pagadas: " + updateError.message
      )}`
    );
  }

  const { error: transactionError } = await supabase.from("transactions").insert({
    bank_account_id: bankAccountId,
    type: "salida",
    category: "Pago a proveedor",
    amount_cop: amount,
    description: `Pago a ${supplierLabel} — ${selectedIds.length} cuenta(s) por pagar`,
  });

  if (transactionError) {
    redirect(
      `/cuentas-por-pagar?error=${encodeURIComponent(
        "Las cuentas quedaron marcadas como pagadas, pero no se pudo registrar la salida en Bancos: " +
          transactionError.message
      )}`
    );
  }

  redirect("/cuentas-por-pagar");
}
