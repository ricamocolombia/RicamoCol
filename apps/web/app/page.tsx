import Link from "next/link";

// Home del ecommerce: le da protagonismo a Maria Jose Ruiz como marca
// personal (su imagen es lo que mas vende) y dirige al cliente hacia el
// catalogo (pago en linea) o hacia el cotizador de personalizados (WhatsApp).
export default function HomePage() {
  return (
    <main>
      <section className="bg-ricamo-black text-white px-6 py-24 text-center">
        <p className="uppercase tracking-widest text-ricamo-yellow text-sm mb-4">
          Ricamo — Lo creas, lo llevas
        </p>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Bordados y estampados que cuentan tu historia
        </h1>
        <p className="max-w-xl mx-auto text-lg text-white/80 mb-8">
          Disenados por Maria Jose Ruiz. Cada pieza es unica, hecha a tu
          medida.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/personalizados"
            className="bg-ricamo-red px-6 py-3 rounded-full font-semibold"
          >
            Quiero un diseno personalizado
          </Link>
          <Link
            href="/catalogo"
            className="bg-ricamo-yellow text-ricamo-black px-6 py-3 rounded-full font-semibold"
          >
            Ver catalogo
          </Link>
        </div>
      </section>

      <section className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Maria Jose Ruiz</h2>
        <p className="max-w-2xl mx-auto text-black/70">
          TODO: seccion de marca personal (bio, redes sociales, historia de
          Ricamo, fotos). Ver la pagina /sobre-maria-jose y CLAUDE.md.
        </p>
      </section>
    </main>
  );
}
