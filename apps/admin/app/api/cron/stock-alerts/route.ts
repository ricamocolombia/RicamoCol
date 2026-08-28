import { NextResponse } from "next/server";
import { checkAndSendStockAlerts } from "../../../../lib/stockAlerts";

// Llamado por Vercel Cron cada noche (ver ../../../../vercel.json). Protegido
// con CRON_SECRET -- Vercel manda ese valor en el header Authorization en
// cada invocacion programada; sin la variable configurada, este endpoint
// rechaza cualquier llamada.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await checkAndSendStockAlerts();
  return NextResponse.json(result);
}
