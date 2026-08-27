import { NextResponse } from "next/server";

// TODO: validar el payload, crear la orden en Supabase (tablas `orders` +
// `order_items`) usando createServiceRoleClient de @ricamo/supabase, disparar
// el email de confirmacion via Resend y, si es un pedido personalizado,
// devolver el link de WhatsApp con el resumen para continuar la conversacion.
// Esta es la ruta que hace que toda venta del ecommerce quede registrada
// automaticamente en la app de administracion (mismo Supabase compartido).
export async function POST(request: Request) {
  return NextResponse.json(
    { ok: false, message: "Not implemented yet" },
    { status: 501 }
  );
}
