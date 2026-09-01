// Fondo decorativo del login: patron SVG repetido con motivos de bordado y
// estampado (aguja+hilo, aro de bordado, sello de estampado), a bajo opacidad
// sobre negro. Puramente decorativo (aria-hidden), sin JS de cliente.
export function LoginBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full text-ricamo-yellow/[0.08]"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="ricamo-login-pattern"
          width="220"
          height="220"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-8)"
        >
          {/* Aguja + hilo */}
          <g transform="translate(20 24)" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="0" y1="40" x2="46" y2="0" />
            <ellipse cx="6" cy="34" rx="3.4" ry="2" transform="rotate(-42 6 34)" />
            <path d="M6 34 C -6 30, -10 42, 2 46 C 12 50, 8 60, -4 58" />
          </g>

          {/* Aro de bordado */}
          <g transform="translate(150 40)" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="0" cy="0" r="26" />
            <circle cx="0" cy="0" r="19" />
          </g>

          {/* Sello de estampado */}
          <g transform="translate(50 140)" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="-20" y="-16" width="40" height="32" rx="6" strokeDasharray="5 5" />
            <path d="M-10 -4 H10 M-10 4 H4" />
          </g>

          {/* Tijeras simplificadas */}
          <g transform="translate(165 165)" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="-8" cy="8" r="5" />
            <circle cx="8" cy="8" r="5" />
            <line x1="-4" y1="4" x2="18" y2="-18" />
            <line x1="4" y1="4" x2="-18" y2="-18" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ricamo-login-pattern)" />
    </svg>
  );
}
