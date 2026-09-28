import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChallengeLog,
  ChallengeSummary,
  StatsData,
  calculateStats,
} from "./statsUtils";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const toLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const shortDate = (dateKey: string) => dateKey.slice(5);

const shortName = (name: string) =>
  name.length > 12 ? `${name.slice(0, 11)}…` : name;

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

function ChartTooltip({
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

function SectionHeader({
  title,
  dotClass,
}: {
  title: string;
  dotClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
      <h4 className="text-sm font-bold uppercase tracking-wider text-content-secondary">
        {title}
      </h4>
    </div>
  );
}

export function StatsDashboard({ data }: { data: StatsData }) {
  const hasActivity = data.totalReps > 0 || data.challengeCount > 0;

  if (!hasActivity) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h3 className="text-xl font-bold text-content tracking-tight">
            Min statistik
          </h3>
          <p className="text-xs text-content-faint mt-0.5">
            Översikt över alla dina utmaningar och aktivitet.
          </p>
        </div>
        <div className="text-center py-10 text-content-faint text-sm bg-inset rounded-xl border border-dashed border-outline">
          Ingen aktivitet ännu. Logga dina första reps i en utmaning så visas
          din statistik här.
        </div>
      </div>
    );
  }

  const bestDayLabel = data.bestDay
    ? `Bästa dag: ${data.bestDay.amount} (${new Date(data.bestDay.date).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })})`
    : undefined;

  const cards: Array<{ label: string; value: string; sub?: string }> = [
    { label: "Totala poäng", value: `${data.totalPoints} XP` },
    { label: "Totala reps", value: String(data.totalReps), sub: bestDayLabel },
    { label: "Challenges", value: String(data.challengeCount) },
    {
      label: "Snitt per dag",
      value: String(data.averagePerDay),
      sub: `${data.loggedDays} loggade dagar`,
    },
    {
      label: "Aktuell serie",
      value: `${data.currentStreak} ${data.currentStreak === 1 ? "dag" : "dagar"}`,
    },
    {
      label: "Längsta serie",
      value: `${data.longestStreak} ${data.longestStreak === 1 ? "dag" : "dagar"}`,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-content tracking-tight">
          Min statistik
        </h3>
        <p className="text-xs text-content-faint mt-0.5">
          Översikt över alla dina utmaningar och aktivitet.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="space-y-2.5">
        <SectionHeader title="Reps över tid" dotClass="bg-accent" />
        <div className="h-72 w-full rounded-xl border border-outline-soft bg-inset/60 p-2 sm:p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.dailySeries}
              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="repsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--accent)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--accent)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--outline-soft)"
              />
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
                      {
                        text: `${point.amount} reps`,
                        color: "var(--accent)",
                      },
                      {
                        text: `Totalt: ${point.cumulative} reps`,
                      },
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
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2.5">
          <SectionHeader
            title="Reps per vecka"
            dotClass="bg-success"
          />
          <div className="h-64 w-full rounded-xl border border-outline-soft bg-inset/60 p-2 sm:p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.weeklySeries}
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
                      rows={(point) => [
                        {
                          text: `${point.amount} reps`,
                          color: "var(--success)",
                        },
                      ]}
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
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-2.5">
          <SectionHeader
            title="Poäng per challenge"
            dotClass="bg-warning"
          />
          <div className="h-64 w-full rounded-xl border border-outline-soft bg-inset/60 p-2 sm:p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.challengeSeries}
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
                      label={undefined}
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
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stats() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchStats() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userChallenges } = await supabase
        .from("user_challenges")
        .select("challenge_id, chosen_tier")
        .eq("user_id", user.id);
      const { data: challengeRows } = await supabase
        .from("challenges")
        .select("id, title, points");
      const { data: logs } = await supabase
        .from("challenge_logs")
        .select("challenge_id, amount, logged_at")
        .eq("user_id", user.id);

      const challengeById = new Map(
        (challengeRows || []).map((challenge) => [challenge.id, challenge]),
      );
      const totalsByChallenge = new Map<number, number>();
      logs?.forEach((log) => {
        totalsByChallenge.set(
          log.challenge_id,
          (totalsByChallenge.get(log.challenge_id) || 0) + log.amount,
        );
      });

      const summaries: ChallengeSummary[] = (userChallenges || [])
        .map((entry) => {
          const challenge = challengeById.get(entry.challenge_id);
          if (!challenge) return null;
          return {
            challengeId: challenge.id,
            title: challenge.title,
            points: challenge.points,
            chosenTier: entry.chosen_tier || "",
            totalAmount: totalsByChallenge.get(challenge.id) || 0,
          };
        })
        .filter(
          (entry): entry is ChallengeSummary => entry !== null,
        );

      const logEntries: ChallengeLog[] = (logs || []).map((log) => ({
        challengeId: log.challenge_id,
        amount: log.amount,
        loggedAt: log.logged_at,
      }));

      setData(
        calculateStats(logEntries, summaries, toLocalDateKey(new Date())),
      );
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-content-fainter animate-pulse text-center py-6">
        Hämtar statistik...
      </p>
    );
  }

  if (!data) return null;

  return <StatsDashboard data={data} />;
}

export default Stats;
