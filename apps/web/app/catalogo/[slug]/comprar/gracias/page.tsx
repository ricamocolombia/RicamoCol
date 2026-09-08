import Link from "next/link";

export default async function GraciasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="max-w-xl mx-auto px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-ricamo-yellow/20 flex items-center justify-center mx-auto mb-6">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ricamo-black"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1 className="font-display text-3xl sm:text-4xl mb-3">¡Recibimos tu comprobante!</h1>
      <p className="text-ricamo-black/70 leading-relaxed mb-8">
        Maria Jose lo está revisando y te confirma en un plazo máximo de 4
        horas hábiles — apenas se apruebe, empezamos a producir tu pedido.
        Te avisamos por correo en cada paso.
      </p>
      <Link
        href={`/catalogo/${slug}`}
        className="inline-flex items-center justify-center bg-ricamo-black text-white font-semibold rounded-full px-8 py-4 hover:bg-ricamo-red transition-colors"
      >
        Volver al producto
      </Link>
    </main>
  );
}
