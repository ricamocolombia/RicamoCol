import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/regalos", label: "Regalos" },
  { href: "/personalizados", label: "Personaliza tu prenda" },
  { href: "/sobre-maria-jose", label: "Maria Jose" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-ricamo-cream/95 backdrop-blur border-b border-black/10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="inline-block shrink-0">
          <Image
            src="/brand/logo-transparente-negro.png"
            alt="Ricamo — lo creas, lo llevas"
            width={220}
            height={220}
            className="h-14 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-ricamo-black hover:text-ricamo-red transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/personalizados"
          className="hidden md:inline-flex items-center bg-ricamo-black text-white text-sm font-semibold rounded-full px-5 py-2.5 hover:bg-ricamo-red transition-colors"
        >
          Cotizar por WhatsApp
        </Link>

        {/* Menu movil sin JavaScript, con <details>/<summary> nativo. */}
        <details className="md:hidden relative">
          <summary
            aria-label="Abrir menú"
            className="list-none cursor-pointer w-10 h-10 flex items-center justify-center rounded-full border border-black/15"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-black/10 bg-white shadow-lg overflow-hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-5 py-3 text-sm font-semibold text-ricamo-black hover:bg-ricamo-cream"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
