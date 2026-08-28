import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-ricamo-black text-white mt-24">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div>
          <p className="font-display text-2xl mb-2">Ricamo</p>
          <p className="text-sm text-white/60 max-w-xs">
            Bordados y estampados personalizados, diseñados por Maria Jose
            Ruiz. Hechos en Medellín, enviamos a toda Colombia.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50 mb-3">
            Explora
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/catalogo" className="text-white/80 hover:text-ricamo-yellow">
                Catálogo
              </Link>
            </li>
            <li>
              <Link href="/personalizados" className="text-white/80 hover:text-ricamo-yellow">
                Personaliza tu prenda
              </Link>
            </li>
            <li>
              <Link href="/sobre-maria-jose" className="text-white/80 hover:text-ricamo-yellow">
                Sobre Maria Jose
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50 mb-3">
            Síguenos
          </p>
          <a
            href="https://www.instagram.com/ricamo_col/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-ricamo-yellow"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
            @ricamo_col
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="max-w-6xl mx-auto px-6 py-5 text-xs text-white/40">
          © {new Date().getFullYear()} Ricamo. Lo creas, lo llevas.
        </p>
      </div>
    </footer>
  );
}
