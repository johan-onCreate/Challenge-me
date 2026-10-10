import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChallengePoint } from "../../statsUtils";
import { ChartSection, ChartTooltip } from "./ChartPrimitives";

const shortName = (name: string) =>
  name.length > 12 ? `${name.slice(0, 11)}…` : name;

export function ChallengePointsChart({ data }: { data: ChallengePoint[] }) {
  return (
    <ChartSection
      title="Poäng per challenge"
      dotClass="bg-warning"
      height="h-64"
    >
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
          dataKey="name"
          interval={0}
          tickFormatter={shortName}
          tick={{ fontSize: 10, fill: "var(--content-faint)" }}
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
                { text: String(point.name) },
                {
                  text: `${point.earned} / ${point.max} XP`,
                  color: "var(--warning)",
                },
              ]}
            />
          }
        />
        <Bar
          dataKey="earned"
          fill="var(--warning)"
          fillOpacity={0.85}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartSection>
  );
}
