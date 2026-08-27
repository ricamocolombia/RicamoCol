import { notFound, redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { crearProductoDesdeDiseno } from "./actions";

// Datos en vivo del negocio: nunca prerenderizar de forma estatica.
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["aprobado", "enviado_maquiladora"];

export default async function PublicarDisenoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = createServiceRoleClient();

  const { data: design, error: designError } = await supabase
    .from("designs")
    .select("id, name, technique, status")
    .eq("id", id)
    .single();

  if (designError || !design) {
    notFound();
  }

  if (!ALLOWED_STATUSES.includes(design.status)) {
    redirect(
      `/disenos?error=${encodeURIComponent(
        "Este diseño todavía no está aprobado — no se puede publicar como producto"
      )}`
    );
  }

  const { data: existingProduct } = await supabase
    .from("products")
    .select("id")
    .eq("design_id", id)
    .maybeSingle();

  if (existingProduct) {
    redirect(
      `/disenos?error=${encodeURIComponent("Este diseño ya tiene un producto de catálogo")}`
    );
  }

  return (
    <main className="px-6 py-10">
      <h1 className="text-2xl font-bold mb-2">Crear producto de catálogo</h1>
      <p className="text-neutral-600 mb-6">
        A partir del diseño <span className="font-medium">{design.name}</span>{" "}
        (aprobado por el administrador). Esto lo publica de inmediato en el
        catálogo del ecommerce.
      </p>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <form
        action={crearProductoDesdeDiseno}
        className="rounded-xl border border-neutral-200 bg-white p-6 max-w-xl space-y-4"
      >
        <input type="hidden" name="design_id" value={design.id} />

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nombre del producto *
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="garment_type" className="block text-sm font-medium mb-1">
              Tipo de prenda *
            </label>
            <select
              id="garment_type"
              name="garment_type"
              required
              defaultValue="camiseta"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
            >
              <option value="camiseta">Camiseta</option>
              <option value="buzo">Buzo</option>
            </select>
          </div>
          <div>
            <label htmlFor="base_price_cop" className="block text-sm font-medium mb-1">
              Precio (COP) *
            </label>
            <input
              id="base_price_cop"
              name="base_price_cop"
              type="number"
              min="1"
              step="1"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
        </div>

        <p className="text-sm text-neutral-500">
          Técnica: <span className="font-medium">{design.technique}</span> (heredada del diseño)
        </p>

        <div className="border-t border-neutral-200 pt-4">
          <p className="text-sm font-medium mb-3">Primera talla disponible</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="size" className="block text-sm font-medium mb-1">
                Talla *
              </label>
              <input
                id="size"
                name="size"
                type="text"
                required
                placeholder="M"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="stock_quantity" className="block text-sm font-medium mb-1">
                Stock inicial
              </label>
              <input
                id="stock_quantity"
                name="stock_quantity"
                type="number"
                min="0"
                step="1"
                defaultValue={0}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Se pueden agregar más tallas/colores más adelante directamente en
            Supabase — este formulario cubre la primera variante para dejar el
            producto publicable de una vez.
          </p>
        </div>

        <button
          type="submit"
          className="bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg px-4 py-2"
        >
          Crear producto y publicar
        </button>
      </form>
    </main>
  );
}
