import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";

interface Courier {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

export default async function DomiciliariosPage() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("couriers")
    .select("id, name, phone, is_active, notes, created_at")
    .order("name", { ascending: true });

  const couriers = (data ?? []) as unknown as Courier[];

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Domiciliarios</h1>
          <p className="text-neutral-600">
            Personas o transportadoras que hacen las entregas de los pedidos.
          </p>
        </div>
        <Link
          href="/domiciliarios/nuevo"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
        >
          + Nuevo domiciliario
        </Link>
      </div>

      {error && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando domiciliarios: {error.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {couriers.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay domiciliarios registrados.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody>
              {couriers.map((courier) => (
                <tr key={courier.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{courier.name}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {courier.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {courier.is_active ? (
                      <span className="inline-block rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-1">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium px-2 py-1">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {courier.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
