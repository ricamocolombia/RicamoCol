"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

export async function crearBodega(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();

  if (!name) {
    redirect(`/bodegas?error=${encodeURIComponent("El nombre de la bodega es obligatorio")}`);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("warehouses").insert({
    name,
    supplier_id: supplierId || null,
  });

  if (error) {
    redirect(`/bodegas?error=${encodeURIComponent("No se pudo crear la bodega: " + error.message)}`);
  }

  redirect("/bodegas");
}

export async function actualizarBodega(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();

  if (!id) {
    redirect(`/bodegas?error=${encodeURIComponent("Bodega inválida")}`);
  }
  if (!name) {
    redirect(`/bodegas?error=${encodeURIComponent("El nombre de la bodega es obligatorio")}`);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("warehouses")
    .update({ name, supplier_id: supplierId || null })
    .eq("id", id);

  if (error) {
    redirect(`/bodegas?error=${encodeURIComponent("No se pudo actualizar la bodega: " + error.message)}`);
  }

  redirect("/bodegas");
}

export async function toggleBodegaActiva(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!id) {
    redirect(`/bodegas?error=${encodeURIComponent("Bodega inválida")}`);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("warehouses")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) {
    redirect(`/bodegas?error=${encodeURIComponent("No se pudo actualizar la bodega: " + error.message)}`);
  }

  redirect("/bodegas");
}
