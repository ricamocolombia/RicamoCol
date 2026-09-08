"use client";

import { useId, useRef, useState } from "react";

// Cajon de carga del comprobante de pago, mismo patron que
// apps/admin/components/ImageDropzone.tsx (vista previa solo con JS de
// cliente, el envio real es el <input type="file"> normal dentro del
// <form> que lo envuelve -- funciona igual sin JavaScript).
export function PaymentProofDropzone({ name }: { name: string }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  function updatePreview(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
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
            updatePreview(e.dataTransfer.files);
          }
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-ricamo-red bg-ricamo-red/5" : "border-black/15 hover:border-black/30"
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
          className="text-ricamo-black/40"
          aria-hidden="true"
        >
          <path d="M12 16V4M12 4 7 9M12 4l5 5" />
          <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />
        </svg>
        <p className="text-sm font-medium">Arrastra el comprobante aquí o haz clic para elegir</p>
        <p className="text-xs text-ricamo-black/50">PNG o JPG, hasta 8MB</p>
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept="image/*"
          required
          onChange={(e) => updatePreview(e.target.files)}
          className="sr-only"
        />
      </label>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="w-full max-w-[220px] aspect-square object-cover rounded-xl border border-black/10 mt-3"
        />
      )}
    </div>
  );
}
