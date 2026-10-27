"use client";

import { useState } from "react";
import { PRESENTATIONS, priceFieldName } from "../lib/presentations";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// Tecnica + prendas del formulario "Montar diseño". Al cambiar la tecnica
// cambian las prendas disponibles (Tank top solo en bordado) y el precio:
// en estampado es fijo por prenda (viene de /configuracion), en bordado se
// escribe a mano. El servidor vuelve a validar todo (disenos/nueva/actions.ts).
export function GarmentPicker({
  estampadoPrices,
}: {
  estampadoPrices: Record<string, number | null>;
}) {
  const [technique, setTechnique] = useState<"estampado" | "bordado">("estampado");
  const available = PRESENTATIONS.filter((p) =>
    (p.techniques as readonly string[]).includes(technique)
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="block text-sm font-medium mb-2">Técnica *</p>
        <div className="flex gap-2">
          {(["estampado", "bordado"] as const).map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium ${
                technique === t
                  ? "border-ricamo-black bg-ricamo-black text-white"
                  : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              <input
                type="radio"
                name="technique"
                value={t}
                checked={technique === t}
                onChange={() => setTechnique(t)}
                className="sr-only"
              />
              {t === "estampado" ? "Estampado" : "Bordado"}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="block text-sm font-medium mb-1">¿En qué prendas se ofrece? *</p>
        <p className="text-xs text-neutral-500 mb-3">
          {technique === "estampado"
            ? "En estampado el precio es fijo por prenda (se cambia en Configuración)."
            : "En bordado el precio varía por diseño: escríbelo para cada prenda que marques."}
        </p>
        <div className="space-y-2">
          {available.map((p) => {
            const inputId = `garment-${p.key.replace(/\s+/g, "-")}`;
            const fixedPrice =
              technique === "estampado" && p.estampadoPriceKey
                ? estampadoPrices[p.estampadoPriceKey] ?? null
                : null;
            return (
              <div
                key={p.key}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2"
              >
                <input
                  type="checkbox"
                  id={inputId}
                  name="presentation_keys"
                  value={p.key}
                  defaultChecked={p.key === "camiseta oversize"}
                  className="rounded border-neutral-300"
                />
                <label htmlFor={inputId} className="text-sm flex-1 cursor-pointer">
                  {p.label}
                </label>
                {technique === "estampado" ? (
                  <span className="text-sm text-neutral-500">
                    {fixedPrice != null ? currencyFormatter.format(fixedPrice) : "Precio sin definir"}
                  </span>
                ) : (
                  <input
                    type="number"
                    name={priceFieldName(p.key)}
                    min={0}
                    step={1}
                    placeholder="Precio"
                    className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm w-28"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
