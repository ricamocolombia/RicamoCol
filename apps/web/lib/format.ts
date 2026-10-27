export const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const GARMENT_LABELS: Record<string, string> = {
  camiseta: "Camiseta",
  buzo: "Buzo",
  "tank top": "Tank top",
  "camiseta regular": "Camiseta Regular",
  "camiseta oversize": "Camiseta Oversize",
  "buzo cuello redondo": "Buzo Cuello Redondo",
  "buzo capucha": "Buzo Capucha",
};

export const TECHNIQUE_LABELS: Record<string, string> = {
  bordado: "Bordado",
  estampado: "Estampado",
};
