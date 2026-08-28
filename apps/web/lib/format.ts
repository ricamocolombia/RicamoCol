export const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const GARMENT_LABELS: Record<string, string> = {
  camiseta: "Camiseta",
  buzo: "Buzo",
};

export const TECHNIQUE_LABELS: Record<string, string> = {
  bordado: "Bordado",
  estampado: "Estampado",
};
