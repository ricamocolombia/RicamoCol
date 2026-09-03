"use client";

import { useState } from "react";

type PrintSize = "punto_corazon" | "media_carta" | "carta" | "oficio" | "tabloide";

const PRINT_SIZE_LABELS: Record<PrintSize, string> = {
  punto_corazon: "Punto corazón",
  media_carta: "Media carta",
  carta: "Carta",
  oficio: "Oficio",
  tabloide: "Tabloide",
};

const PRINT_SIZES = Object.keys(PRINT_SIZE_LABELS) as PrintSize[];

// Una prenda puede llevar mas de una decoracion (ej. estampado punto corazon
// adelante + estampado carta atras, o dos bordados) -- cada linea tiene su
// propio tamaño de referencia (opcional, solo aplica a estampado) y su
// propio costo manual. El total se suma en el servidor al guardar la venta,
// no aqui -- este componente solo junta las lineas en el formulario.
export function DecorationLinesField({
  printPricesBySize,
}: {
  printPricesBySize: Record<string, number | null>;
}) {
  const [rowIds, setRowIds] = useState<number[]>([0]);

  return (
    <div className="space-y-3">
      {rowIds.map((rowId) => (
        <div key={rowId} className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 p-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-neutral-500 mb-1">
              Tamaño de estampado (si aplica)
            </label>
            <select
              name="decoration_print_size"
              defaultValue=""
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">— No aplica (ej. bordado) —</option>
              {PRINT_SIZES.map((size) => {
                const cost = printPricesBySize[size];
                return (
                  <option key={size} value={size}>
                    {PRINT_SIZE_LABELS[size]}
                    {cost != null ? ` (ref. $${cost.toLocaleString("es-CO")})` : " (costo sin definir)"}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs text-neutral-500 mb-1">Costo (COP)</label>
            <input
              name="decoration_cost_cop"
              type="number"
              min={0}
              step={1}
              placeholder="Ej: 5000"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          {rowIds.length > 1 && (
            <button
              type="button"
              onClick={() => setRowIds((ids) => ids.filter((id) => id !== rowId))}
              className="text-xs text-neutral-400 hover:text-ricamo-red underline underline-offset-2 mb-2.5 cursor-pointer"
            >
              Quitar
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => setRowIds((ids) => [...ids, Math.max(...ids) + 1])}
        className="text-sm font-semibold text-ricamo-black border border-neutral-300 rounded-lg px-3 py-1.5 hover:border-ricamo-black cursor-pointer"
      >
        + Agregar otra decoración
      </button>
      <p className="text-xs text-neutral-500">
        Úsalo cuando la prenda lleva más de un estampado o bordado (ej.
        diseño adelante y atrás) — el costo total de producción se suma
        automáticamente.
      </p>
    </div>
  );
}
