"use client";

import { useState } from "react";
import { currencyFormatter } from "../lib/format";

// Campo de cantidad del checkout que muestra en vivo cuanto transferir
// (precio x cantidad). Sin JavaScript el campo funciona igual y el total
// se recalcula siempre en el servidor (comprar/actions.ts).
export function QuantityTotal({ unitPriceCop, max }: { unitPriceCop: number; max: number }) {
  const [quantity, setQuantity] = useState(1);
  const safeQuantity = Number.isFinite(quantity) && quantity >= 1 ? Math.min(quantity, max) : 1;

  return (
    <div>
      <label htmlFor="quantity" className="block text-sm font-medium mb-1">
        Cantidad
      </label>
      <input
        id="quantity"
        name="quantity"
        type="number"
        min={1}
        max={max}
        defaultValue={1}
        onChange={(e) => setQuantity(Number.parseInt(e.target.value, 10))}
        className="w-full rounded-xl border border-black/15 px-4 py-2.5"
      />
      <p className="text-sm mt-2">
        Total a transferir:{" "}
        <span className="font-bold">{currencyFormatter.format(unitPriceCop * safeQuantity)}</span>
      </p>
    </div>
  );
}
