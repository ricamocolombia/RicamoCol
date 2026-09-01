"use client";

import { useId, useRef, useState } from "react";

// Cajon de carga de imagenes con vista previa local (solo JS de cliente para
// la previsualizacion y el estado de "arrastrando"). El envio real sigue
// siendo el <input type="file"> normal dentro del <form> que lo envuelve --
// funciona igual sin JavaScript, esto solo mejora la experiencia.
export function ImageDropzone({
  name,
  multiple = false,
  label = "Arrastra imágenes aquí o haz clic para elegir",
}: {
  name: string;
  multiple?: boolean;
  label?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  function updatePreviews(files: FileList | null) {
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }
    const urls = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (inputRef.current && e.dataTransfer.files.length > 0) {
            inputRef.current.files = e.dataTransfer.files;
            updatePreviews(e.dataTransfer.files);
          }
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-ricamo-yellow bg-ricamo-yellow/10" : "border-neutral-300 hover:border-neutral-400"
        }`}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-400"
          aria-hidden="true"
        >
          <path d="M12 16V4M12 4 7 9M12 4l5 5" />
          <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />
        </svg>
        <p className="text-sm font-medium text-neutral-600">{label}</p>
        <p className="text-xs text-neutral-400">PNG o JPG, hasta 8MB{multiple ? " cada una" : ""}</p>
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => updatePreviews(e.target.files)}
          className="sr-only"
        />
      </label>

      {previews.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
          {previews.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className="w-full aspect-square object-cover rounded-lg border border-neutral-200"
            />
          ))}
        </div>
      )}
    </div>
  );
}
