import Link from "next/link";

// TODO: reemplazar el bloque de la izquierda por una foto real de Maria
// Jose en cuanto el negocio la entregue (ver vault/Ricamo/02 Pendientes/Backlog.md).
// Mientras tanto, un placeholder de marca en vez de una imagen rota o vacía.
export function MariaJoseSpotlight({ compact = false }: { compact?: boolean }) {
  return (
    <section className="max-w-6xl mx-auto px-6">
      <div className="rounded-3xl bg-ricamo-black text-white overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto bg-ricamo-yellow flex items-center justify-center p-10">
          <div className="text-center">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0A0A0A"
              strokeWidth="1.5"
              className="mx-auto mb-3"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
            <p className="font-display text-ricamo-black text-sm">
              Foto de Maria Jose
              <br />
              próximamente
            </p>
          </div>
        </div>

        <div className="p-8 md:p-12 flex flex-col justify-center">
          <p className="uppercase tracking-widest text-ricamo-yellow text-xs font-semibold mb-3">
            La persona detrás de Ricamo
          </p>
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            Maria Jose Ruiz
          </h2>
          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-6 max-w-md">
            Cada diseño de Ricamo pasa por sus manos: ella los dibuja, los
            aprueba contigo, y los manda a bordar o estampar. No es una
            tienda genérica — es su marca personal, hecha pieza por pieza.
          </p>

          {!compact && (
            <div className="flex items-center gap-6 mb-6">
              <div>
                <p className="font-display text-2xl">27.9k</p>
                <p className="text-xs text-white/50">seguidores</p>
              </div>
              <div className="h-8 w-px bg-white/15" />
              <div>
                <p className="font-display text-2xl">Medellín</p>
                <p className="text-xs text-white/50">envíos a toda Colombia</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.instagram.com/ricamo_col/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-ricamo-yellow text-ricamo-black text-sm font-semibold rounded-full px-5 py-2.5 hover:bg-white transition-colors"
            >
              Síguela en Instagram
            </a>
            {compact && (
              <Link
                href="/sobre-maria-jose"
                className="inline-flex items-center text-sm font-semibold text-white/80 hover:text-white underline underline-offset-4"
              >
                Conoce su historia
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
