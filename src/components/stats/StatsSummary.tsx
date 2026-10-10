import type { StatsData } from "../../statsUtils";
import { formatShortDate } from "./dateFormatting";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-outline-soft bg-inset p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-content-faint">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-content">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-content-faint">{sub}</p>}
    </div>
  );
}

function StatsHeading({
  title,
  todayReps,
}: {
  title: string;
  todayReps: number;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-xl font-bold text-content tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-content-faint mt-0.5">
          Översikt över alla utmaningar och aktivitet.
        </p>
      </div>
      <div className="shrink-0 rounded-xl border border-outline-soft bg-inset px-3 py-2 text-right">
        <p className="text-[11px] font-bold uppercase tracking-wider text-content-faint">
          Loggat idag:
        </p>
        <p className="mt-0.5 text-sm font-extrabold text-content">
          {todayReps} reps
        </p>
      </div>
    </div>
  );
}

function buildCards(data: StatsData) {
  const bestDayLabel = data.bestDay
    ? `Bästa dag: ${data.bestDay.amount} (${formatShortDate(data.bestDay.date)})`
    : undefined;

  return [
    { label: "Totala poäng", value: `${data.totalPoints} XP` },
    { label: "Totala reps", value: String(data.totalReps), sub: bestDayLabel },
    { label: "Challenges", value: String(data.challengeCount) },
    {
      label: "Snitt per dag",
      value: String(data.averagePerDay),
      sub: `${data.loggedDays} loggade dagar`,
    },
    {
      label: "Aktuell streak",
      value: `${data.currentStreak} ${data.currentStreak === 1 ? "dag" : "dagar"}`,
    },
    {
      label: "Längsta streak",
      value: `${data.longestStreak} ${data.longestStreak === 1 ? "dag" : "dagar"}`,
    },
  ];
}

export function StatsSummary({
  data,
  title,
  showCards = true,
}: {
  data: StatsData;
  title: string;
  showCards?: boolean;
}) {
  return (
    <div className="space-y-6">
      <StatsHeading title={title} todayReps={data.todayReps} />
      {showCards && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {buildCards(data).map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}
    </div>
  );
}
