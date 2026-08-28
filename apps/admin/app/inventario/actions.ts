"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { checkAndSendStockAlerts } from "../../lib/stockAlerts";

function fail(message: string): never {
  redirect(`/inventario?error=${encodeURIComponent(message)}`);
}

export async function crearItem(formData: FormData) {
  const supabase = createServiceRoleClient();

  const name = String(formData.get("name") ?? "").trim();
  const garmentType = String(formData.get("garment_type") ?? "").trim();
  const warehouseId = String(formData.get("warehouse_id") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const quantityRaw = String(formData.get("quantity_on_hand") ?? "0");
  const reorderRaw = String(formData.get("reorder_level") ?? "2");
  const unitCostRaw = String(formData.get("unit_cost_cop") ?? "");

  const quantity = Number.parseInt(quantityRaw, 10);
  const reorderLevel = Number.parseInt(reorderRaw, 10);
  const unitCost = unitCostRaw.trim() ? Number.parseInt(unitCostRaw, 10) : null;

  if (!name) {
    fail("El nombre del ítem es obligatorio");
  }
  if (!garmentType) {
    fail("El tipo de prenda es obligatorio");
  }
  if (!warehouseId) {
    fail("Elige una bodega");
  }
  if (!Number.isFinite(quantity) || quantity < 0) {
    fail("La cantidad inicial debe ser un número mayor o igual a 0");
  }
  if (!Number.isFinite(reorderLevel) || reorderLevel < 0) {
    fail("El nivel mínimo debe ser un número mayor o igual a 0");
  }
  if (unitCost !== null && (!Number.isFinite(unitCost) || unitCost < 0)) {
    fail("El costo unitario debe ser un número válido");
  }

  const { data: item, error } = await supabase
    .from("inventory_items")
    .insert({
      name,
      garment_type: garmentType,
      warehouse_id: warehouseId,
      size: size || null,
      color: color || null,
      supplier_id: supplierId || null,
      quantity_on_hand: quantity,
      reorder_level: reorderLevel,
      unit_cost_cop: unitCost,
    })
    .select("id")
    .single();

  if (error || !item) {
    fail("No se pudo crear el ítem: " + (error?.message ?? "error desconocido"));
  }

  // Registrar el stock inicial como un movimiento de ajuste, para que quede
  // trazabilidad en inventory_movements desde el primer momento.
  if (quantity > 0) {
    await supabase.from("inventory_movements").insert({
      inventory_item_id: item.id,
      movement_type: "ajuste",
      quantity,
      notes: "Alta inicial de inventario",
    });
  }

  redirect("/inventario");
}

export async function ajustarStock(formData: FormData) {
  const supabase = createServiceRoleClient();

  const inventoryItemId = String(formData.get("inventory_item_id") ?? "").trim();
  const deltaRaw = String(formData.get("delta") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  const delta = Number.parseInt(deltaRaw, 10);

  if (!inventoryItemId) {
    fail("Falta el ítem de inventario a ajustar");
  }
  if (!Number.isFinite(delta) || delta === 0) {
    fail("El ajuste debe ser un número distinto de 0 (positivo suma, negativo resta)");
  }

  const { data: currentItem, error: fetchError } = await supabase
    .from("inventory_items")
    .select("id, quantity_on_hand")
    .eq("id", inventoryItemId)
    .single();

  if (fetchError || !currentItem) {
    fail("No se encontró el ítem de inventario");
  }

  const newQuantity = currentItem.quantity_on_hand + delta;

  if (newQuantity < 0) {
    fail(
      `El ajuste dejaría el stock en negativo (actual: ${currentItem.quantity_on_hand}, ajuste: ${delta})`
    );
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert({
    inventory_item_id: inventoryItemId,
    movement_type: "ajuste",
    quantity: delta,
    notes: notes || null,
  });

  if (movementError) {
    fail("No se pudo registrar el movimiento: " + movementError.message);
  }

  const { error: updateError } = await supabase
    .from("inventory_items")
    .update({ quantity_on_hand: newQuantity })
    .eq("id", inventoryItemId);

  if (updateError) {
    fail("No se pudo actualizar el stock: " + updateError.message);
  }

  redirect("/inventario");
}

export async function cambiarNivelReorden(formData: FormData) {
  const supabase = createServiceRoleClient();

  const inventoryItemId = String(formData.get("inventory_item_id") ?? "").trim();
  const reorderRaw = String(formData.get("reorder_level") ?? "").trim();
  const reorderLevel = Number.parseInt(reorderRaw, 10);

  if (!inventoryItemId) {
    fail("Falta el ítem de inventario");
  }
  if (!Number.isFinite(reorderLevel) || reorderLevel < 0) {
    fail("El nivel mínimo debe ser un número mayor o igual a 0");
  }

  const { error } = await supabase
    .from("inventory_items")
    .update({ reorder_level: reorderLevel })
    .eq("id", inventoryItemId);

  if (error) {
    fail("No se pudo actualizar el nivel mínimo: " + error.message);
  }

  redirect("/inventario");
}

export async function toggleAlerta(formData: FormData) {
  const supabase = createServiceRoleClient();

  const id = String(formData.get("id") ?? "").trim();
  const alertEnabled = String(formData.get("alert_enabled") ?? "") === "true";

  if (!id) {
    fail("Falta el ítem de inventario");
  }

  const { error } = await supabase
    .from("inventory_items")
    .update({ alert_enabled: !alertEnabled })
    .eq("id", id);

  if (error) {
    fail("No se pudo actualizar la alerta: " + error.message);
  }

  redirect("/inventario");
}

export async function enviarAlertaInventarioAhora() {
  const result = await checkAndSendStockAlerts();

  const message = result.sent
    ? `Correo enviado con ${result.lowStockCount} ítem(s) en alerta.`
    : result.reason ?? "No se envió el correo.";

  const param = result.sent ? "info" : "error";
  redirect(`/inventario?${param}=${encodeURIComponent(message)}`);
}
