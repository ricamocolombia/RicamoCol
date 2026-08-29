import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
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
      <body className="bg-neutral-50 text-ricamo-black antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
