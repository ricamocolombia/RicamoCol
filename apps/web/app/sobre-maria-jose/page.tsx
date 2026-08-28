import Link from "next/link";
import { MariaJoseSpotlight } from "../../components/MariaJoseSpotlight";

export default function SobreMariaJosePage() {
  return (
    <main>
      <div className="pt-12">
        <MariaJoseSpotlight />
      </div>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="font-display text-3xl mb-6">Su historia</h2>
        <div className="space-y-4 text-ricamo-black/70 leading-relaxed">
          <p>
            Ricamo empezó como los proyectos que de verdad importan: sin
            fábrica, sin bodega, solo con una idea clara. Maria Jose diseñaba
            y publicaba en redes, los pedidos llegaban por WhatsApp, y cada
            prenda se mandaba a hacer una por una con talleres de bordado y
            estampado en Medellín.
          </p>
          <p>
            Ese es todavía el corazón del negocio: nada sale de una línea de
            producción masiva. Cada camiseta o buzo pasa por sus manos —
            ella dibuja el diseño, te lo muestra antes de producirlo, y solo
            cuando lo apruebas se manda a hacer.
          </p>
          <p>
            Por eso Ricamo no es solo una tienda de ropa: es su marca
            personal. Lo que ves en {" "}
            <a
              href="https://www.instagram.com/ricamo_col/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ricamo-red font-semibold underline underline-offset-4"
            >
              @ricamo_col
            </a>{" "}
            es exactamente lo que recibes.
          </p>
        </div>
      </section>

      <section className="bg-white border-y border-black/10">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="font-display text-3xl mb-4">¿Lista para tu prenda?</h2>
          <p className="text-ricamo-black/60 mb-8 max-w-md mx-auto">
            Cuéntale a Maria Jose qué tienes en mente y empieza a diseñar
            contigo.
          </p>
          <Link
            href="/personalizados"
            className="inline-flex items-center bg-ricamo-red text-white font-semibold rounded-full px-8 py-4 hover:bg-ricamo-black transition-colors"
          >
            Personaliza tu prenda
          </Link>
        </div>
      </section>
    </main>
  );
}
