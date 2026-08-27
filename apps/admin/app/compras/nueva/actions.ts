"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

const VALID_STATUSES = ["pendiente", "recibida", "cancelada"] as const;
type PurchaseStatus = (typeof VALID_STATUSES)[number];

function fail(message: string): never {
  redirect(`/compras/nueva?error=${encodeURIComponent(message)}`);
}

function isPurchaseStatus(value: string): value is PurchaseStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

export async function crearCompra(formData: FormData) {
  const supabase = createServiceRoleClient();

  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const status = String(formData.get("status") ?? "pendiente").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const itemInventoryItemId = String(
    formData.get("item_inventory_item_id") ?? ""
  ).trim();
  const itemDescription = String(formData.get("item_description") ?? "").trim();
  const itemQuantityRaw = String(formData.get("item_quantity") ?? "1");
  const itemUnitCostRaw = String(formData.get("item_unit_cost_cop") ?? "0");

  const itemQuantity = Number.parseInt(itemQuantityRaw, 10);
  const itemUnitCost = Number.parseInt(itemUnitCostRaw, 10);

  if (!supplierId) {
    fail("El proveedor es obligatorio");
  }
  if (!isPurchaseStatus(status)) {
    fail("Estado de compra inválido");
  }
  if (!itemInventoryItemId && !itemDescription) {
    fail(
      "Selecciona un ítem de inventario o escribe una descripción para lo comprado"
    );
  }
  if (!Number.isFinite(itemQuantity) || itemQuantity < 1) {
    fail("La cantidad debe ser un número mayor a 0");
  }
  if (!Number.isFinite(itemUnitCost) || itemUnitCost < 0) {
    fail("El costo unitario debe ser un número válido");
  }

  const totalCop = itemQuantity * itemUnitCost;

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      supplier_id: supplierId,
      status,
      total_cop: totalCop,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (purchaseError || !purchase) {
    fail(
      "No se pudo crear la compra: " +
        (purchaseError?.message ?? "error desconocido")
    );
  }

  const purchaseId = (purchase as { id: string }).id;

  const { error: itemError } = await supabase.from("purchase_items").insert({
    purchase_id: purchaseId,
    inventory_item_id: itemInventoryItemId || null,
    description: itemDescription || null,
    quantity: itemQuantity,
    unit_cost_cop: itemUnitCost,
  });

  if (itemError) {
    fail(
      "La compra se creó pero no se pudo guardar el detalle: " +
        itemError.message
    );
  }

  // Si la compra ya llegó "recibida" y el renglón apunta a un ítem de
  // inventario existente, sumamos el stock y dejamos el movimiento
  // registrado. Si el renglón es solo descripción libre (sin
  // inventory_item_id), no hay a qué ítem sumarle stock: la compra queda
  // registrada igual, pero sin movimiento de inventario automático.
  if (status === "recibida" && itemInventoryItemId) {
    const { data: currentItem, error: fetchError } = await supabase
      .from("inventory_items")
      .select("id, quantity_on_hand")
      .eq("id", itemInventoryItemId)
      .single();

    if (fetchError || !currentItem) {
      fail(
        "La compra se creó pero no se pudo actualizar el inventario: ítem no encontrado"
      );
    }

    const current = currentItem as { id: string; quantity_on_hand: number };
    const newQuantity = current.quantity_on_hand + itemQuantity;

    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert({
        inventory_item_id: itemInventoryItemId,
        movement_type: "entrada_compra",
        quantity: itemQuantity,
        reference_purchase_id: purchaseId,
        notes: null,
      });

    if (movementError) {
      fail(
        "La compra se creó pero no se pudo registrar el movimiento de inventario: " +
          movementError.message
      );
    }

    const { error: updateError } = await supabase
      .from("inventory_items")
      .update({ quantity_on_hand: newQuantity })
      .eq("id", itemInventoryItemId);

    if (updateError) {
      fail(
        "La compra se creó pero no se pudo actualizar el stock: " +
          updateError.message
      );
    }
  }

  redirect("/compras");
}
