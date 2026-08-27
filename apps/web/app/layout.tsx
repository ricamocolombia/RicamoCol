import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ricamo | Bordados y estampados personalizados",
  description:
    "Bordados y estampados personalizados por Maria Jose Ruiz. Camisetas y buzos con tu diseno, hechos a tu medida.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-ricamo-black antialiased">
        <header className="px-6 py-4 border-b border-black/10">
          <Link href="/" className="inline-block">
            <Image
              src="/brand/logo-transparente-negro.png"
              alt="Ricamo — lo creas, lo llevas"
              width={160}
              height={160}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
