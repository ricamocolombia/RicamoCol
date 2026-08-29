// Set de iconos SVG a mano, trazo consistente (stroke, viewBox 24x24), sin
// depender de una libreria externa. Mismo criterio en todo el panel: nunca
// emojis como icono de UI.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps, children: React.ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconDashboard(props: IconProps) {
  return base(
    props,
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  );
}

export function IconCart(props: IconProps) {
  return base(
    props,
    <>
      <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L20 8H6" />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </>
  );
}

export function IconUsers(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M15.5 5.2a3.2 3.2 0 0 1 0 6.1" />
      <path d="M17.5 14.7c2.5.5 4 2.4 4 5.3" />
    </>
  );
}

export function IconMegaphone(props: IconProps) {
  return base(
    props,
    <>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l1.5 5H10l-1-5" />
      <path d="M6 10 18 4v16L6 14" />
      <path d="M18 9.5c1.4.5 2.5 1.6 2.5 2.5s-1.1 2-2.5 2.5" />
    </>
  );
}

export function IconPalette(props: IconProps) {
  return base(
    props,
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.7 1.7-1.7H16a4 4 0 0 0 4-4c0-4.3-3.6-7.2-8-7.2Z" />
      <circle cx="7.7" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.3" cy="7" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  );
}

export function IconShoppingBag(props: IconProps) {
  return base(
    props,
    <>
      <path d="M6 8h12l-1 12.5a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9L6 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  );
}

export function IconArchive(props: IconProps) {
  return base(
    props,
    <>
      <rect x="3.5" y="4" width="17" height="4.5" rx="1" />
      <path d="M4.5 8.5V19a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V8.5" />
      <path d="M10 13h4" />
    </>
  );
}

export function IconBuilding(props: IconProps) {
  return base(
    props,
    <>
      <rect x="4" y="3.5" width="10" height="17" rx="1" />
      <rect x="16" y="9" width="4" height="11.5" rx="1" />
      <path d="M7 7h1.5M7 10.5h1.5M7 14h1.5M10.5 7H12M10.5 10.5H12M10.5 14H12" />
    </>
  );
}

export function IconTruck(props: IconProps) {
  return base(
    props,
    <>
      <path d="M3 7.5h11v9H3z" />
      <path d="M14 10.5h3.3L20 13v3.5h-6" />
      <circle cx="7.5" cy="18" r="1.6" />
      <circle cx="16.5" cy="18" r="1.6" />
    </>
  );
}

export function IconSupplier(props: IconProps) {
  return base(
    props,
    <>
      <path d="M3.5 20V9.5L12 4l8.5 5.5V20" />
      <path d="M9 20v-6h6v6" />
    </>
  );
}

export function IconBank(props: IconProps) {
  return base(
    props,
    <>
      <path d="M3.5 9.5 12 4l8.5 5.5" />
      <path d="M4.5 9.5h15V20h-15z" />
      <path d="M4.5 20h15" />
      <path d="M8 12.5v5M12 12.5v5M16 12.5v5" />
    </>
  );
}

export function IconArrowDownCircle(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v7M8.7 12l3.3 3 3.3-3" />
    </>
  );
}

export function IconArrowUpCircle(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 16V9M8.7 12l3.3-3 3.3 3" />
    </>
  );
}

export function IconSettings(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M4.5 12h2M17.5 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" />
    </>
  );
}

export function IconLogout(props: IconProps) {
  return base(
    props,
    <>
      <path d="M9 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h3" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </>
  );
}

export function IconMenu(props: IconProps) {
  return base(
    props,
    <>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </>
  );
}

export function IconClose(props: IconProps) {
  return base(
    props,
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  );
}

export function IconAlert(props: IconProps) {
  return base(
    props,
    <>
      <path d="M12 3.5 21 19.5H3z" />
      <path d="M12 9.5v4.2" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
    </>
  );
}

export function IconTrendUp(props: IconProps) {
  return base(
    props,
    <>
      <path d="M4 16 10 10l3.5 3.5L20 6" />
      <path d="M14.5 6H20v5.5" />
    </>
  );
}
