// Grafico de area/linea en SVG puro, sin libreria ni JS de cliente: los
// puntos ya vienen calculados desde el server component que lo usa. Pensado
// para series cortas (ventas de los ultimos N dias), no para datasets densos.
interface TrendPoint {
  label: string;
  value: number;
}

const WIDTH = 720;
const HEIGHT = 220;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PAD_X = 8;

export function TrendChart({
  points,
  formatValue,
  color = "#D7263D",
}: {
  points: TrendPoint[];
  formatValue: (n: number) => string;
  color?: string;
}) {
  const total = points.reduce((sum, p) => sum + p.value, 0);

  if (points.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-neutral-400">
        Todavía no hay ventas registradas en este periodo.
      </div>
    );
  }

  const max = Math.max(...points.map((p) => p.value), 1);
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const coords = points.map((p, i) => {
    const x =
      points.length === 1
        ? PAD_X + innerWidth / 2
        : PAD_X + (i / (points.length - 1)) * innerWidth;
    const y = PAD_TOP + innerHeight - (p.value / max) * innerHeight;
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${PAD_TOP + innerHeight} L${coords[0].x.toFixed(1)},${PAD_TOP + innerHeight} Z`;

  const gradientId = "trend-fill";
  const last = coords[coords.length - 1];
  const first = coords[0];
  const promedio = total / points.length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-ricamo-black">{formatValue(total)}</p>
          <p className="text-xs text-neutral-400">en el periodo mostrado</p>
        </div>
        <p className="text-xs text-neutral-400">Promedio diario: {formatValue(promedio)}</p>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-[180px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lineas guia horizontales */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={PAD_TOP + innerHeight * f}
            y2={PAD_TOP + innerHeight * f}
            stroke="#E5E5E5"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={last.x} cy={last.y} r={4.5} fill={color} />

        <text x={first.x} y={HEIGHT - 8} fontSize="11" fill="#A3A3A3" textAnchor="start">
          {first.label}
        </text>
        <text x={last.x} y={HEIGHT - 8} fontSize="11" fill="#A3A3A3" textAnchor="end">
          {last.label}
        </text>
      </svg>
    </div>
  );
}
