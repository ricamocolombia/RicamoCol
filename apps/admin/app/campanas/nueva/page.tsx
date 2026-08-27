import { CAMPAIGN_SEGMENTS, CAMPAIGN_SEGMENT_LABELS } from "../../../lib/metrics";
import { crearCampana } from "../actions";

export default async function NuevaCampanaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="px-6 py-10">
      <h1 className="text-2xl font-bold mb-2">Nueva campaña</h1>
      <p className="text-neutral-600 mb-6">
        Se envía por correo (via Resend) a los clientes con email en el
        segmento que elijas. Queda en borrador hasta que la envíes desde{" "}
        <span className="font-medium">Campañas</span>.
      </p>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <form
        action={crearCampana}
        className="rounded-xl border border-neutral-200 bg-white p-6 max-w-xl space-y-4"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nombre interno de la campaña *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Lanzamiento colección Medellín"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="segment" className="block text-sm font-medium mb-1">
            A quién le llega *
          </label>
          <select
            id="segment"
            name="segment"
            required
            defaultValue="todos"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
          >
            {CAMPAIGN_SEGMENTS.map((segment) => (
              <option key={segment} value={segment}>
                {CAMPAIGN_SEGMENT_LABELS[segment]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            Asunto del correo *
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            placeholder="Nueva colección Ricamo ya está aquí"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium mb-1">
            Mensaje *
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={8}
            placeholder="Hola! Te cuento que ya lanzamos..."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Se envía como texto plano, sin plantilla HTML por ahora.
          </p>
        </div>

        <button
          type="submit"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
        >
          Guardar borrador
        </button>
      </form>
    </main>
  );
}
