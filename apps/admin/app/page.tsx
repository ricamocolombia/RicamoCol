import Link from "next/link";

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
      <h1 className="text-2xl font-bold mb-6">Panel Ricamo</h1>
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
