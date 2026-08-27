"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import {
  CAMPAIGN_SEGMENTS,
  classifyCustomerSegment,
  matchesCampaignSegment,
  type CampaignSegment,
} from "../../lib/metrics";

function isCampaignSegment(value: string): value is CampaignSegment {
  return (CAMPAIGN_SEGMENTS as readonly string[]).includes(value);
}

export async function crearCampana(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const segment = String(formData.get("segment") ?? "todos").trim();

  if (!name || !subject || !body) {
    redirect(
      `/campanas/nueva?error=${encodeURIComponent(
        "Nombre, asunto y mensaje son obligatorios"
      )}`
    );
  }
  if (!isCampaignSegment(segment)) {
    redirect(`/campanas/nueva?error=${encodeURIComponent("Segmento inválido")}`);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("marketing_campaigns").insert({
    name,
    subject,
    body,
    segment,
    status: "borrador",
  });

  if (error) {
    redirect(
      `/campanas/nueva?error=${encodeURIComponent(
        "No se pudo crear la campaña: " + error.message
      )}`
    );
  }

  redirect("/campanas");
}

// Calcula la audiencia de una campaña: clientes con correo cuyo segmento de
// recompra (calculado a partir de sus pedidos) coincide con el segmento de
// la campaña.
async function resolveAudience(
  supabase: ReturnType<typeof createServiceRoleClient>,
  segment: CampaignSegment
) {
  const [{ data: customersData }, { data: ordersData }] = await Promise.all([
    supabase.from("customers").select("id, full_name, email"),
    supabase.from("orders").select("customer_id, created_at"),
  ]);

  const customers = customersData ?? [];
  const orders = ordersData ?? [];

  const ordersByCustomer = new Map<string, string[]>();
  for (const order of orders) {
    if (!order.customer_id) continue;
    const list = ordersByCustomer.get(order.customer_id) ?? [];
    list.push(order.created_at);
    ordersByCustomer.set(order.customer_id, list);
  }

  return customers.filter((customer) => {
    if (!customer.email) return false;
    const dates = (ordersByCustomer.get(customer.id) ?? []).sort().reverse();
    const customerSegment = classifyCustomerSegment(dates.length, dates[0] ?? null);
    return matchesCampaignSegment(segment, customerSegment);
  });
}

// Tope de seguridad para el envio secuencial -- suficiente para el tamano
// actual de la base de clientes de Ricamo. Si la base crece mucho, esto
// deberia moverse a un job en segundo plano en vez de una Server Action.
const MAX_RECIPIENTS_PER_SEND = 500;

export async function enviarCampana(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect(`/campanas?error=${encodeURIComponent("Campaña inválida")}`);
  }

  const supabase = createServiceRoleClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("marketing_campaigns")
    .select("id, name, subject, body, segment, status")
    .eq("id", id)
    .single();

  if (campaignError || !campaign) {
    redirect(`/campanas?error=${encodeURIComponent("No se encontró la campaña")}`);
  }

  if (campaign.status !== "borrador") {
    redirect(
      `/campanas?error=${encodeURIComponent("Esta campaña ya fue enviada")}`
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    redirect(
      `/campanas?error=${encodeURIComponent(
        "Falta configurar RESEND_API_KEY / RESEND_FROM_EMAIL para poder enviar campañas"
      )}`
    );
  }

  const audience = await resolveAudience(supabase, campaign.segment);
  const recipients = audience.slice(0, MAX_RECIPIENTS_PER_SEND);

  if (recipients.length === 0) {
    redirect(
      `/campanas?error=${encodeURIComponent(
        "No hay clientes con correo en el segmento elegido"
      )}`
    );
  }

  const resend = new Resend(apiKey);

  let sent = 0;
  for (const recipient of recipients) {
    if (!recipient.email) continue;
    try {
      await resend.emails.send({
        from: fromEmail,
        to: recipient.email,
        subject: campaign.subject,
        text: campaign.body,
      });
      sent += 1;
    } catch {
      // Un fallo individual no debe tumbar el envio completo; sigue con el
      // resto y al final se guarda cuantos se lograron enviar.
    }
  }

  const { error: updateError } = await supabase
    .from("marketing_campaigns")
    .update({
      status: sent > 0 ? "enviada" : "fallida",
      sent_at: new Date().toISOString(),
      recipients_count: sent,
    })
    .eq("id", id);

  if (updateError) {
    redirect(
      `/campanas?error=${encodeURIComponent(
        "La campaña se envió pero no se pudo actualizar su estado: " +
          updateError.message
      )}`
    );
  }

  redirect("/campanas");
}
