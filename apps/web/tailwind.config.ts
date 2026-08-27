import type { Config } from "tailwindcss";

// Colores de marca tomados del logo oficial (ver packages/ui/src/tokens.ts
// para el detalle y las notas sobre precision del hex).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ricamo: {
          yellow: "#F5C518",
          black: "#0A0A0A",
          red: "#D7263D",
        },
      },
    },
  },
  plugins: [],
};

export default config;
