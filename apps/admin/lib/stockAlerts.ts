import { Resend } from "resend";
import { buildStockAlertEmail } from "@ricamo/ui";
import { createServiceRoleClient } from "@ricamo/supabase/server";

interface InventoryItemRow {
  name: string;
  garment_type: string;
  size: string | null;
  color: string | null;
  quantity_on_hand: number;
  reorder_level: number;
  warehouse_id: string | null;
  alert_enabled: boolean;
}

interface WarehouseRow {
  id: string;
  name: string;
}

export interface StockAlertResult {
  sent: boolean;
  lowStockCount: number;
  reason?: string;
}

// Revisa el inventario y, si hay items en o bajo su nivel minimo (con la
// alerta activa), envia un correo con el resumen agrupado por bodega. Se usa
// tanto desde el cron nocturno (apps/admin/app/api/cron/stock-alerts) como
// desde el boton "Enviar alerta por correo ahora" en Inventario.
export async function checkAndSendStockAlerts(): Promise<StockAlertResult> {
  const supabase = createServiceRoleClient();

  const { data: settingRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "stock_alert_email")
    .maybeSingle();
  const alertEmail = settingRow?.value;

  if (!alertEmail) {
    return {
      sent: false,
      lowStockCount: 0,
      reason: "No hay un correo de alertas configurado en Configuración",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return {
      sent: false,
      lowStockCount: 0,
      reason: "Falta configurar RESEND_API_KEY / RESEND_FROM_EMAIL",
    };
  }

  const [{ data: itemsData }, { data: warehousesData }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select(
        "name, garment_type, size, color, quantity_on_hand, reorder_level, warehouse_id, alert_enabled"
      ),
    supabase.from("warehouses").select("id, name"),
  ]);

  const items = (itemsData ?? []) as unknown as InventoryItemRow[];
  const warehouses = (warehousesData ?? []) as unknown as WarehouseRow[];
  const warehousesById = new Map(warehouses.map((w) => [w.id, w.name]));

  const lowStock = items.filter(
    (i) => i.alert_enabled && i.quantity_on_hand <= i.reorder_level
  );

  if (lowStock.length === 0) {
    return {
      sent: false,
      lowStockCount: 0,
      reason: "Todo el inventario está en niveles saludables, no se envió correo",
    };
  }

  const byWarehouse = new Map<string, InventoryItemRow[]>();
  for (const item of lowStock) {
    const key = item.warehouse_id ? warehousesById.get(item.warehouse_id) ?? "Sin bodega" : "Sin bodega";
    const list = byWarehouse.get(key) ?? [];
    list.push(item);
    byWarehouse.set(key, list);
  }

  const groups = [...byWarehouse.entries()].map(([warehouseName, warehouseItems]) => ({
    warehouseName,
    items: warehouseItems.map((item) => ({
      name: item.name,
      detail: [item.garment_type, item.size ? `talla ${item.size}` : null, item.color ?? null]
        .filter(Boolean)
        .join(", "),
      quantityOnHand: item.quantity_on_hand,
      reorderLevel: item.reorder_level,
    })),
  }));

  const email = buildStockAlertEmail({ groups, generatedAt: new Date() });

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: fromEmail,
    to: alertEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  return { sent: true, lowStockCount: lowStock.length };
}
