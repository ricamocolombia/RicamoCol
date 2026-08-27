// Utilidades compartidas entre Clientes, Campañas y el Dashboard: no es una
// ruta, es lógica reusada por varios módulos del admin.

export type CustomerSegment = "sin_compras" | "nuevo" | "recurrente" | "inactivo";

const INACTIVE_AFTER_DAYS = 90;

// Clasifica a un cliente segun su historial de compras:
// - sin_compras: nunca ha comprado.
// - inactivo: ha comprado, pero su ultima compra fue hace mas de 90 dias
//   (sin importar cuantas compras tenga en total -- prioriza reactivacion).
// - recurrente: 2+ compras, la ultima hace 90 dias o menos.
// - nuevo: exactamente 1 compra, hace 90 dias o menos.
export function classifyCustomerSegment(
  orderCount: number,
  lastOrderAt: string | null
): CustomerSegment {
  if (orderCount === 0 || !lastOrderAt) return "sin_compras";

  const daysSinceLast =
    (Date.now() - new Date(lastOrderAt).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLast > INACTIVE_AFTER_DAYS) return "inactivo";
  return orderCount >= 2 ? "recurrente" : "nuevo";
}

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  sin_compras: "Sin compras",
  nuevo: "Nuevo",
  recurrente: "Recurrente",
  inactivo: "Inactivo",
};

export const SEGMENT_STYLES: Record<CustomerSegment, string> = {
  sin_compras: "bg-neutral-100 text-neutral-500",
  nuevo: "bg-blue-100 text-blue-700",
  recurrente: "bg-green-100 text-green-700",
  inactivo: "bg-yellow-100 text-yellow-800",
};

// Segmentos usados para targeting de campañas (marketing_campaigns.segment).
// "todos" incluye tambien a quienes nunca han comprado (leads con correo).
export const CAMPAIGN_SEGMENTS = [
  "todos",
  "nuevos",
  "recurrentes",
  "inactivos",
] as const;
export type CampaignSegment = (typeof CAMPAIGN_SEGMENTS)[number];

export const CAMPAIGN_SEGMENT_LABELS: Record<CampaignSegment, string> = {
  todos: "Todos los clientes",
  nuevos: "Clientes nuevos (1 compra)",
  recurrentes: "Clientes recurrentes (2+ compras)",
  inactivos: "Clientes inactivos (+90 días sin comprar)",
};

export function matchesCampaignSegment(
  campaignSegment: CampaignSegment,
  customerSegment: CustomerSegment
): boolean {
  if (campaignSegment === "todos") return true;
  if (campaignSegment === "nuevos") return customerSegment === "nuevo";
  if (campaignSegment === "recurrentes") return customerSegment === "recurrente";
  return customerSegment === "inactivo";
}

export const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
});

export const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});
