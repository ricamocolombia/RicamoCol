import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Ricamo | Bordados y estampados personalizados",
  description:
    "Bordados y estampados personalizados por Maria Jose Ruiz. Camisetas y buzos con tu diseño, hechos a tu medida. Envíos a toda Colombia desde Medellín.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-screen bg-ricamo-cream text-ricamo-black antialiased flex flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
