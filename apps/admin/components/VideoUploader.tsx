"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createClient } from "@ricamo/supabase";
import { prepararSubidaVideo } from "../app/disenos/videoActions";
import { MAX_VIDEO_BYTES, MAX_VIDEO_MB, MEDIA_BUCKET } from "../lib/designMedia";

type Status =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "done"; path: string; previewUrl: string }
  | { kind: "error"; message: string };

// Video opcional de un diseño. A diferencia de las fotos, el archivo NO
// viaja dentro del <form> (pesa mas que el tope de la Server Action): se
// sube apenas se elige, directo a Supabase Storage con una URL firmada
// (prepararSubidaVideo), y el formulario solo manda el path en un input
// oculto (`name`). Mientras sube, se bloquea el envio del formulario.
export function VideoUploader({ name, label = "Video (opcional)" }: { name: string; label?: string }) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    const form = fileRef.current?.form;
    if (!form || status.kind !== "uploading") return;
    const block = (e: Event) => {
      e.preventDefault();
      alert("Espera a que termine de subir el video.");
    };
    form.addEventListener("submit", block);
    return () => form.removeEventListener("submit", block);
  }, [status.kind]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setStatus({ kind: "error", message: "El archivo debe ser un video" });
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setStatus({ kind: "error", message: `El video no puede pesar más de ${MAX_VIDEO_MB}MB` });
      return;
    }

    setStatus({ kind: "uploading" });
    const prepared = await prepararSubidaVideo(file.type, file.size);
    if ("error" in prepared) {
      setStatus({ kind: "error", message: prepared.error });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: file.type });

    if (error) {
      setStatus({ kind: "error", message: "No se pudo subir el video: " + error.message });
      return;
    }
    setStatus({ kind: "done", path: prepared.path, previewUrl: URL.createObjectURL(file) });
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
        disabled={status.kind === "uploading"}
        onChange={(e) => void handleFile(e.target.files?.[0])}
        className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-neutral-200"
      />
      <p className="text-xs text-neutral-400 mt-1">MP4, MOV o WEBM, hasta {MAX_VIDEO_MB}MB.</p>

      {status.kind === "uploading" && (
        <p className="text-xs text-neutral-600 mt-2">Subiendo video… no cierres la página.</p>
      )}
      {status.kind === "error" && <p className="text-xs text-ricamo-red mt-2">{status.message}</p>}
      {status.kind === "done" && (
        <>
          <input type="hidden" name={name} value={status.path} />
          <p className="text-xs text-green-700 mt-2">Video listo ✓</p>
          <video
            src={status.previewUrl}
            controls
            playsInline
            className="mt-2 w-full max-w-[260px] rounded-lg border border-neutral-200"
          />
        </>
      )}
    </div>
  );
}
