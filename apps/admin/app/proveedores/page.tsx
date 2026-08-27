import { createServiceRoleClient } from "@ricamo/supabase/server";
import { crearProveedor } from "./actions";

interface SupplierRow {
  id: string;
  name: string;
  type: "maquiladora" | "prendas" | "insumos" | "otro";
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<SupplierRow["type"], string> = {
  maquiladora: "Maquiladora",
  prendas: "Prendas en blanco",
  insumos: "Insumos",
  otro: "Otro",
};

const TYPE_STYLES: Record<SupplierRow["type"], string> = {
  maquiladora: "bg-purple-100 text-purple-700",
  prendas: "bg-blue-100 text-blue-700",
  insumos: "bg-yellow-100 text-yellow-800",
  otro: "bg-neutral-100 text-neutral-600",
};

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMessage } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("suppliers")
    .select(
      "id, name, type, contact_name, phone, email, notes, created_at"
    )
    .order("name", { ascending: true });

  const suppliers = (data ?? []) as unknown as SupplierRow[];

  return (
    <main className="px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Proveedores</h1>
        <p className="text-neutral-600">
          Maquiladoras (estampan/bordan) y proveedores de prendas en blanco o
          insumos.
        </p>
      </div>

      {error && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando proveedores: {error.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto mb-8">
        {suppliers.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay proveedores registrados.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Correo</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {s.name}
                    {s.notes && (
                      <div className="text-xs text-neutral-500 font-normal">
                        {s.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full text-xs font-medium px-2 py-1 ${TYPE_STYLES[s.type] ?? "bg-neutral-100 text-neutral-600"}`}
                    >
                      {TYPE_LABELS[s.type] ?? s.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {s.contact_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {s.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {s.email ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 max-w-xl">
        <h2 className="text-lg font-semibold mb-4">Agregar proveedor</h2>

        {errorMessage && (
          <p className="text-sm text-ricamo-red mb-4">{errorMessage}</p>
        )}

        <form action={crearProveedor} className="space-y-4">
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
            <label htmlFor="type" className="block text-sm font-medium mb-1">
              Tipo *
            </label>
            <select
              id="type"
              name="type"
              required
              defaultValue="prendas"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="maquiladora">Maquiladora</option>
              <option value="prendas">Proveedor de prendas</option>
              <option value="insumos">Insumos</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contact_name"
                className="block text-sm font-medium mb-1"
              >
                Persona de contacto
              </label>
              <input
                id="contact_name"
                name="contact_name"
                type="text"
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
                type="text"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
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

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
          >
            Guardar proveedor
          </button>
        </form>
      </div>
    </main>
  );
}
