import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyPoint } from "../../statsUtils";
import { formatShortDate } from "./dateFormatting";
import { ChartSection, ChartTooltip } from "./ChartPrimitives";

const weekEndKey = (weekStartKey: string) => {
  const end = new Date(`${weekStartKey}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  return end.toISOString().slice(0, 10);
};

export function WeeklyRepsChart({ data }: { data: WeeklyPoint[] }) {
  return (
    <ChartSection title="Reps per vecka" dotClass="bg-success" height="h-64">
      <BarChart
        data={data}
        margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--outline-soft)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
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
              rows={(point) => {
                const week = String(point.week);
                return [
                  {
                    text: `${point.amount} reps`,
                    color: "var(--success)",
                  },
                  {
                    text: `${formatShortDate(week)} – ${formatShortDate(weekEndKey(week))} ${week.slice(0, 4)}`,
                  },
                ];
              }}
            />
          }
        />
        <Bar
          dataKey="amount"
          fill="var(--success)"
          fillOpacity={0.85}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartSection>
  );
}
