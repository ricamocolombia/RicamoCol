import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import {
  actualizarDiseno,
  agregarImagenesDiseno,
  eliminarImagenDiseno,
  marcarPortadaDiseno,
  guardarVideoDiseno,
  quitarVideoDiseno,
} from "./actions";
import { ImageDropzone } from "../../../../components/ImageDropzone";
import { VideoUploader } from "../../../../components/VideoUploader";
import { MAX_DESIGN_IMAGES } from "../../../../lib/designMedia";

type DesignTechnique = "bordado" | "estampado";

interface DesignRow {
  id: string;
  name: string;
  technique: DesignTechnique;
  image_url: string | null;
  video_url: string | null;
}


interface DesignImageRow {
  id: string;
  image_url: string;
  is_cover: boolean;
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

  const [{ data: designData }, { data: productsData }, { data: imagesData }] = await Promise.all([
    supabase
      .from("designs")
      .select("id, name, technique, image_url")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("products")
      .select("description")
      .eq("design_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("design_images")
      .select("id, image_url, is_cover")
      .eq("design_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  const design = designData as unknown as DesignRow | null;
  const products = (productsData ?? []) as unknown as { description: string | null }[];
  const hasProducts = products.length > 0;
  const currentDescription = products.find((p) => p.description)?.description ?? "";
  const images = (imagesData ?? []) as unknown as DesignImageRow[];

  if (!design) {
    notFound();
  }

  // Aparte y tolerante a error: si la columna video_url (0016) no existe
  // todavia, la pagina de edicion sigue funcionando sin la seccion de video.
  const { data: videoData, error: videoError } = await supabase
    .from("designs")
    .select("video_url")
    .eq("id", id)
    .maybeSingle();
  design.video_url = videoError ? null : (videoData?.video_url ?? null);

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
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 disabled:bg-neutral-50 disabled:text-neutral-500"
              disabled={hasProducts}
            >
              <option value="bordado">Bordado</option>
              <option value="estampado">Estampado</option>
            </select>
            {hasProducts && (
              <>
                {/* Un select deshabilitado no se envia: se manda la tecnica actual. */}
                <input type="hidden" name="technique" value={design.technique} />
                <p className="text-xs text-neutral-500 mt-1">
                  No se puede cambiar: el diseño ya tiene prendas con precio de {design.technique}.
                </p>
              </>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={currentDescription}
              placeholder="Lo que verán los clientes en la página del producto"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
            {hasProducts && (
              <p className="text-xs text-neutral-500 mt-1">Se aplica a todas las prendas de este diseño.</p>
            )}
          </div>

          {hasProducts && (
            <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
              <input type="checkbox" name="rename_products" defaultChecked className="rounded border-neutral-300" />
              Usar este nombre también en la página
            </label>
          )}
        </section>

        <button
          type="submit"
          className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg py-3"
        >
          Guardar cambios
        </button>
      </form>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 mt-6">
        <h2 className="text-sm font-semibold mb-4">
          Fotos ({images.length} de {MAX_DESIGN_IMAGES})
        </h2>

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {images.map((img) => (
              <div key={img.id} className="relative">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
                  <Image src={img.image_url} alt="" fill sizes="200px" className="object-cover" />
                  {img.is_cover && (
                    <span className="absolute top-1.5 left-1.5 bg-ricamo-yellow text-ricamo-black text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5">
                      Portada
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {!img.is_cover && (
                    <form action={marcarPortadaDiseno}>
                      <input type="hidden" name="design_id" value={design.id} />
                      <input type="hidden" name="image_id" value={img.id} />
                      <button
                        type="submit"
                        className="text-[11px] text-neutral-500 hover:text-ricamo-black underline underline-offset-2"
                      >
                        Marcar portada
                      </button>
                    </form>
                  )}
                  <form action={eliminarImagenDiseno}>
                    <input type="hidden" name="design_id" value={design.id} />
                    <input type="hidden" name="image_id" value={img.id} />
                    <button
                      type="submit"
                      className="text-[11px] text-neutral-400 hover:text-ricamo-red underline underline-offset-2 ml-auto"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length < MAX_DESIGN_IMAGES ? (
          <form action={agregarImagenesDiseno}>
            <input type="hidden" name="id" value={design.id} />
            <ImageDropzone
              name="images"
              multiple
              maxFiles={MAX_DESIGN_IMAGES - images.length}
              label="Agregar más fotos"
            />
            <button
              type="submit"
              className="mt-3 bg-ricamo-black text-white text-sm font-semibold rounded-lg px-4 py-2"
            >
              Subir fotos
            </button>
          </form>
        ) : (
          <p className="text-xs text-neutral-500">
            Ya tiene el máximo de {MAX_DESIGN_IMAGES} fotos — elimina alguna para subir otra.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 mt-6">
        <h2 className="text-sm font-semibold mb-4">Video</h2>
        {design.video_url && (
          <div className="mb-4">
            <video
              src={design.video_url}
              controls
              playsInline
              className="w-full max-w-[320px] rounded-lg border border-neutral-200"
            />
            <form action={quitarVideoDiseno} className="mt-2">
              <input type="hidden" name="id" value={design.id} />
              <button
                type="submit"
                className="text-xs text-neutral-400 hover:text-ricamo-red underline underline-offset-2"
              >
                Quitar video
              </button>
            </form>
          </div>
        )}
        <form action={guardarVideoDiseno} className="space-y-3">
          <input type="hidden" name="id" value={design.id} />
          <VideoUploader name="video_path" label={design.video_url ? "Reemplazar video" : "Subir video"} />
          <button
            type="submit"
            className="bg-ricamo-black text-white text-sm font-semibold rounded-lg px-4 py-2"
          >
            Guardar video
          </button>
        </form>
      </section>
    </main>
  );
}
