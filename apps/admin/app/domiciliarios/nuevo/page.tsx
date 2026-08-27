import Link from "next/link";
import { crearDomiciliario } from "./actions";

export default async function NuevoDomiciliarioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="px-6 py-10 max-w-lg">
      <div className="mb-6">
        <Link href="/domiciliarios" className="text-sm text-neutral-500 hover:text-ricamo-black">
          ← Domiciliarios
        </Link>
        <h1 className="text-2xl font-bold mt-2">Nuevo domiciliario</h1>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <form action={crearDomiciliario} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nombre *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
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

        <div className="flex items-center gap-2">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 rounded border-neutral-300"
          />
          <label htmlFor="is_active" className="text-sm font-medium">
            Activo
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg py-2"
        >
          Guardar domiciliario
        </button>
      </form>
    </main>
  );
}
