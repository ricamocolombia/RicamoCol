import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ricamo Admin",
  description: "Gestion integral del negocio Ricamo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-neutral-50 text-ricamo-black antialiased">
        <header className="flex items-center gap-3 px-6 py-4 bg-white border-b border-neutral-200">
          <Link href="/" className="inline-block">
            <Image
              src="/brand/logo-transparente-negro.png"
              alt="Ricamo"
              width={160}
              height={160}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <span className="text-sm font-medium text-neutral-500">Admin</span>
        </header>
        {children}
      </body>
    </html>
  );
}
