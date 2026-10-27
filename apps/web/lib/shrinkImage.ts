// Reduce en el navegador las imagenes que pesan demasiado para subirlas por
// Server Action (tope de 4MB por request en next.config.mjs, ~4.5MB en
// Vercel). Las que ya son livianas se devuelven tal cual. Si el navegador no
// puede decodificarla (ej. HEIC en escritorio), tambien se devuelve tal cual
// y el servidor decide.
const TARGET_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 2000;

export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= TARGET_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    if (!blob || blob.size >= file.size) return file;
    const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// Reemplaza los archivos de un <input type="file"> por sus versiones
// reducidas, para que el <form> normal envie las livianas.
export async function shrinkInputFiles(input: HTMLInputElement, files: FileList): Promise<FileList> {
  const shrunk = await Promise.all([...files].map(shrinkImage));
  const transfer = new DataTransfer();
  shrunk.forEach((f) => transfer.items.add(f));
  input.files = transfer.files;
  return transfer.files;
}
