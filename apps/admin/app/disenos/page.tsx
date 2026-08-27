import Link from "next/link";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { updateDesignStatus, setEcommercePublish } from "./actions";

type DesignTechnique = "bordado" | "estampado";
type DesignStatus =
  | "borrador"
  | "enviado_aprobacion"
  | "aprobado"
  | "enviado_maquiladora"
  | "archivado";

interface DesignRow {
  id: string;
  name: string;
  technique: DesignTechnique;
  status: DesignStatus;
  customer_id: string | null;
  image_url: string | null;
  notes: string | null;
  published_to_ecommerce: boolean;
  published_at: string | null;
  created_at: string;
}

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
}

const TECHNIQUE_LABELS: Record<DesignTechnique, string> = {
  bordado: "Bordado",
  estampado: "Estampado",
};

const STATUS_LABELS: Record<DesignStatus, string> = {
  borrador: "Borrador",
  enviado_aprobacion: "Enviado a aprobación",
  aprobado: "Aprobado",
  enviado_maquiladora: "Enviado a maquiladora",
  archivado: "Archivado",
};

const STATUS_STYLES: Record<DesignStatus, string> = {
  borrador: "bg-neutral-100 text-neutral-600",
  enviado_aprobacion: "bg-yellow-100 text-yellow-800",
  aprobado: "bg-blue-100 text-blue-700",
  enviado_maquiladora: "bg-purple-100 text-purple-700",
  archivado: "bg-neutral-200 text-neutral-500",
};

// Accion "hacia adelante" sugerida segun el estado actual del flujo:
// borrador -> enviado_aprobacion -> aprobado -> enviado_maquiladora -> archivado
const FORWARD_ACTION: Partial<
  Record<DesignStatus, { status: DesignStatus; label: string }>
> = {
  borrador: { status: "enviado_aprobacion", label: "Enviar a aprobación" },
  enviado_aprobacion: { status: "aprobado", label: "Aprobar" },
  aprobado: { status: "enviado_maquiladora", label: "Enviar a maquiladora" },
  enviado_maquiladora: { status: "archivado", label: "Archivar" },
};

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

export default async function DisenosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;
  const supabase = createServiceRoleClient();

  const [{ data: designsData, error: designsError }, { data: customersData }] =
    await Promise.all([
      supabase
        .from("designs")
        .select(
          "id, name, technique, status, customer_id, image_url, notes, published_to_ecommerce, published_at, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase.from("customers").select("id, full_name, phone"),
    ]);

  const designs = (designsData ?? []) as unknown as DesignRow[];
  const customers = (customersData ?? []) as unknown as CustomerRow[];
  const customersById = new Map(customers.map((c) => [c.id, c]));

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Diseños</h1>
          <p className="text-neutral-600">
            Banco de diseños de Maria Jose (bordado y estampado), con su flujo
            de aprobación y la publicación al ecommerce.
          </p>
        </div>
        <Link
          href="/disenos/nueva"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2 whitespace-nowrap"
        >
          + Nuevo diseño
        </Link>
      </div>

      {errorParam && (
        <p className="text-sm text-ricamo-red mb-4">{errorParam}</p>
      )}
      {designsError && (
        <p className="text-sm text-ricamo-red mb-4">
          Error cargando diseños: {designsError.message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden overflow-x-auto">
        {designs.length === 0 ? (
          <p className="p-6 text-neutral-500 text-sm">
            Todavía no hay diseños registrados.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Diseño</th>
                <th className="px-4 py-3 font-medium">Técnica</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Ecommerce</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Creado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((design) => {
                const customer = design.customer_id
                  ? customersById.get(design.customer_id)
                  : undefined;
                const forward = FORWARD_ACTION[design.status];

                return (
                  <tr
                    key={design.id}
                    className="border-b border-neutral-100 last:border-0 align-top"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {design.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={design.image_url}
                            alt={design.name}
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium">{design.name}</div>
                          {design.notes && (
                            <div className="text-xs text-neutral-500 truncate max-w-[220px]">
                              {design.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {TECHNIQUE_LABELS[design.technique] ?? design.technique}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full text-xs font-medium px-2 py-1 ${
                          STATUS_STYLES[design.status] ??
                          "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {STATUS_LABELS[design.status] ?? design.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {design.published_to_ecommerce ? (
                        <span className="inline-block rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-1">
                          Publicado
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium px-2 py-1">
                          No publicado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {customer?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {dateFormatter.format(new Date(design.created_at))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 min-w-[170px]">
                        {forward && (
                          <form action={updateDesignStatus}>
                            <input type="hidden" name="id" value={design.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={forward.status}
                            />
                            <button
                              type="submit"
                              className="w-full text-xs font-semibold rounded-lg px-2 py-1.5 bg-ricamo-yellow text-ricamo-black"
                            >
                              {forward.label}
                            </button>
                          </form>
                        )}

                        {design.status === "enviado_aprobacion" && (
                          <form action={updateDesignStatus}>
                            <input type="hidden" name="id" value={design.id} />
                            <input
                              type="hidden"
                              name="status"
                              value="borrador"
                            />
                            <button
                              type="submit"
                              className="w-full text-xs rounded-lg px-2 py-1.5 border border-neutral-300 text-neutral-600"
                            >
                              Regresar a borrador
                            </button>
                          </form>
                        )}

                        {design.status !== "archivado" &&
                          forward?.status !== "archivado" && (
                            <form action={updateDesignStatus}>
                              <input
                                type="hidden"
                                name="id"
                                value={design.id}
                              />
                              <input
                                type="hidden"
                                name="status"
                                value="archivado"
                              />
                              <button
                                type="submit"
                                className="w-full text-xs rounded-lg px-2 py-1.5 border border-neutral-300 text-neutral-600 hover:border-ricamo-red hover:text-ricamo-red"
                              >
                                Archivar
                              </button>
                            </form>
                          )}

                        {design.status === "archivado" && (
                          <form action={updateDesignStatus}>
                            <input type="hidden" name="id" value={design.id} />
                            <input
                              type="hidden"
                              name="status"
                              value="borrador"
                            />
                            <button
                              type="submit"
                              className="w-full text-xs rounded-lg px-2 py-1.5 border border-neutral-300 text-neutral-600"
                            >
                              Reactivar a borrador
                            </button>
                          </form>
                        )}

                        <form action={setEcommercePublish}>
                          <input type="hidden" name="id" value={design.id} />
                          <input
                            type="hidden"
                            name="publish"
                            value={
                              design.published_to_ecommerce ? "false" : "true"
                            }
                          />
                          <button
                            type="submit"
                            className={`w-full text-xs rounded-lg px-2 py-1.5 border ${
                              design.published_to_ecommerce
                                ? "border-neutral-300 text-neutral-600 hover:border-ricamo-red hover:text-ricamo-red"
                                : "border-ricamo-black text-ricamo-black hover:bg-ricamo-black hover:text-white"
                            }`}
                          >
                            {design.published_to_ecommerce
                              ? "Despublicar"
                              : "Publicar en ecommerce"}
                          </button>
                        </form>

                        <Link
                          href={`/disenos/${design.id}/editar`}
                          className="text-xs text-center text-neutral-500 hover:text-ricamo-black underline underline-offset-2 mt-0.5"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
