import { createServiceRoleClient } from "@ricamo/supabase/server";

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
