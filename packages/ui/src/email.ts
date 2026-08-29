// Plantillas de correo transaccional de Ricamo: HTML con tablas + estilos
// inline (asi funcionan de forma confiable en clientes de correo, a
// diferencia de <style> en <head> o clases de Tailwind). Sin dependencias de
// React: son strings que cualquier Server Action puede pasarle directo a
// Resend (`resend.emails.send({ html, text, ... })`).
import { brand } from "./tokens";

// Dominio publico definitivo del ecommerce -- de aqui se sirve el logo, asi
// que el correo se ve bien sin importar si lo envia apps/web o apps/admin.
const SITE_URL = "https://ricamocol.com";
const LOGO_URL = `${SITE_URL}/brand/logo-transparente-amarillo.png`;

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Envoltura compartida: header negro con el logo, tarjeta blanca de
// contenido, pie de pagina color hueso con el tagline. `badgeLabel` es la
// pildora de estado (opcional) que aparece arriba del titulo.
function renderEmailLayout(options: {
  preheader: string;
  badgeLabel?: string;
  badgeColor?: string;
  heading: string;
  bodyHtml: string;
}) {
  const { preheader, badgeLabel, badgeColor = brand.colors.yellow, heading, bodyHtml } = options;

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ricamo</title>
  </head>
  <body style="margin:0; padding:0; background-color:${"#FAF6EC"}; font-family: Arial, Helvetica, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF6EC; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:100%; background-color:#ffffff; border-radius:24px; overflow:hidden;">
            <tr>
              <td align="center" style="background-color:${brand.colors.black}; padding:28px 32px;">
                <img src="${LOGO_URL}" width="130" alt="Ricamo" style="display:block; border:0; outline:none; text-decoration:none;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                ${
                  badgeLabel
                    ? `<span style="display:inline-block; background-color:${badgeColor}22; color:${badgeColor}; font-size:12px; font-weight:bold; letter-spacing:0.04em; text-transform:uppercase; border-radius:999px; padding:6px 14px; margin-bottom:16px;">${escapeHtml(badgeLabel)}</span>`
                    : ""
                }
                <h1 style="margin:0 0 16px; font-size:24px; line-height:1.3; color:${brand.colors.black};">${escapeHtml(heading)}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td align="center" style="background-color:#F1EADA; padding:24px 32px; font-size:12px; color:#8a8371;">
                <strong style="color:${brand.colors.black};">${brand.name}</strong> — ${brand.tagline}<br />
                <a href="${SITE_URL}" style="color:#8a8371;">${SITE_URL.replace("https://", "")}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export interface OrderEmailItem {
  description: string;
  quantity: number;
  unitPriceCop: number;
  technique?: "bordado" | "estampado" | null;
  garmentType?: string | null;
  color?: string | null;
  size?: string | null;
}

export type OrderEmailKind =
  | "creado"
  | "confirmado"
  | "en_produccion"
  | "enviado"
  | "entregado"
  | "cancelado";

export interface OrderEmailInput {
  kind: OrderEmailKind;
  customerName: string;
  items: OrderEmailItem[];
  totalCop: number;
  courierName?: string | null;
}

const ORDER_COPY: Record<
  OrderEmailKind,
  { subject: string; badge: string; badgeColor: string; heading: string; message: (input: OrderEmailInput) => string }
> = {
  creado: {
    subject: "Recibimos tu pedido",
    badge: "Pedido recibido",
    badgeColor: brand.colors.yellow,
    heading: "¡Gracias por tu compra!",
    message: () =>
      "Ya registramos tu pedido en Ricamo. Te iremos avisando por aquí a medida que avance — confirmación, producción y envío.",
  },
  confirmado: {
    subject: "Tu pedido fue confirmado",
    badge: "Confirmado",
    badgeColor: brand.colors.yellow,
    heading: "Pedido confirmado",
    message: () => "Confirmamos tu pedido y ya lo estamos alistando para producción.",
  },
  en_produccion: {
    subject: "Tu pedido está en producción",
    badge: "En producción",
    badgeColor: brand.colors.yellow,
    heading: "¡Manos a la obra!",
    message: () =>
      "Tu pedido ya está en producción con nuestro taller. En cuanto esté listo, te avisamos que va en camino.",
  },
  enviado: {
    subject: "Tu pedido va en camino",
    badge: "Enviado",
    badgeColor: brand.colors.black,
    heading: "Tu pedido va en camino",
    message: (input) =>
      input.courierName
        ? `Ya despachamos tu pedido con ${escapeHtml(input.courierName)}. Pronto lo tendrás en tus manos.`
        : "Ya despachamos tu pedido. Pronto lo tendrás en tus manos.",
  },
  entregado: {
    subject: "Tu pedido fue entregado",
    badge: "Entregado",
    badgeColor: brand.colors.yellow,
    heading: "¡Que lo disfrutes!",
    message: () => "Tu pedido fue entregado. Gracias por confiar en Ricamo — nos encantaría verte con tu prenda puesta.",
  },
  cancelado: {
    subject: "Tu pedido fue cancelado",
    badge: "Cancelado",
    badgeColor: brand.colors.red,
    heading: "Tu pedido fue cancelado",
    message: () => "Tu pedido quedó cancelado. Si crees que esto es un error o tienes dudas, escríbenos y lo revisamos.",
  },
};

