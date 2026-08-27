import { crearCliente } from "./actions";

export default async function NuevoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Nuevo cliente</h1>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <form
        action={crearCliente}
        className="rounded-xl border border-neutral-200 bg-white p-6 max-w-xl space-y-4"
      >
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium mb-1">
            Nombre completo *
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Teléfono / WhatsApp
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">
              Ciudad
            </label>
            <input
              id="city"
              name="city"
              type="text"
              placeholder="Medellín"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label
              htmlFor="instagram_handle"
              className="block text-sm font-medium mb-1"
            >
              Instagram
            </label>
            <input
              id="instagram_handle"
              name="instagram_handle"
              type="text"
              placeholder="@usuario"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
        >
          Guardar cliente
        </button>
      </form>
    </main>
  );
}
