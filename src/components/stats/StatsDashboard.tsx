import type { StatsData } from "../../statsUtils";
import { StatsCharts } from "./StatsCharts";
import { StatsSummary } from "./StatsSummary";

export function StatsDashboard({
  data,
  title = "Min statistik",
}: {
  data: StatsData;
  title?: string;
}) {
  if (!(data.totalReps > 0)) {
    return (
      <div className="space-y-6 animate-fade-in">
        <StatsSummary data={data} title={title} showCards={false} />
        <div className="text-center py-10 text-content-faint text-sm bg-inset rounded-xl border border-dashed border-outline">
          Ingen aktivitet ännu. Logga dina första reps i en utmaning så visas
          din statistik här.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <StatsSummary data={data} title={title} />
      <StatsCharts data={data} />
    </div>
  );
}
