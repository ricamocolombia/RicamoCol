import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { crearDiseno } from "./actions";
import { ImageDropzone } from "../../../components/ImageDropzone";

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
}

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

export default async function NuevoDisenoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data: customersData } = await supabase
    .from("customers")
    .select("id, full_name, phone")
    .order("full_name", { ascending: true });

  const customers = (customersData ?? []) as unknown as CustomerRow[];

  return (
    <main className="px-6 py-10 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/disenos"
          className="text-sm text-neutral-500 hover:text-ricamo-black"
        >
          ← Diseños
        </Link>
        <h1 className="text-2xl font-bold mt-2">Nuevo diseño</h1>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <form action={crearDiseno} className="space-y-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nombre del diseño *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ej: Mapa Medellín sello postal"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="technique"
                className="block text-sm font-medium mb-1"
              >
                Técnica *
              </label>
              <select
                id="technique"
                name="technique"
                required
                defaultValue="bordado"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="bordado">Bordado</option>
                <option value="estampado">Estampado</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium mb-1"
              >
                Estado inicial
              </label>
              <select
                id="status"
                name="status"
                defaultValue="borrador"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                <option value="borrador">Borrador</option>
                <option value="enviado_aprobacion">
                  Enviado a aprobación
                </option>
                <option value="aprobado">Aprobado</option>
                <option value="enviado_maquiladora">
                  Enviado a maquiladora
                </option>
                <option value="archivado">Archivado</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="customer_id"
              className="block text-sm font-medium mb-1"
            >
              Cliente vinculado (opcional)
            </label>
            <select
              id="customer_id"
              name="customer_id"
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              <option value="">— Sin cliente / diseño propio —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                  {c.phone ? ` · ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Imágenes del diseño
            </label>
            <ImageDropzone name="images" multiple />
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
        </section>

        <button
          type="submit"
          className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg py-3"
        >
          Guardar diseño
        </button>
      </form>
    </main>
  );
}
