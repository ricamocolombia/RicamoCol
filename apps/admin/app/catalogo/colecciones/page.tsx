import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { actualizarColeccion, crearColeccion, toggleColeccionActiva } from "./actions";
import { ImageDropzone } from "../../../components/ImageDropzone";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

interface CollectionRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  is_active: boolean;
}

export default async function ColeccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data: collectionsData, error: fetchError } = await supabase
    .from("collections")
    .select("id, name, slug, description, cover_image_url, is_active")
    .order("sort_order", { ascending: true });

  const collections = (collectionsData ?? []) as unknown as CollectionRow[];

  return (
    <main className="px-6 py-10">
      <Link href="/catalogo" className="text-sm text-neutral-500 hover:text-ricamo-black">
        ← Catálogo
      </Link>
      <div className="mt-2 mb-6">
        <h1 className="text-2xl font-bold mb-1">Colecciones</h1>
        <p className="text-neutral-600">
          Grupos temáticos de productos (temporada, fecha especial, etc.) que
          se pueden mostrar y filtrar en la web pública.
        </p>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}
      {fetchError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando colecciones: {fetchError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden mb-8">
        {collections.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay colecciones creadas.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Colección</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <form action={actualizarColeccion} className="space-y-2 max-w-md">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="current_cover_image_url" value={c.cover_image_url ?? ""} />
                      <div className="flex items-center gap-3">
                        {c.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.cover_image_url}
                            alt={c.name}
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex-shrink-0" />
                        )}
                        <input
                          name="name"
                          type="text"
                          required
                          defaultValue={c.name}
                          className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm flex-1"
                        />
                      </div>
                      <p className="text-xs text-neutral-400">/{c.slug}</p>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={c.description ?? ""}
                        placeholder="Descripción (opcional)"
                        className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                      <input
                        name="cover_image"
                        type="file"
                        accept="image/*"
                        className="text-xs text-neutral-500"
                      />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-ricamo-black bg-ricamo-yellow rounded-lg px-3 py-1.5"
                      >
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.is_active ? (
                        <span className="inline-block rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-1">
                          Activa
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium px-2 py-1">
                          Inactiva
                        </span>
                      )}
                      <form action={toggleColeccionActiva}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="is_active" value={String(c.is_active)} />
                        <button
                          type="submit"
                          className="text-xs text-neutral-500 hover:text-ricamo-black underline underline-offset-2 whitespace-nowrap"
                        >
                          {c.is_active ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Nueva colección</h2>
        <form action={crearColeccion} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nombre *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ej: Amor y amistad"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Imagen de portada</label>
            <ImageDropzone name="cover_image" />
          </div>
          <button
            type="submit"
            className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
          >
            Guardar colección
          </button>
        </form>
      </div>
    </main>
  );
}
