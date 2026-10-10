import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

export function ChartTooltip({
  active,
  payload,
  label,
  rows,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown> }>;
  label?: string;
  rows: (point: Record<string, unknown>) => Array<{
    text: string;
    color?: string;
  }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-outline bg-raised p-2.5 shadow-md text-xs space-y-1">
      {label && (
        <p className="font-semibold text-content-faint mb-1.5">{label}</p>
      )}
      {rows(point).map((row, index) => (
        <p
          key={index}
          className="font-medium"
          style={row.color ? { color: row.color } : undefined}
        >
          {row.text}
        </p>
      ))}
    </div>
  );
}

export function ChartSection({
  title,
  dotClass,
  height,
  children,
}: {
  title: string;
  dotClass: string;
  height: "h-72" | "h-64";
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
        <h4 className="text-sm font-bold uppercase tracking-wider text-content-secondary">
          {title}
        </h4>
      </div>
      <div
        className={`${height} w-full rounded-xl border border-outline-soft bg-inset/60 p-2 sm:p-3`}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
