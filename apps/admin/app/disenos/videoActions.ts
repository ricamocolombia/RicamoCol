"use server";

import { createServiceRoleClient } from "@ricamo/supabase/server";
import { MAX_VIDEO_BYTES, MAX_VIDEO_MB, MEDIA_BUCKET } from "../../lib/designMedia";

const EXT_BY_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-m4v": "m4v",
};

// Un video pesa mucho mas que el tope de ~4.5MB por request de Vercel, asi
// que no puede viajar dentro de una Server Action como las fotos. Esta
// accion solo valida tipo/tamaño y devuelve una URL firmada de subida
// (service_role, un solo uso): el navegador sube el archivo directo a
// Supabase Storage y despues el formulario manda solo el path.
export async function prepararSubidaVideo(
  contentType: string,
  size: number
): Promise<{ path: string; token: string } | { error: string }> {
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) {
    return { error: "El video debe ser MP4, MOV o WEBM" };
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_VIDEO_BYTES) {
    return { error: `El video no puede pesar más de ${MAX_VIDEO_MB}MB` };
  }

  const supabase = createServiceRoleClient();
  const path = `videos/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    return { error: "No se pudo preparar la subida: " + (error?.message ?? "error desconocido") };
  }
  return { path, token: data.token };
}
