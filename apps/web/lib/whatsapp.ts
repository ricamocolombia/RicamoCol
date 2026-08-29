// Construye un link de WhatsApp con mensaje prellenado. El numero viene de
// NEXT_PUBLIC_WHATSAPP_NUMBER (confirmado por el negocio: 573216245987).
export function buildWhatsAppLink(message: string): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
}
