import {
  IconArchive,
  IconArrowDownCircle,
  IconArrowUpCircle,
  IconBank,
  IconBuilding,
  IconCart,
  IconMegaphone,
  IconPalette,
  IconSettings,
  IconShoppingBag,
  IconSupplier,
  IconTruck,
  IconUsers,
} from "./icons";
import type { ComponentType, SVGProps } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// Agrupado por como la dueña del negocio piensa el flujo de trabajo, no por
// orden alfabetico: primero lo que genera venta, luego lo operativo, luego
// lo financiero.
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Ventas y clientes",
    items: [
      { href: "/ventas", label: "Ventas", icon: IconCart },
      { href: "/clientes", label: "Clientes", icon: IconUsers },
      { href: "/campanas", label: "Campañas", icon: IconMegaphone },
      { href: "/disenos", label: "Diseños", icon: IconPalette },
    ],
  },
  {
    title: "Operación",
    items: [
      { href: "/compras", label: "Compras", icon: IconShoppingBag },
      { href: "/inventario", label: "Inventario", icon: IconArchive },
      { href: "/bodegas", label: "Bodegas", icon: IconBuilding },
      { href: "/proveedores", label: "Proveedores", icon: IconSupplier },
      { href: "/domiciliarios", label: "Domiciliarios", icon: IconTruck },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { href: "/bancos", label: "Bancos", icon: IconBank },
      { href: "/cuentas-por-cobrar", label: "Cuentas por cobrar", icon: IconArrowDownCircle },
      { href: "/cuentas-por-pagar", label: "Cuentas por pagar", icon: IconArrowUpCircle },
    ],
  },
  {
    title: "Sistema",
    items: [{ href: "/configuracion", label: "Configuración", icon: IconSettings }],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
