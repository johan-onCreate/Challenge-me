import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateTargetAveragePerDay,
  calculateTargetProgress,
} from "./leaderboardUtils";

interface LeaderboardUser {
  userId: string;
  alias: string;
  fullName: string;
  totalAmount: number;
  loggedDays: number;
  chosenTier: string;
}

interface ChartPoint {
  date: string;
  [participantId: string]: string | number;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Leaderboard() {
  const [groupedLeaders, setGroupedLeaders] = useState<{
    [tier: string]: LeaderboardUser[];
  }>({});
  const [groupedChartData, setGroupedChartData] = useState<{
    [tier: string]: ChartPoint[];
  }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [challengeTitle, setChallengeTitle] = useState<string>("");

  useEffect(() => {
    async function fetchLeaderboardData() {
      // 1. Hämta den aktiva utmaningen baserat på dagens datum
      const nowIso = new Date().toISOString();
      const { data: activeChallenge } = await supabase
        .from("challenges")
        .select("id, title, start_date, end_date")
        .eq("is_active", true)
        .lte("start_date", nowIso)
        .gte("end_date", nowIso)
        .maybeSingle();

      if (!activeChallenge) {
        setLoading(false);
        return;
      }
      setChallengeTitle(activeChallenge.title);

      // 2. Hämta alla profiler för att kunna visa alias/namn
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, alias, full_name");

      // 3. Hämta alla valda nivåer (tiers) från kopplingstabellen
      const { data: userChallenges } = await supabase
        .from("user_challenges")
        .select("user_id, chosen_tier")
        .eq("challenge_id", activeChallenge.id);

      // 4. Hämta alla dagliga loggar för denna specifika utmaning
      const { data: logs } = await supabase
        .from("challenge_logs")
        .select("user_id, amount, logged_at")
        .eq("challenge_id", activeChallenge.id);

      if (profiles && logs) {
        const profileMap = new Map(profiles.map((p) => [p.id, p]));
        const tierMap = new Map(
          userChallenges?.map((uc) => [uc.user_id, uc.chosen_tier]) || [],
        );

        // Räkna ihop totalt antal reps per användar-ID
        const userTotals: { [key: string]: number } = {};
        const userLogDays: { [key: string]: Set<string> } = {};
        const userDailyTotals: {
          [userId: string]: { [date: string]: number };
        } = {};
        logs.forEach((log) => {
          userTotals[log.user_id] = (userTotals[log.user_id] || 0) + log.amount;
          if (!userLogDays[log.user_id]) {
            userLogDays[log.user_id] = new Set();
          }
          userLogDays[log.user_id].add(log.logged_at);
          if (!userDailyTotals[log.user_id]) {
            userDailyTotals[log.user_id] = {};
          }
          userDailyTotals[log.user_id][log.logged_at] =
            (userDailyTotals[log.user_id][log.logged_at] || 0) + log.amount;
        });

        // Bygg ihop användardata och förbered för gruppering
        const groups: { [tier: string]: LeaderboardUser[] } = {};

        const participantIds = new Set([
          ...(userChallenges?.map((userChallenge) => userChallenge.user_id) ||
            []),
          ...Object.keys(userTotals),
        ]);

        participantIds.forEach((userId) => {
          const prof = profileMap.get(userId);
          const tier = tierMap.get(userId) || "Ej vald";

          const userEntry: LeaderboardUser = {
            userId,
            alias: prof?.alias || "Anonym koder",
            fullName: prof?.full_name || "Okänt namn",
            totalAmount: userTotals[userId] || 0,
            loggedDays: userLogDays[userId]?.size || 0,
            chosenTier: tier,
          };

          if (!groups[tier]) {
            groups[tier] = [];
          }
          groups[tier].push(userEntry);
        });

        // Sortera varje enskild grupp så att flest reps hamnar högst upp
        Object.keys(groups).forEach((tier) => {
          groups[tier].sort((a, b) => b.totalAmount - a.totalAmount);
        });

        const startDate = new Date(activeChallenge.start_date);
        const endDate = new Date(activeChallenge.end_date);
        const chartDates: string[] = [];
        const dateCursor = new Date(startDate);
        while (dateCursor <= endDate) {
          chartDates.push(dateCursor.toISOString().slice(0, 10));
          dateCursor.setUTCDate(dateCursor.getUTCDate() + 1);
        }

        const chartGroups: { [tier: string]: ChartPoint[] } = {};

        Object.keys(groups).forEach((tier) => {
          const tierLeaders = groups[tier];
          const targetAveragePerDay = calculateTargetAveragePerDay(
            tier,
            chartDates.length,
          );
          const cumulativeTotals: { [userId: string]: number } = {};

          tierLeaders.forEach((leader) => {
            cumulativeTotals[leader.userId] = 0;
          });

          chartGroups[tier] = chartDates.map((date, index) => {
            const point: ChartPoint = { date };
            tierLeaders.forEach((leader) => {
              cumulativeTotals[leader.userId] +=
                userDailyTotals[leader.userId]?.[date] || 0;
              point[leader.userId] = cumulativeTotals[leader.userId];
            });
            point.average = calculateTargetProgress(
              tier,
              chartDates.length,
              index + 1,
            );
            return point;
          });
        });

        setGroupedLeaders(groups);
        setGroupedChartData(chartGroups);
      }
      setLoading(false);
    }

    fetchLeaderboardData();
  }, []);

  if (loading)
    return (
      <p className="text-sm text-slate-400 animate-pulse text-center py-6">
        Laddar ställningen...
      </p>
    );
  const tierKeys = Object.keys(groupedLeaders);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center sm:text-left">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Topplista
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Aktuell utmaning:{" "}
          <span className="font-semibold text-slate-800">
            {challengeTitle || "Ingen aktiv"}
          </span>
        </p>
      </div>

      {tierKeys.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Ingen har antagit utmaningen eller loggat några framsteg än.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Loopa igenom varje unik nivå och skapa en separat tabell */}
          {tierKeys.map((tier) => (
            <div key={tier} className="space-y-2.5">
              {(() => {
                const tierLeaders = groupedLeaders[tier];
                const chartData = groupedChartData[tier] || [];
                const targetAveragePerDay =
                  chartData.length > 0
                    ? Number(chartData[chartData.length - 1].average) /
                      chartData.length
                    : 0;

                return (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                        Mål: {tier}
                      </h4>
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-md">
                        {groupedLeaders[tier].length}{" "}
                        {groupedLeaders[tier].length === 1
                          ? "deltagare"
                          : "deltagare"}
                      </span>
                    </div>

                    <div className="h-80 w-full rounded-xl border border-slate-100 bg-slate-50/60 p-2 sm:p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            stroke="#94a3b8"
                          />
                          <YAxis
                            type="number"
                            allowDecimals={false}
                            width={42}
                            tick={{ fontSize: 11 }}
                            stroke="#94a3b8"
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              `${value} reps`,
                              name === "average" ? "Målsnitt" : "Progress",
                            ]}
                          />
                          <Legend />
                          {tierLeaders.map((leader, index) => (
                            <Line
                              key={leader.userId}
                              type="monotone"
                              dataKey={leader.userId}
                              name={leader.alias}
                              stroke={
                                [
                                  "#2563eb",
                                  "#059669",
                                  "#9333ea",
                                  "#dc2626",
                                  "#0891b2",
                                ][index % 5]
                              }
                              strokeWidth={2}
                              dot={false}
                            />
                          ))}
                          {targetAveragePerDay > 0 && (
                            <Line
                              type="linear"
                              dataKey="average"
                              name={`Målsnitt (${targetAveragePerDay.toFixed(1)}/dag)`}
                              stroke="#d97706"
                              strokeDasharray="6 4"
                              strokeWidth={3}
                              dot={false}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                );
              })()}

              <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm bg-white">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                      <th className="py-2.5 px-4 w-12 text-center">Plats</th>
                      <th className="py-2.5 px-4">Deltagare</th>
                      <th className="py-2.5 px-4 text-right">Totalt loggat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {groupedLeaders[tier].map((leader, index) => {
                      const isTop3 = index < 3;
                      const medalEmojis = ["🥇", "🥈", "🥉"];

                      return (
                        <tr
                          key={index}
                          className={`hover:bg-slate-50/40 transition-colors ${index === 0 ? "bg-amber-50/10" : ""}`}
                        >
                          <td className="py-3 px-4 font-bold text-center text-slate-400 text-xs">
                            {isTop3 ? (
                              <span className="text-base">
                                {medalEmojis[index]}
                              </span>
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {leader.alias}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {leader.fullName}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-sm sm:text-base">
                            {leader.totalAmount}{" "}
                            <span className="text-xs font-normal text-slate-400">
                              reps
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
