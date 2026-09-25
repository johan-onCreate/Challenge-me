import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface LeaderboardUser {
  alias: string;
  fullName: string;
  totalAmount: number;
  chosenTier: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Leaderboard() {
  const [groupedLeaders, setGroupedLeaders] = useState<{
    [tier: string]: LeaderboardUser[];
  }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [challengeTitle, setChallengeTitle] = useState<string>("");

  useEffect(() => {
    async function fetchLeaderboardData() {
      // 1. Hämta den aktiva utmaningen baserat på dagens datum
      const nowIso = new Date().toISOString();
      const { data: activeChallenge } = await supabase
        .from("challenges")
        .select("id, title")
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
        .select("user_id, amount")
        .eq("challenge_id", activeChallenge.id);

      if (profiles && logs) {
        const profileMap = new Map(profiles.map((p) => [p.id, p]));
        const tierMap = new Map(
          userChallenges?.map((uc) => [uc.user_id, uc.chosen_tier]) || [],
        );

        // Räkna ihop totalt antal reps per användar-ID
        const userTotals: { [key: string]: number } = {};
        logs.forEach((log) => {
          userTotals[log.user_id] = (userTotals[log.user_id] || 0) + log.amount;
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
            alias: prof?.alias || "Anonym koder",
            fullName: prof?.full_name || "Okänt namn",
            totalAmount: userTotals[userId] || 0,
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

        setGroupedLeaders(groups);
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

              <div className="h-56 w-full rounded-xl border border-slate-100 bg-slate-50/60 p-2 sm:p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={groupedLeaders[tier]}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <YAxis
                      type="category"
                      dataKey="alias"
                      width={88}
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <Tooltip
                      formatter={(value) => [`${value} reps`, "Progress"]}
                    />
                    <Bar
                      dataKey="totalAmount"
                      fill="#2563eb"
                      radius={[0, 5, 5, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

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
