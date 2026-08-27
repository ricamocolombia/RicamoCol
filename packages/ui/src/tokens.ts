// Tokens de marca Ricamo. No existe un manual de marca formal: amarillo y
// negro se tomaron a ojo del logo oficial (recibido 2026-08-27) y quedan
// como el estandar de facto del proyecto. El rojo sigue siendo un acento
// provisional: no aparece en el isotipo, se usa como color de refuerzo
// (CTAs, urgencia) y falta definirlo con el negocio. Usar estos tokens tanto
// aqui como en tailwind.config.ts de cada app para que ambas apps queden
// sincronizadas.
export const brand = {
  name: "Ricamo",
  tagline: "Lo creas, lo llevas",
  colors: {
    yellow: "#F5C518",
    black: "#0A0A0A",
    red: "#D7263D",
  },
};
