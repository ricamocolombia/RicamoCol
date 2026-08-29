import { Resend } from "resend";
import { buildOrderStatusEmail, type OrderEmailKind } from "@ricamo/ui";
import { createServiceRoleClient } from "@ricamo/supabase/server";

// Envia el correo transaccional del pedido (creado / confirmado / en
// produccion / enviado / entregado / cancelado) al cliente, si tiene correo
// registrado. Nunca lanza -- un fallo de envio (Resend caido, sin API key
// configurada, cliente sin correo) no debe tumbar la Server Action que crea
// o actualiza la venta, que ya tuvo exito en Supabase antes de llegar aqui.
export async function sendOrderStatusEmail(orderId: string, kind: OrderEmailKind) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !fromEmail) return;

    const supabase = createServiceRoleClient();

    const { data: order } = await supabase
      .from("orders")
      .select("customer_id, total_cop, courier_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!order?.customer_id) return;

    const [{ data: customer }, { data: itemsData }, { data: courier }] = await Promise.all([
      supabase.from("customers").select("full_name, email").eq("id", order.customer_id).maybeSingle(),
      supabase
        .from("order_items")
        .select("description, quantity, unit_price_cop, garment_type, color, size, technique")
        .eq("order_id", orderId),
      order.courier_id
        ? supabase.from("couriers").select("name").eq("id", order.courier_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (!customer?.email) return;
    const items = itemsData ?? [];
    if (items.length === 0) return;

    const email = buildOrderStatusEmail({
      kind,
      customerName: customer.full_name,
      items: items.map((item) => ({
        description: item.description ?? "Prenda personalizada",
        quantity: item.quantity,
        unitPriceCop: item.unit_price_cop,
        technique: item.technique,
        garmentType: item.garment_type,
        color: item.color,
        size: item.size,
      })),
      totalCop: order.total_cop,
      courierName: courier?.name ?? null,
    });

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: fromEmail,
      to: customer.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch {
    // Ver comentario de la funcion: un correo que falla no debe afectar el
    // resto del flujo de la venta.
  }
}
