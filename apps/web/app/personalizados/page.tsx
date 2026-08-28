import { crearSolicitud } from "./actions";

export default async function PersonalizadosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="max-w-2xl mx-auto px-6 py-14">
      <p className="uppercase tracking-widest text-ricamo-red text-sm font-bold mb-3">
        Hecho a tu medida
      </p>
      <h1 className="font-display text-4xl mb-4">Personaliza tu prenda</h1>
      <p className="text-ricamo-black/70 mb-10">
        Cuéntanos qué tienes en mente — un diseño, una foto de referencia, una
        idea suelta — y Maria Jose te lo dibuja. Al enviar el formulario te
        llevamos directo a WhatsApp para cerrar los detalles con ella.
      </p>

      {error && (
        <p className="text-sm text-ricamo-red bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">
          {error}
        </p>
      )}

      <form action={crearSolicitud} className="space-y-6">
        <div className="rounded-3xl bg-white border border-black/10 p-6 space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-ricamo-black/50">
            Tus datos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nombre *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded-xl border border-black/15 px-4 py-2.5"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                WhatsApp *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="300 000 0000"
                className="w-full rounded-xl border border-black/15 px-4 py-2.5"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Correo (opcional)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-xl border border-black/15 px-4 py-2.5"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1">
                Ciudad
              </label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="Medellín"
                className="w-full rounded-xl border border-black/15 px-4 py-2.5"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-black/10 p-6 space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-ricamo-black/50">
            Tu prenda
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="garment_type" className="block text-sm font-medium mb-1">
                Prenda *
              </label>
              <select
                id="garment_type"
                name="garment_type"
                required
                defaultValue="camiseta"
                className="w-full rounded-xl border border-black/15 px-4 py-2.5 bg-white"
              >
                <option value="camiseta">Camiseta</option>
                <option value="buzo">Buzo</option>
              </select>
            </div>
            <div>
              <label htmlFor="technique" className="block text-sm font-medium mb-1">
                Técnica *
              </label>
              <select
                id="technique"
                name="technique"
                required
                defaultValue="estampado"
                className="w-full rounded-xl border border-black/15 px-4 py-2.5 bg-white"
              >
                <option value="estampado">Estampado</option>
                <option value="bordado">Bordado</option>
              </select>
            </div>
            <div>
              <label htmlFor="size" className="block text-sm font-medium mb-1">
                Talla
              </label>
              <input
                id="size"
                name="size"
                type="text"
                placeholder="M, L, XL..."
                className="w-full rounded-xl border border-black/15 px-4 py-2.5"
              />
            </div>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-1">
              Cantidad
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              defaultValue={1}
              className="w-32 rounded-xl border border-black/15 px-4 py-2.5"
            />
          </div>

          <div>
            <label htmlFor="reference_notes" className="block text-sm font-medium mb-1">
              ¿Qué tienes en mente? *
            </label>
            <textarea
              id="reference_notes"
              name="reference_notes"
              required
              rows={4}
              placeholder="Ej: quiero una camiseta de pareja con el mapa de Medellín bordado, tonos crudo..."
              className="w-full rounded-xl border border-black/15 px-4 py-2.5"
            />
            <p className="text-xs text-ricamo-black/50 mt-1">
              Si tienes una foto de referencia, la compartes directo por
              WhatsApp en el siguiente paso.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center bg-ricamo-red text-white font-semibold rounded-full px-8 py-4 hover:bg-ricamo-black transition-colors"
        >
          Continuar por WhatsApp
        </button>
      </form>
    </main>
  );
}
