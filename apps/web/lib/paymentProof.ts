import { createServiceRoleClient } from "@ricamo/supabase/server";

const BUCKET = "payment-proofs";
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

export class PaymentProofUploadError extends Error {}

// Sube el comprobante de pago al bucket privado payment-proofs y devuelve
// el path guardado (no una URL publica -- el bucket es privado, el admin lo
// ve via signed URL generada en el servidor desde apps/admin/app/ventas).
export async function uploadPaymentProof(file: File, orderId: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new PaymentProofUploadError("El comprobante debe ser una imagen");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new PaymentProofUploadError("La imagen no puede pesar más de 8MB");
  }

  const supabase = createServiceRoleClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${orderId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new PaymentProofUploadError(`No se pudo subir el comprobante: ${error.message}`);
  }

  return path;
}
