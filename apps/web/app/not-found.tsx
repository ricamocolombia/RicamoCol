import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Página no encontrada | Ricamo",
};

export default function NotFound() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20 md:py-28 text-center">
      <div className="mx-auto mb-10 w-40 h-40 sm:w-48 sm:h-48 rounded-[2.5rem] bg-ricamo-yellow flex items-center justify-center p-8">
        <Image
          src="/brand/logo-transparente-negro.png"
          alt="Ricamo"
          width={280}
          height={280}
          className="w-full h-full object-contain"
        />
      </div>

      <p className="uppercase tracking-widest text-ricamo-red text-sm font-bold mb-4">
        Error 404
      </p>
      <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] mb-5">
        Esta página todavía no la{" "}
        <span className="marker-underline text-ricamo-red">creamos</span>
      </h1>
      <p className="text-ricamo-black/70 text-base sm:text-lg max-w-md mx-auto mb-10">
        El link que seguiste no existe o se movió. Prueba desde el inicio, o
        cuéntanos qué tienes en mente y te lo diseñamos.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center bg-ricamo-black text-white font-semibold rounded-full px-7 py-3.5 hover:bg-ricamo-red transition-colors"
        >
          Volver al inicio
        </Link>
        <Link
          href="/catalogo"
          className="inline-flex items-center border border-black/15 text-ricamo-black font-semibold rounded-full px-7 py-3.5 hover:border-ricamo-black transition-colors"
        >
          Ver catálogo
        </Link>
      </div>
    </main>
  );
}