function itemLineLabel(item: OrderEmailItem) {
  const detail = [item.garmentType, item.color, item.size ? `talla ${item.size}` : null, item.technique]
    .filter(Boolean)
    .join(" · ");
  return detail ? `${item.description} <span style="color:#8a8371;">(${escapeHtml(detail)})</span>` : escapeHtml(item.description);
}

function renderItemsTable(items: OrderEmailItem[], totalCop: number) {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #F1EADA; font-size:14px; color:${brand.colors.black};">
          ${itemLineLabel(item)}<br />
          <span style="color:#8a8371; font-size:12px;">Cantidad: ${item.quantity}</span>
        </td>
        <td align="right" style="padding:10px 0; border-bottom:1px solid #F1EADA; font-size:14px; color:${brand.colors.black}; white-space:nowrap;">
          ${currencyFormatter.format(item.unitPriceCop * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      ${rows}
      <tr>
        <td style="padding:14px 0 0; font-size:15px; font-weight:bold; color:${brand.colors.black};">Total</td>
        <td align="right" style="padding:14px 0 0; font-size:15px; font-weight:bold; color:${brand.colors.black};">
          ${currencyFormatter.format(totalCop)}
        </td>
      </tr>
    </table>`;
}

export function buildOrderStatusEmail(input: OrderEmailInput): { subject: string; html: string; text: string } {
  const copy = ORDER_COPY[input.kind];
  const firstName = input.customerName.trim().split(/\s+/)[0] ?? input.customerName;

  const bodyHtml = `
    <p style="margin:0 0 4px; font-size:15px; color:${brand.colors.black};">Hola ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 8px; font-size:15px; line-height:1.6; color:${brand.colors.black};">${copy.message(input)}</p>
    ${renderItemsTable(input.items, input.totalCop)}
  `;

  const html = renderEmailLayout({
    preheader: copy.message(input),
    badgeLabel: copy.badge,
    badgeColor: copy.badgeColor,
    heading: copy.heading,
    bodyHtml,
  });

  const textLines = [
    `Hola ${firstName},`,
    "",
    copy.message(input).replace(/<[^>]+>/g, ""),
    "",
    ...input.items.map(
      (item) =>
        `- ${item.description} x${item.quantity}: ${currencyFormatter.format(item.unitPriceCop * item.quantity)}`
    ),
    "",
    `Total: ${currencyFormatter.format(input.totalCop)}`,
    "",
    `${brand.name} — ${brand.tagline}`,
  ];

  return { subject: `${copy.subject} — Ricamo`, html, text: textLines.join("\n") };
}

export interface StockAlertItem {
  name: string;
  detail: string;
  quantityOnHand: number;
  reorderLevel: number;
}

export interface StockAlertWarehouseGroup {
  warehouseName: string;
  items: StockAlertItem[];
}

export function buildStockAlertEmail(input: {
  groups: StockAlertWarehouseGroup[];
  generatedAt: Date;
}): { subject: string; html: string; text: string } {
  const totalItems = input.groups.reduce((sum, g) => sum + g.items.length, 0);
  const dateLabel = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(input.generatedAt);

  const groupsHtml = input.groups
    .map(
      (group) => `
      <h3 style="margin:20px 0 8px; font-size:14px; color:${brand.colors.black};">${escapeHtml(group.warehouseName)}</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${group.items
          .map(
            (item) => `
          <tr>
            <td style="padding:8px 0; border-bottom:1px solid #F1EADA; font-size:14px; color:${brand.colors.black};">
              ${escapeHtml(item.name)}${item.detail ? ` <span style="color:#8a8371;">(${escapeHtml(item.detail)})</span>` : ""}
            </td>
            <td align="right" style="padding:8px 0; border-bottom:1px solid #F1EADA; font-size:13px; color:${brand.colors.red}; white-space:nowrap;">
              quedan ${item.quantityOnHand} · mínimo ${item.reorderLevel}
            </td>
          </tr>`
          )
          .join("")}
      </table>`
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 4px; font-size:15px; line-height:1.6; color:${brand.colors.black};">
      ${totalItems} ítem(s) de inventario están en o por debajo de su nivel mínimo, al corte del ${dateLabel}.
    </p>
    ${groupsHtml}
    <p style="margin:24px 0 0; font-size:13px; color:#8a8371;">
      Ajusta el nivel mínimo o silencia la alerta de un ítem puntual desde Inventario en el panel admin.
    </p>
  `;

  const html = renderEmailLayout({
    preheader: `${totalItems} ítem(s) con stock bajo`,
    badgeLabel: "Alerta de inventario",
    badgeColor: brand.colors.red,
    heading: "Stock bajo en bodega",
    bodyHtml,
  });

  const textLines = [
    `Alerta de inventario bajo — Ricamo (${dateLabel})`,
    "",
    ...input.groups.flatMap((group) => [
      `Bodega: ${group.warehouseName}`,
      ...group.items.map(
        (item) =>
          `  - ${item.name}${item.detail ? ` (${item.detail})` : ""}: quedan ${item.quantityOnHand}, nivel mínimo ${item.reorderLevel}`
      ),
      "",
    ]),
    "Actualiza el nivel mínimo o silencia la alerta de un ítem desde el panel, en Inventario.",
  ];

  return {
    subject: `Ricamo — ${totalItems} ítem(s) con stock bajo`,
    html,
    text: textLines.join("\n"),
  };
}
