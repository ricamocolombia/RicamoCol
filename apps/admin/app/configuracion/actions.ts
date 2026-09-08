"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { uploadDesignImage } from "../../lib/storage";

const VALID_PRINT_SIZES = [
  "punto_corazon",
  "media_carta",
  "carta",
  "oficio",
  "tabloide",
] as const;
type PrintSize = (typeof VALID_PRINT_SIZES)[number];
function isPrintSize(value: string): value is PrintSize {
  return (VALID_PRINT_SIZES as readonly string[]).includes(value);
}

export async function actualizarCostoEstampado(formData: FormData) {
  const printSizeRaw = String(formData.get("print_size") ?? "").trim();
  const costRaw = String(formData.get("cost_cop") ?? "").trim();

  if (!isPrintSize(printSizeRaw)) {
    redirect(`/configuracion?error=${encodeURIComponent("Tamaño de estampado inválido")}`);
  }
  const printSize: PrintSize = printSizeRaw;

  const cost = costRaw ? Number.parseInt(costRaw, 10) : null;
  if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
    redirect(`/configuracion?error=${encodeURIComponent("El costo debe ser un número válido")}`);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("print_size_prices")
    .update({ cost_cop: cost })
    .eq("print_size", printSize);

  if (error) {
    redirect(`/configuracion?error=${encodeURIComponent("No se pudo actualizar: " + error.message)}`);
  }

  redirect("/configuracion");
}

export async function actualizarEmailAlertas(formData: FormData) {
  const email = String(formData.get("stock_alert_email") ?? "").trim();

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "stock_alert_email", value: email || null });

  if (error) {
    redirect(
      `/configuracion?error=${encodeURIComponent("No se pudo guardar el correo de alertas: " + error.message)}`
    );
  }

  redirect("/configuracion");
}

export async function actualizarPagoTransferencia(formData: FormData) {
  const currentQrImageUrl = String(formData.get("current_qr_image_url") ?? "").trim();
  const bankAccountInfo = String(formData.get("bank_account_info") ?? "").trim();
  const qrFile = formData.get("qr_image");

  let qrImageUrl = currentQrImageUrl || null;

  if (qrFile instanceof File && qrFile.size > 0) {
    try {
      qrImageUrl = await uploadDesignImage(qrFile, "pagos");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "error desconocido";
      redirect(`/configuracion?error=${encodeURIComponent(message)}`);
    }
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("app_settings").upsert([
    { key: "payment_qr_image_url", value: qrImageUrl },
    { key: "payment_bank_account_info", value: bankAccountInfo || null },
  ]);

  if (error) {
    redirect(
      `/configuracion?error=${encodeURIComponent("No se pudo guardar la configuración de pago: " + error.message)}`
    );
  }

  redirect("/configuracion");
}

export async function actualizarProveedoresProduccion(formData: FormData) {
  const supplierEstampado = String(formData.get("supplier_estampado_id") ?? "").trim();
  const supplierBordado = String(formData.get("supplier_bordado_id") ?? "").trim();

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("app_settings").upsert([
    { key: "supplier_estampado_id", value: supplierEstampado || null },
    { key: "supplier_bordado_id", value: supplierBordado || null },
  ]);

  if (error) {
    redirect(
      `/configuracion?error=${encodeURIComponent(
        "No se pudo guardar el proveedor de producción: " + error.message
      )}`
    );
  }

  redirect("/configuracion");
}
