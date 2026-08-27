export default function PersonalizadosPage() {
  return (
    <main className="px-6 py-16">
      <h1 className="text-3xl font-bold mb-4">Diseno personalizado</h1>
      <p className="text-black/70 max-w-2xl mb-6">
        TODO: formulario de cotizacion (tipo de prenda, tecnica -bordado o
        estampado-, talla, cantidad, referencia de diseno). Al enviarlo se
        crea un `design_request` en Supabase y se redirige a WhatsApp
        (NEXT_PUBLIC_WHATSAPP_NUMBER) con el detalle prellenado para que
        Maria Jose continue la conversacion y cierre la venta.
      </p>
    </main>
  );
}
