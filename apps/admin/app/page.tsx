import Link from "next/link";
import { signOut } from "./login/actions";

const sections = [
  { href: "/ventas", label: "Ventas" },
  { href: "/compras", label: "Compras" },
  { href: "/inventario", label: "Inventario" },
  { href: "/cuentas-por-cobrar", label: "Cuentas por cobrar" },
  { href: "/cuentas-por-pagar", label: "Cuentas por pagar" },
  { href: "/bancos", label: "Bancos" },
  { href: "/proveedores", label: "Proveedores" },
  { href: "/domiciliarios", label: "Domiciliarios" },
  { href: "/disenos", label: "Disenos" },
];

export default function DashboardPage() {
  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Panel Ricamo</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-neutral-500 hover:text-ricamo-red"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-neutral-200 bg-white p-6 font-medium hover:border-ricamo-yellow"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
