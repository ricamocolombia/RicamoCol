import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { actualizarSegmentoRegalo, crearSegmentoRegalo, toggleSegmentoRegaloActivo } from "./actions";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

interface GiftSegmentRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export default async function SegmentosRegaloPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data: segmentsData, error: fetchError } = await supabase
    .from("gift_segments")
    .select("id, name, slug, is_active")
    .order("sort_order", { ascending: true });

  const segments = (segmentsData ?? []) as unknown as GiftSegmentRow[];

  return (
    <main className="px-6 py-10">
      <Link href="/catalogo" className="text-sm text-neutral-500 hover:text-ricamo-black">
        ← Catálogo
      </Link>
      <div className="mt-2 mb-6">
        <h1 className="text-2xl font-bold mb-1">Regalos — segmentos</h1>
        <p className="text-neutral-600">
          A quién va dirigido cada idea de regalo (para parejas, familiares,
          amigos...). Se muestran como secciones en la página /regalos del
          sitio. Un producto puede estar en varios segmentos a la vez —
          se asigna desde Catálogo.
        </p>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}
      {fetchError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando segmentos: {fetchError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden mb-8">
        {segments.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay segmentos de regalo creados.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Segmento</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s) => (
                <tr key={s.id} className="border-b border-neutral-100 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <form action={actualizarSegmentoRegalo} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Nombre</label>
                        <input
                          name="name"
                          type="text"
                          required
                          defaultValue={s.name}
                          className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        className="text-xs font-semibold text-ricamo-black bg-ricamo-yellow rounded-lg px-3 py-1.5 whitespace-nowrap"
                      >
                        Guardar
                      </button>
                    </form>
                    <p className="text-xs text-neutral-400 mt-1">/{s.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {s.is_active ? (
                        <span className="inline-block rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-1">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium px-2 py-1">
                          Inactivo
                        </span>
                      )}
                      <form action={toggleSegmentoRegaloActivo}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="is_active" value={String(s.is_active)} />
                        <button
                          type="submit"
                          className="text-xs text-neutral-500 hover:text-ricamo-black underline underline-offset-2 whitespace-nowrap"
                        >
                          {s.is_active ? "Desactivar" : "Activar"}
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
        <h2 className="text-lg font-semibold mb-4">Nuevo segmento</h2>
        <form action={crearSegmentoRegalo} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nombre *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ej: Para compañeros de trabajo"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
          >
            Guardar segmento
          </button>
        </form>
      </div>
    </main>
  );
}
