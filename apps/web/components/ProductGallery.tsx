"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Media = { type: "image"; url: string } | { type: "video"; url: string };

const ZOOM = 2.5;

// Galeria del detalle de producto, estilo tienda: foto grande + miniaturas
// abajo (la seleccionada ocupa el espacio grande), flechas para pasar de
// una a otra (tambien teclado ← → y deslizar con el dedo en celular), y una
// lupa: en computador amplia la zona bajo el cursor al pasar el mouse; con
// el boton de lupa (o tocando la foto) se fija el zoom y en celular se
// recorre la foto arrastrando el dedo. El video del diseño va como segundo
// elemento de la galeria.
export function ProductGallery({
  images,
  videoUrl,
  alt,
}: {
  images: string[];
  videoUrl: string | null;
  alt: string;
}) {
  const media: Media[] = images.map((url) => ({ type: "image" as const, url }));
  if (videoUrl) media.splice(Math.min(1, media.length), 0, { type: "video", url: videoUrl });

  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [lensLocked, setLensLocked] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [canHover, setCanHover] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  const current = media[index];
  const isImage = current?.type === "image";
  const zoomed = isImage && (lensLocked || (canHover && hovering));

  const go = useCallback(
    (delta: number) => {
      if (media.length < 2) return;
      setLensLocked(false);
      setPos({ x: 50, y: 50 });
      setIndex((i) => (i + delta + media.length) % media.length);
    },
    [media.length]
  );

  function select(i: number) {
    setLensLocked(false);
    setPos({ x: 50, y: 50 });
    setIndex(i);
  }

  function updatePos(clientX: number, clientY: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    setPos({ x, y });
  }

  if (media.length === 0) {
    return (
      <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-ricamo-bone flex items-center justify-center">
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-ricamo-black/15"
          aria-hidden="true"
        >
          <path d="M8 3 6 6H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2l-2-3H8Z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={stageRef}
        tabIndex={0}
        role="region"
        aria-roledescription="galería"
        aria-label={`${alt} — ${index + 1} de ${media.length}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          else if (e.key === "ArrowLeft") go(-1);
          else if (e.key === "Escape") setLensLocked(false);
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={(e) => isImage && updatePos(e.clientX, e.clientY)}
        onClick={(e) => {
          if (!isImage) return;
          updatePos(e.clientX, e.clientY);
          setLensLocked((v) => !v);
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          if (lensLocked) updatePos(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (lensLocked) updatePos(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (lensLocked || start === null) return;
          const dx = e.changedTouches[0].clientX - start;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
        className={`relative aspect-[4/5] rounded-3xl overflow-hidden bg-ricamo-bone select-none outline-none focus-visible:ring-2 focus-visible:ring-ricamo-black ${
          isImage ? (zoomed ? "cursor-zoom-out" : "cursor-zoom-in") : ""
        } ${lensLocked ? "touch-none" : ""}`}
      >
        {current.type === "image" ? (
          <>
            <Image
              key={current.url}
              src={current.url}
              alt={`${alt} — foto ${index + 1}`}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority={index === 0}
              className="object-cover"
            />
            {zoomed && (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-no-repeat bg-ricamo-bone"
                style={{
                  backgroundImage: `url("${current.url}")`,
                  backgroundSize: `${ZOOM * 100}%`,
                  backgroundPosition: `${pos.x}% ${pos.y}%`,
                }}
              />
            )}
          </>
        ) : (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            muted
            loop
            autoPlay
            className="absolute inset-0 w-full h-full object-cover bg-black"
          />
        )}

        {isImage && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLensLocked((v) => !v);
            }}
            aria-pressed={lensLocked}
            aria-label={lensLocked ? "Quitar lupa" : "Ampliar con lupa"}
            title={lensLocked ? "Quitar lupa" : "Ampliar con lupa"}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors ${
              lensLocked ? "bg-ricamo-black text-white" : "bg-white/90 text-ricamo-black hover:bg-white"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
              {lensLocked ? <path d="M8 11h6" /> : <path d="M11 8v6M8 11h6" />}
            </svg>
          </button>
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-ricamo-black flex items-center justify-center shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-ricamo-black flex items-center justify-center shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/60 text-white text-xs font-semibold px-2.5 py-1">
              {index + 1} / {media.length}
            </span>
          </>
        )}

        {isImage && !zoomed && (
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/90 text-ricamo-black text-xs font-medium px-2.5 py-1">
            {canHover ? "Pasa el cursor para ampliar" : "Toca la lupa para ampliar"}
          </span>
        )}
      </div>

      {media.length > 1 && (
        <div className="grid grid-cols-6 gap-2 mt-3">
          {media.map((item, i) => (
            <button
              key={`${item.type}-${item.url}`}
              type="button"
              onClick={() => select(i)}
              aria-label={item.type === "video" ? "Ver video" : `Ver foto ${i + 1}`}
              aria-current={i === index}
              className={`relative aspect-square rounded-xl overflow-hidden bg-ricamo-bone transition-all ${
                i === index ? "ring-2 ring-ricamo-black ring-offset-2 ring-offset-ricamo-cream" : "opacity-70 hover:opacity-100"
              }`}
            >
              {item.type === "image" ? (
                <Image src={item.url} alt="" fill sizes="96px" className="object-cover" />
              ) : (
                <>
                  <video src={item.url} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
