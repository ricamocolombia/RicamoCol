"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

const ACCOUNT_TYPES = ["ahorros", "corriente", "billetera_digital", "efectivo"] as const;
type AccountType = (typeof ACCOUNT_TYPES)[number];
function isAccountType(value: string): value is AccountType {
  return (ACCOUNT_TYPES as readonly string[]).includes(value);
}

const TRANSACTION_TYPES = ["ingreso", "salida"] as const;
type TransactionType = (typeof TRANSACTION_TYPES)[number];
function isTransactionType(value: string): value is TransactionType {
  return (TRANSACTION_TYPES as readonly string[]).includes(value);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function crearCuentaBancaria(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const accountType = String(formData.get("account_type") ?? "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name) {
    redirect(
      `/bancos/nueva-cuenta?error=${encodeURIComponent("El nombre de la cuenta es obligatorio")}`
    );
  }

  if (accountType && !isAccountType(accountType)) {
    redirect(
      `/bancos/nueva-cuenta?error=${encodeURIComponent("Tipo de cuenta invalido")}`
    );
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("bank_accounts").insert({
    name,
    bank_name: bankName || null,
    account_type: (accountType || null) as AccountType | null,
    is_active: isActive,
  });

  if (error) {
    redirect(
      `/bancos/nueva-cuenta?error=${encodeURIComponent(
        "No se pudo crear la cuenta: " + error.message
      )}`
    );
  }

  redirect("/bancos");
}

export async function crearTransaccion(formData: FormData) {
  const bankAccountId = String(formData.get("bank_account_id") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amountRaw = String(formData.get("amount_cop") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const occurredAtRaw = String(formData.get("occurred_at") ?? "").trim();
  const referenceOrderId = String(formData.get("reference_order_id") ?? "").trim();
  const referencePurchaseId = String(formData.get("reference_purchase_id") ?? "").trim();

  if (!bankAccountId) {
    redirect(
      `/bancos/nueva-transaccion?error=${encodeURIComponent("Elige una cuenta bancaria")}`
    );
  }

  if (!isTransactionType(type)) {
    redirect(
      `/bancos/nueva-transaccion?error=${encodeURIComponent("Elige un tipo de movimiento valido")}`
    );
  }

  if (!category) {
    redirect(
      `/bancos/nueva-transaccion?error=${encodeURIComponent("La categoria es obligatoria")}`
    );
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(
      `/bancos/nueva-transaccion?error=${encodeURIComponent("El monto debe ser un numero mayor a cero")}`
    );
  }

  if (referenceOrderId && !UUID_RE.test(referenceOrderId)) {
    redirect(
      `/bancos/nueva-transaccion?error=${encodeURIComponent("El id de la venta debe ser un UUID valido")}`
    );
  }

  if (referencePurchaseId && !UUID_RE.test(referencePurchaseId)) {
    redirect(
      `/bancos/nueva-transaccion?error=${encodeURIComponent("El id de la compra debe ser un UUID valido")}`
    );
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("transactions").insert({
    bank_account_id: bankAccountId,
    type,
    category,
    amount_cop: Math.round(amount),
    description: description || null,
    occurred_at: occurredAtRaw ? new Date(occurredAtRaw).toISOString() : new Date().toISOString(),
    reference_order_id: referenceOrderId || null,
    reference_purchase_id: referencePurchaseId || null,
  });

  if (error) {
    redirect(
      `/bancos/nueva-transaccion?error=${encodeURIComponent(
        "No se pudo registrar la transaccion: " + error.message
      )}`
    );
  }

  redirect("/bancos");
}
