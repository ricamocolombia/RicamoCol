"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "../app/login/actions";
import { IconClose, IconDashboard, IconLogout, IconMenu } from "./icons";
import { NAV_GROUPS } from "./navItems";

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Cierra el menu movil al navegar a otra ruta.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // El login tiene su propia pantalla completa, sin el chrome del panel.
  if (pathname?.startsWith("/login")) {
    return <>{children}</>;
  }

  const navContent = (
    <>
      <Link
        href="/"
        className="flex items-center gap-3 px-5 pt-5 pb-4 shrink-0"
      >
        <Image
          src="/brand/logo-transparente-negro.png"
          alt="Ricamo"
          width={160}
          height={160}
          className="h-8 w-auto"
          priority
        />
        <span className="text-xs font-semibold text-neutral-400 tracking-wide uppercase">
          Admin
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <Link
          href="/"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 mb-4 text-sm font-semibold transition-colors ${
            pathname === "/"
              ? "bg-ricamo-black text-white"
              : "text-ricamo-black hover:bg-neutral-100"
          }`}
        >
          <IconDashboard className="w-5 h-5 shrink-0" />
          Panel de control
        </Link>

        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname ?? "", item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-ricamo-yellow/25 text-ricamo-black font-semibold"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-ricamo-black"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 shrink-0 ${active ? "text-ricamo-red" : "text-neutral-400"}`}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <form action={signOut} className="px-3 pb-5 pt-2 border-t border-neutral-100 shrink-0">
        <button
          type="submit"
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-ricamo-red transition-colors cursor-pointer"
        >
          <IconLogout className="w-5 h-5 shrink-0" />
          Cerrar sesión
        </button>
      </form>
    </>
  );

  return (
    <div className="lg:flex min-h-dvh bg-neutral-50">
      {/* Barra superior movil: logo + boton de menu, siempre visible. */}
      <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logo-transparente-negro.png"
            alt="Ricamo"
            width={140}
            height={140}
            className="h-7 w-auto"
            priority
          />
          <span className="text-xs font-semibold text-neutral-400 uppercase">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="w-10 h-10 flex items-center justify-center rounded-full border border-neutral-200 cursor-pointer"
        >
          <IconMenu className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay del menu movil */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: fija/en flujo en desktop, drawer deslizable en movil. */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-dvh lg:h-screen w-72 bg-white border-r border-neutral-200 flex flex-col z-40 transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
          className="lg:hidden absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full border border-neutral-200 cursor-pointer"
        >
          <IconClose className="w-4 h-4" />
        </button>
        {navContent}
      </aside>

      {/* Las paginas ya traen su propio <main>; este div es solo el area de
          contenido junto al sidebar, no un landmark adicional. */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
