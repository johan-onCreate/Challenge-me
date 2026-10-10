import type { StatsData } from "../../statsUtils";
import { ChallengePointsChart } from "./ChallengePointsChart";
import { DailyRepsChart } from "./DailyRepsChart";
import { WeeklyRepsChart } from "./WeeklyRepsChart";

export function StatsCharts({ data }: { data: StatsData }) {
  return (
    <>
      <DailyRepsChart data={data.dailySeries} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyRepsChart data={data.weeklySeries} />
        <ChallengePointsChart data={data.challengeSeries} />
      </div>
    </>
  );
}
