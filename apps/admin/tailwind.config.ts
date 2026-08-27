import type { Config } from "tailwindcss";

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
