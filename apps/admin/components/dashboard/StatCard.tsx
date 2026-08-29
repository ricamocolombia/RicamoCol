import type { ComponentType, SVGProps } from "react";

const ACCENT_STYLES = {
  yellow: "bg-ricamo-yellow/20 text-ricamo-black",
  red: "bg-ricamo-red/10 text-ricamo-red",
  black: "bg-ricamo-black text-white",
  neutral: "bg-neutral-100 text-neutral-500",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  accent?: keyof typeof ACCENT_STYLES;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        {Icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ACCENT_STYLES[accent]}`}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-ricamo-black leading-tight">{value}</p>
      {hint && <p className="text-xs text-neutral-400 mt-1.5">{hint}</p>}
    </div>
  );
}
