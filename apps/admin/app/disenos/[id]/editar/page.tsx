import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { actualizarDiseno } from "./actions";

type DesignTechnique = "bordado" | "estampado";

interface DesignRow {
  id: string;
  name: string;
  technique: DesignTechnique;
  customer_id: string | null;
  image_url: string | null;
  notes: string | null;
}

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
}

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

export default async function EditarDisenoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: designData }, { data: customersData }] = await Promise.all([
    supabase
      .from("designs")
      .select("id, name, technique, customer_id, image_url, notes")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("customers")
      .select("id, full_name, phone")
      .order("full_name", { ascending: true }),
  ]);

  const design = designData as unknown as DesignRow | null;
  const customers = (customersData ?? []) as unknown as CustomerRow[];

  if (!design) {
    notFound();
  }

  return (
    <main className="px-6 py-10 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/disenos"
          className="text-sm text-neutral-500 hover:text-ricamo-black"
        >
          ← Diseños
        </Link>
        <h1 className="text-2xl font-bold mt-2">Editar diseño</h1>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <form action={actualizarDiseno} className="space-y-6">
        <input type="hidden" name="id" value={design.id} />

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
              defaultValue={design.name}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

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
              defaultValue={design.technique}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              <option value="bordado">Bordado</option>
              <option value="estampado">Estampado</option>
            </select>
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
              defaultValue={design.customer_id ?? ""}
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
            <label
              htmlFor="image_url"
              className="block text-sm font-medium mb-1"
            >
              URL de la imagen
            </label>
            <input
              id="image_url"
              name="image_url"
              type="text"
              defaultValue={design.image_url ?? ""}
              placeholder="https://..."
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
              defaultValue={design.notes ?? ""}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
        </section>

        <button
          type="submit"
          className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg py-3"
        >
          Guardar cambios
        </button>
      </form>
    </main>
  );
}
