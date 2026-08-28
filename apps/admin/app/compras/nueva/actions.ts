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
  const invoiceNumber = String(formData.get("invoice_number") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "pendiente").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const warehouseId = String(formData.get("warehouse_id") ?? "").trim();
  const garmentType = String(formData.get("garment_type") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim();

  const itemDescription = String(formData.get("item_description") ?? "").trim();
  const itemQuantityRaw = String(formData.get("item_quantity") ?? "1");
  const itemUnitCostRaw = String(formData.get("item_unit_cost_cop") ?? "0");

  const itemQuantity = Number.parseInt(itemQuantityRaw, 10);
  const itemUnitCost = Number.parseInt(itemUnitCostRaw, 10);

  if (!supplierId) {
    fail("El proveedor es obligatorio");
  }
  if (!isPurchaseStatus(statusRaw)) {
    fail("Estado de compra inválido");
  }
  const status: PurchaseStatus = statusRaw;

  const isWarehouseItem = Boolean(warehouseId && garmentType);
  if (!isWarehouseItem && !itemDescription) {
    fail(
      "Llena bodega + tipo de prenda, o escribe una descripción libre para lo comprado"
    );
  }
  if (warehouseId && !garmentType) {
    fail("Si eliges una bodega, el tipo de prenda es obligatorio");
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
      invoice_number: invoiceNumber || null,
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

  const purchaseId = purchase.id;

  // Si la compra trae bodega + tipo de prenda, buscamos (o creamos) el
  // inventory_item exacto para esa combinacion bodega/tipo/color/talla. Cada
  // bodega tiene su propia fila de inventario, aunque sea la misma prenda.
  let inventoryItemId: string | null = null;

  if (isWarehouseItem) {
    let query = supabase
      .from("inventory_items")
      .select("id")
      .eq("warehouse_id", warehouseId)
      .eq("garment_type", garmentType);

    query = color ? query.eq("color", color) : query.is("color", null);
    query = size ? query.eq("size", size) : query.is("size", null);

    const { data: existingItem, error: findError } = await query.maybeSingle();

    if (findError) {
      fail(
        "No se pudo buscar el ítem de inventario: " + findError.message
      );
    }

    if (existingItem) {
      inventoryItemId = existingItem.id;
    } else {
      const name = [garmentType, color, size ? `talla ${size}` : null]
        .filter(Boolean)
        .join(" ");

      const { data: newItem, error: createError } = await supabase
        .from("inventory_items")
        .insert({
          name,
          garment_type: garmentType,
          color: color || null,
          size: size || null,
          supplier_id: supplierId,
          warehouse_id: warehouseId,
          quantity_on_hand: 0,
        })
        .select("id")
        .single();

      if (createError || !newItem) {
        fail(
          "No se pudo crear el ítem de inventario para esa bodega: " +
            (createError?.message ?? "error desconocido")
        );
      }

      inventoryItemId = newItem.id;
    }
  }

  const purchaseItemDescription = isWarehouseItem
    ? [garmentType, color, size ? `talla ${size}` : null].filter(Boolean).join(" ")
    : itemDescription;

  const { error: itemError } = await supabase.from("purchase_items").insert({
    purchase_id: purchaseId,
    inventory_item_id: inventoryItemId,
    description: purchaseItemDescription || null,
    quantity: itemQuantity,
    unit_cost_cop: itemUnitCost,
  });

  if (itemError) {
    fail(
      "La compra se creó pero no se pudo guardar el detalle: " + itemError.message
    );
  }

  // Si la compra ya llego "recibida" y quedo vinculada a un item de
  // inventario, sumamos el stock de esa bodega y dejamos el movimiento
  // registrado. Si es descripcion libre (sin bodega), no hay a que item
  // sumarle stock -- la compra queda registrada igual.
  if (status === "recibida" && inventoryItemId) {
    const { data: currentItem, error: fetchError } = await supabase
      .from("inventory_items")
      .select("id, quantity_on_hand")
      .eq("id", inventoryItemId)
      .single();

    if (fetchError || !currentItem) {
      fail(
        "La compra se creó pero no se pudo actualizar el inventario: ítem no encontrado"
      );
    }

    const newQuantity = currentItem.quantity_on_hand + itemQuantity;

    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert({
        inventory_item_id: inventoryItemId,
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
      .eq("id", inventoryItemId);

    if (updateError) {
      fail(
        "La compra se creó pero no se pudo actualizar el stock: " +
          updateError.message
      );
    }
  }

  redirect("/compras");
}
