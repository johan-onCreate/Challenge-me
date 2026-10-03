import { useCallback, useEffect, useState } from "react";
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
import { useParams } from "react-router-dom";
import {
  ChallengeLog,
  ChallengeSummary,
  StatsData,
  calculateStats,
  toLocalDateKey,
} from "./statsUtils";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SWEDISH_MONTHS = [
  "jan",
  "feb",
  "mars",
  "apr",
  "maj",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

const formatShortDate = (dateKey: string) => {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${day} ${SWEDISH_MONTHS[month - 1] ?? ""}`;
};

const weekEndKey = (weekStartKey: string) => {
  const end = new Date(`${weekStartKey}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  return end.toISOString().slice(0, 10);
};

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

export function StatsDashboard({
  data,
  title = "Min statistik",
}: {
  data: StatsData;
  title?: string;
}) {
  const hasActivity = data.totalReps > 0;

  if (!hasActivity) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h3 className="text-xl font-bold text-content tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-content-faint mt-0.5">
            Översikt över alla utmaningar och aktivitet.
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
    ? `Bästa dag: ${data.bestDay.amount} (${formatShortDate(data.bestDay.date)})`
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
      label: "Aktuell streak",
      value: `${data.currentStreak} ${data.currentStreak === 1 ? "dag" : "dagar"}`,
    },
    {
      label: "Längsta streak",
      value: `${data.longestStreak} ${data.longestStreak === 1 ? "dag" : "dagar"}`,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-content tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-content-faint mt-0.5">
          Översikt över alla utmaningar och aktivitet.
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
          <SectionHeader title="Reps per vecka" dotClass="bg-success" />
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
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-2.5">
          <SectionHeader title="Poäng per challenge" dotClass="bg-warning" />
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

function StatsContent({ userId }: { userId?: string }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [title, setTitle] = useState("Min statistik");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const loadStats = useCallback(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error("Ingen inloggad användare");
    const selectedUserId = userId || user.id;
    let selectedTitle = "Min statistik";

    if (selectedUserId !== user.id) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("alias, full_name")
        .eq("id", selectedUserId)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) throw new Error("Användaren hittades inte");
      selectedTitle = `${
        profile.alias || profile.full_name || "Användarens"
      } statistik`;
    }

    const { data: userChallenges, error: userChallengesError } = await supabase
      .from("user_challenges")
      .select("challenge_id, chosen_tier")
      .eq("user_id", selectedUserId);
    if (userChallengesError) throw userChallengesError;
    const { data: challengeRows, error: challengeRowsError } = await supabase
      .from("challenges")
      .select("id, title, points");
    if (challengeRowsError) throw challengeRowsError;
    const { data: logs, error: logsError } = await supabase
      .from("challenge_logs")
      .select("challenge_id, amount, logged_at")
      .eq("user_id", selectedUserId);
    if (logsError) throw logsError;

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
      .filter((entry): entry is ChallengeSummary => entry !== null);

    const logEntries: ChallengeLog[] = (logs || []).map((log) => ({
      challengeId: log.challenge_id,
      amount: log.amount,
      loggedAt: log.logged_at,
    }));

    return {
      data: calculateStats(logEntries, summaries, toLocalDateKey(new Date())),
      title: selectedTitle,
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await loadStats();
        if (!cancelled) {
          setData(result.data);
          setTitle(result.title);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Kunde inte hämta statistik. Kontrollera din anslutning och försök igen.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadStats, retry]);

  const retryLoad = () => {
    setLoading(true);
    setError(null);
    setRetry((count) => count + 1);
  };

  if (loading) {
    return (
      <p className="text-sm text-content-fainter animate-pulse text-center py-6">
        Hämtar statistik...
      </p>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 space-y-3">
        <p className="text-sm text-danger">{error}</p>
        <button
          type="button"
          onClick={retryLoad}
          className="text-xs bg-btn text-on-btn hover:bg-btn-hover px-3 py-1.5 font-medium rounded-lg transition-colors"
        >
          Försök igen
        </button>
      </div>
    );
  }

  if (!data) return null;

  return <StatsDashboard data={data} title={title} />;
}

function Stats() {
  const { userId } = useParams<{ userId: string }>();
  return <StatsContent key={userId || "current"} userId={userId} />;
}

export default Stats;
