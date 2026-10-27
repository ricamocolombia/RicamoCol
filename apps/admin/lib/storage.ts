import { createServiceRoleClient } from "@ricamo/supabase/server";
import { VIDEO_PATH_RE } from "./designMedia";

const BUCKET = "design-images";
const MAX_SIZE_BYTES = 4 * 1024 * 1024;

export class ImageUploadError extends Error {}

// Sube una imagen al bucket design-images (publico) y devuelve la URL
// publica. `folder` separa las imagenes de disenos, portadas de colecciones
// y el QR de pago dentro del mismo bucket (no hace falta un bucket aparte
// -- el QR no es sensible, a diferencia del comprobante de pago que sí vive
// en un bucket privado aparte, ver apps/web/lib/paymentProof.ts).
export async function uploadDesignImage(
  file: File,
  folder: "disenos" | "colecciones" | "pagos"
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new ImageUploadError("El archivo debe ser una imagen");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new ImageUploadError("La imagen no puede pesar más de 4MB");
  }

  const supabase = createServiceRoleClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new ImageUploadError(`No se pudo subir la imagen: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// URL publica de un video ya subido (ver app/disenos/videoActions.ts), o
// null si el path no tiene la forma esperada.
export function publicVideoUrl(path: string): string | null {
  if (!VIDEO_PATH_RE.test(path)) return null;
  const supabase = createServiceRoleClient();
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Borra del bucket un archivo a partir de su URL publica (fotos o video
// reemplazados/eliminados), para no dejar archivos huerfanos.
export async function removePublicFile(publicUrl: string | null | undefined): Promise<void> {
  const path = publicUrl?.split(`/${BUCKET}/`)[1];
  if (!path) return;
  const supabase = createServiceRoleClient();
  await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)]);
}
