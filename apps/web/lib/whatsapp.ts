// Construye un link de WhatsApp con mensaje prellenado. El numero viene de
// NEXT_PUBLIC_WHATSAPP_NUMBER (visto publicamente en el Instagram @ricamo_col,
// pendiente de confirmar oficialmente con el negocio -- ver backlog).
export function buildWhatsAppLink(message: string): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
}
