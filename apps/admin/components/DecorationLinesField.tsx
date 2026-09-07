"use client";

import { useRef, useState } from "react";

type PrintSize = "punto_corazon" | "media_carta" | "carta" | "oficio" | "tabloide";

const PRINT_SIZE_LABELS: Record<PrintSize, string> = {
  punto_corazon: "Punto corazón",
  media_carta: "Media carta",
  carta: "Carta",
  oficio: "Oficio",
  tabloide: "Tabloide",
};

const PRINT_SIZES = Object.keys(PRINT_SIZE_LABELS) as PrintSize[];

function DecorationLineRow({
  printPricesBySize,
  onRemove,
  canRemove,
}: {
  printPricesBySize: Record<string, number | null>;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const costInputRef = useRef<HTMLInputElement>(null);

  // Al elegir un tamaño con costo de referencia conocido, se rellena el
  // campo de costo con ese valor -- sigue siendo editable a mano despues,
  // por si el costo real de esa venta es distinto al de referencia. Si el
  // tamaño no tiene costo de referencia (o se vuelve a "No aplica"), no se
  // toca lo que el admin ya haya escrito.
  function handleSizeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const size = event.target.value;
    const refCost = size ? printPricesBySize[size] : null;
    if (refCost != null && costInputRef.current) {
      costInputRef.current.value = String(refCost);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 p-3">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs text-neutral-500 mb-1">
          Tamaño de estampado (si aplica)
        </label>
        <select
          name="decoration_print_size"
          defaultValue=""
          onChange={handleSizeChange}
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
          ref={costInputRef}
          name="decoration_cost_cop"
          type="number"
          min={0}
          step={1}
          placeholder="Ej: 5000"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-neutral-400 hover:text-ricamo-red underline underline-offset-2 mb-2.5 cursor-pointer"
        >
          Quitar
        </button>
      )}
    </div>
  );
}

// Una prenda puede llevar mas de una decoracion (ej. estampado punto corazon
// adelante + estampado carta atras, o dos bordados) -- cada linea tiene su
// propio tamaño de referencia (opcional, solo aplica a estampado) y su
// propio costo (autocompletado desde el precio de referencia, editable). El
// total se suma en el servidor al guardar la venta, no aqui -- este
// componente solo junta las lineas en el formulario.
export function DecorationLinesField({
  printPricesBySize,
}: {
  printPricesBySize: Record<string, number | null>;
}) {
  const [rowIds, setRowIds] = useState<number[]>([0]);

  return (
    <div className="space-y-3">
      {rowIds.map((rowId) => (
        <DecorationLineRow
          key={rowId}
          printPricesBySize={printPricesBySize}
          canRemove={rowIds.length > 1}
          onRemove={() => setRowIds((ids) => ids.filter((id) => id !== rowId))}
        />
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
