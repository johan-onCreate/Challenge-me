import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [challengeTitle, setChallengeTitle] = useState<string>("");

  useEffect(() => {
    async function fetchLeaderboardData() {
      // 1. Hämta den aktiva utmaningen
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

      // 2. Hämta ALLA registrerade profiler för att matcha alias
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, alias, full_name");

      // 3. Hämta ALLA valda nivåer (tiers) från användar-utmaningar
      const { data: userChallenges } = await supabase
        .from("user_challenges")
        .select("user_id, chosen_tier")
        .eq("challenge_id", activeChallenge.id);

      // 4. Hämta ALLA loggar för den här specifika utmaningen
      const { data: logs } = await supabase
        .from("challenge_logs")
        .select("user_id, amount")
        .eq("challenge_id", activeChallenge.id);

      if (profiles && logs) {
        // Skapa en mappning för snabb tillgång till profil- och nivådata
        const profileMap = new Map(profiles.map((p) => [p.id, p]));
        const tierMap = new Map(
          userChallenges?.map((uc) => [uc.user_id, uc.chosen_tier]) || [],
        );

        // Gruppera och räkna ihop reps per användare
        const userTotals: { [key: string]: number } = {};
        logs.forEach((log) => {
          userTotals[log.user_id] = (userTotals[log.user_id] || 0) + log.amount;
        });

        // Bygg ihop slutgiltiga topplistan
        const leaderboardData: LeaderboardUser[] = Object.keys(userTotals).map(
          (userId) => {
            const prof = profileMap.get(userId);
            return {
              alias: prof?.alias || "Anonym koder",
              fullName: prof?.full_name || "Okänt namn",
              totalAmount: userTotals[userId],
              chosenTier: tierMap.get(userId) || "Ej vald",
            };
          },
        );

        // Sortera listan så att flest reps hamnar högst upp
        leaderboardData.sort((a, b) => b.totalAmount - a.totalAmount);
        setLeaders(leaderboardData);
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

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center sm:text-left">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Topplista
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Ställningen just nu i utmaningen:{" "}
          <span className="font-semibold text-slate-800">
            {challengeTitle || "Ingen aktiv"}
          </span>
        </p>
      </div>

      {leaders.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Ingen har loggat några framsteg i den här utmaningen än. Bli den
          första!
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                <th className="py-3 px-4 w-12 text-center">Plats</th>
                <th className="py-3 px-4">Deltagare</th>
                <th className="py-3 px-4">Mål</th>
                <th className="py-3 px-4 text-right">Totalt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {leaders.map((leader, index) => {
                const isTop3 = index < 3;
                const medalEmojis = ["🥇", "🥈", "🥉"];

                return (
                  <tr
                    key={index}
                    className={`hover:bg-slate-50/60 transition-colors ${index === 0 ? "bg-amber-50/20" : ""}`}
                  >
                    {/* Placerings-kolumn */}
                    <td className="py-4 px-4 font-bold text-center text-slate-500">
                      {isTop3 ? (
                        <span className="text-lg">{medalEmojis[index]}</span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </td>
                    {/* Alias-kolumn */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">
                        {leader.alias}
                      </div>
                      <div className="text-xs text-slate-400">
                        {leader.fullName}
                      </div>
                    </td>
                    {/* Mål-kolumn */}
                    <td className="py-4 px-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {leader.chosenTier}
                      </span>
                    </td>
                    {/* Totalt-kolumn */}
                    <td className="py-4 px-4 text-right font-extrabold text-slate-900 text-base">
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
      )}
    </div>
  );
}

export default Leaderboard;
