interface Row {
  label: string;
  value: number;
  sublabel?: string;
}

export function RankedList({
  title,
  rows,
  formatValue,
  emptyLabel = "Sin datos todavía.",
}: {
  title: string;
  rows: Row[];
  formatValue: (n: number) => string;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-400">{emptyLabel}</p>
      ) : (
        <div className="space-y-3.5">
          {rows.map((row, i) => (
            <div key={row.label}>
              <div className="flex items-center gap-2 text-sm mb-1">
                <span className="w-4 text-[11px] font-bold text-neutral-300 shrink-0">
                  {i + 1}
                </span>
                <span className="font-medium truncate flex-1">
                  {row.label}
                  {row.sublabel && (
                    <span className="text-neutral-400 font-normal"> · {row.sublabel}</span>
                  )}
                </span>
                <span className="text-neutral-600 whitespace-nowrap text-xs font-medium">
                  {formatValue(row.value)}
                </span>
              </div>
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden ml-6">
                <div
                  className="h-full bg-ricamo-red/70 rounded-full"
                  style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
