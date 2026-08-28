import type { Config } from "tailwindcss";

// Colores de marca tomados del logo oficial (ver packages/ui/src/tokens.ts
// para el detalle). El crudo/hueso extiende la paleta para que combine con
// las prendas oversized en crudo/blanco que ya usa la marca en Instagram —
// el amarillo/negro/rojo del logo quedan como acentos, no como fondo base.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ricamo: {
          yellow: "#F5C518",
          black: "#0A0A0A",
          red: "#D7263D",
          cream: "#FAF6EC",
          bone: "#F1EADA",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
