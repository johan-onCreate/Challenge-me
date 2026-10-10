import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "../../statsUtils";
import { ChartSection, ChartTooltip } from "./ChartPrimitives";

const shortDate = (dateKey: string) => dateKey.slice(5);

export function DailyRepsChart({ data }: { data: DailyPoint[] }) {
  return (
    <ChartSection title="Reps över tid" dotClass="bg-accent" height="h-72">
      <AreaChart
        data={data}
        margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
      >
        <defs>
          <linearGradient id="repsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-soft)" />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={{ fontSize: 11, fill: "var(--content-faint)" }}
          stroke="var(--outline)"
        />
        <YAxis
          type="number"
          allowDecimals={false}
          width={42}
          tick={{ fontSize: 11, fill: "var(--content-faint)" }}
          stroke="var(--outline)"
        />
        <Tooltip
          content={
            <ChartTooltip
              rows={(point) => [
                { text: `${point.amount} reps`, color: "var(--accent)" },
                { text: `Totalt: ${point.cumulative} reps` },
              ]}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#repsGradient)"
        />
      </AreaChart>
    </ChartSection>
  );
}
