import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { CAMPAIGN_SEGMENT_LABELS, dateTimeFormatter, type CampaignSegment } from "../../lib/metrics";
import { enviarCampana } from "./actions";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  segment: CampaignSegment;
  status: "borrador" | "enviada" | "fallida";
  recipients_count: number | null;
  sent_at: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<CampaignRow["status"], string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  fallida: "Fallida",
};

const STATUS_STYLES: Record<CampaignRow["status"], string> = {
  borrador: "bg-neutral-100 text-neutral-600",
  enviada: "bg-green-100 text-green-700",
  fallida: "bg-red-100 text-ricamo-red",
};

export default async function CampanasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: actionError } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .select("id, name, subject, segment, status, recipients_count, sent_at, created_at")
    .order("created_at", { ascending: false });

  const campaigns = (data ?? []) as unknown as CampaignRow[];
  const resendConfigured = Boolean(
    process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
  );

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Campañas de marketing</h1>
          <p className="text-neutral-600">
            Anuncios de nuevas colecciones o promociones por correo, segmentados
            por comportamiento de compra.
          </p>
        </div>
        <Link
          href="/campanas/nueva"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
        >
          + Nueva campaña
        </Link>
      </div>

      {!resendConfigured && (
        <p className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4">
          Falta configurar <code>RESEND_API_KEY</code> y{" "}
          <code>RESEND_FROM_EMAIL</code> — puedes crear campañas en borrador,
          pero no se podrán enviar hasta que esas variables estén configuradas.
        </p>
      )}

      {actionError && (
        <p className="text-sm text-ricamo-red mb-4">{actionError}</p>
      )}
      {error && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando campañas: {error.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
        {campaigns.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay campañas creadas.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Campaña</th>
                <th className="px-4 py-3 font-medium">Segmento</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Destinatarios</th>
                <th className="px-4 py-3 font-medium">Enviada</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{campaign.name}</div>
                    <div className="text-xs text-neutral-500">{campaign.subject}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {CAMPAIGN_SEGMENT_LABELS[campaign.segment]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full text-xs font-medium px-2 py-1 ${STATUS_STYLES[campaign.status]}`}
                    >
                      {STATUS_LABELS[campaign.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {campaign.recipients_count ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                    {campaign.sent_at
                      ? dateTimeFormatter.format(new Date(campaign.sent_at))
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {campaign.status === "borrador" && (
                      <form action={enviarCampana}>
                        <input type="hidden" name="id" value={campaign.id} />
                        <button
                          type="submit"
                          disabled={!resendConfigured}
                          className="text-xs font-semibold text-ricamo-black bg-ricamo-yellow rounded-lg px-3 py-1.5 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Enviar
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
