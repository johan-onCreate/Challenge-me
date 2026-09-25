import { useState, FormEvent, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

interface Challenge {
  id: number;
  title: string;
  description: string;
  points: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  tiers?: string[];
}

interface LogEntry {
  id: number;
  amount: number;
  logged_at: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Profile() {
  const [fullName, setFullName] = useState<string>("");
  const [alias, setAlias] = useState<string>("");
  const [profileMessage, setProfileMessage] = useState<string>("");
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(
    null,
  );
  const [isCurrentCompleted, setIsCurrentCompleted] = useState<boolean>(false);
  const [chosenTier, setChosenTier] = useState<string>("");
  const [savedTier, setSavedTier] = useState<string>("");
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [loadingChallenge, setLoadingChallenge] = useState<boolean>(true);

  // States för daglig loggning & Kalender
  const [logAmount, setLogAmount] = useState<string>("");
  const [logDate, setLogDate] = useState<string>(""); // Sparar valt datum från kalendern
  const [totalLoggedAmount, setTotalLoggedAmount] = useState<number>(0);
  const [dailyLogs, setDailyLogs] = useState<LogEntry[]>([]);

  // Hämta logg-historik
  const fetchChallengeLogs = async (userId: string, challengeId: number) => {
    const { data: logs } = await supabase
      .from("challenge_logs")
      .select("id, amount, logged_at")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .order("logged_at", { ascending: false });

    if (logs) {
      setDailyLogs(logs);
      const total = logs.reduce((sum, item) => sum + item.amount, 0);
      setTotalLoggedAmount(total);
    }
  };

  useEffect(() => {
    async function getProfileAndChallenge() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, alias")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        setFullName(profile.full_name || "");
        setAlias(profile.alias || "");
      }

      const nowIso = new Date().toISOString();
      const { data: activeChallenge } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", nowIso)
        .gte("end_date", nowIso)
        .maybeSingle();

      if (activeChallenge) {
        setCurrentChallenge(activeChallenge);

        // Sätt kalenderns standarddatum till IDAG, men formaterat som YYYY-MM-DD
        setLogDate(new Date().toISOString().split("T")[0]);

        const { data: completedCheck } = await supabase
          .from("user_challenges")
          .select("id, chosen_tier")
          .eq("user_id", user.id)
          .eq("challenge_id", activeChallenge.id)
          .maybeSingle();

        if (completedCheck) {
          setIsCurrentCompleted(true);
          setSavedTier(completedCheck.chosen_tier || "");
          fetchChallengeLogs(user.id, activeChallenge.id);
        }
      }

      const { data: allUserChallenges } = await supabase
        .from("user_challenges")
        .select("challenges(points)")
        .eq("user_id", user.id);
      if (allUserChallenges) {
        const points = allUserChallenges.reduce(
          (sum: number, item: any) => sum + (item.challenges?.points || 0),
          0,
        );
        setTotalPoints(points);
      }
      setLoadingChallenge(false);
    }
    getProfileAndChallenge();
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        alias: alias,
        updated_at: new Date().toISOString(),
      });
    setProfileMessage("✨ Profilen har sparats!");
    setProfileLoading(false);
  };

  const handleStartChallenge = async () => {
    if (!currentChallenge) return;
    if (
      currentChallenge.tiers &&
      currentChallenge.tiers.length > 0 &&
      !chosenTier
    ) {
      alert("Vänligen välj en nivå innan du startar!");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_challenges")
      .insert([
        {
          user_id: user.id,
          challenge_id: currentChallenge.id,
          chosen_tier: chosenTier,
        },
      ]);

    if (!error) {
      setIsCurrentCompleted(true);
      setSavedTier(chosenTier);
    }
  };

  const handleLogDailyProgress = async (e: FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(logAmount);
    if (isNaN(amountNum) || amountNum <= 0 || !logDate) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !currentChallenge) return;

    const { error } = await supabase.from("challenge_logs").insert([
      {
        user_id: user.id,
        challenge_id: currentChallenge.id,
        amount: amountNum,
        logged_at: logDate, // Sparar det valda datumet från kalendern
      },
    ]);

    if (error) {
      alert(error.message);
    } else {
      setLogAmount("");
      fetchChallengeLogs(user.id, currentChallenge.id);
    }
  };
  const targetNumber = parseInt(savedTier) || 0;
  const progressPercent =
    targetNumber > 0
      ? Math.min(Math.round((totalLoggedAmount / targetNumber) * 100), 100)
      : 0;

  // Formatera start- och slutdatum för HTML5 kalendern (kräver YYYY-MM-DD)
  const minDate = currentChallenge?.start_date
    ? currentChallenge.start_date.split("T")[0]
    : "";
  const maxDate = currentChallenge?.end_date
    ? currentChallenge.end_date.split("T")[0]
    : "";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Total XP Scoreboard */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Din totala poäng
          </p>
          <h3 className="text-3xl font-extrabold text-amber-400 mt-1">
            {totalPoints} XP
          </h3>
        </div>
      </div>

      {/* Aktuell utmaning */}
      <div className="space-y-4 border-t border-slate-100 pt-6">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          Aktuell utmaning
        </h3>

        {loadingChallenge ? (
          <p className="text-sm text-slate-400 animate-pulse">
            Hämtar utmaning...
          </p>
        ) : !currentChallenge ? (
          <p className="text-sm text-slate-500 italic">
            Ingen aktiv utmaning just nu.
          </p>
        ) : (
          <div className="p-5 border rounded-2xl bg-white border-slate-200 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-slate-900">
                  {currentChallenge.title}
                </h4>
                <span className="text-xs px-2.5 py-0.5 font-bold rounded-full bg-amber-100 text-amber-800">
                  +{currentChallenge.points} XP
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {currentChallenge.description}
              </p>
            </div>

            {/* VÄLJ NIVÅ */}
            {!isCurrentCompleted &&
              currentChallenge.tiers &&
              currentChallenge.tiers.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Välj din målsättning:
                  </label>
                  <div className="flex gap-4">
                    {currentChallenge.tiers.map((t, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="tier"
                          value={t}
                          checked={chosenTier === t}
                          onChange={(e) => setChosenTier(e.target.value)}
                          className="text-blue-600"
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleStartChallenge}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-sm transition-colors"
                  >
                    Anta utmaningen!
                  </button>
                </div>
              )}

            {/* PROGRESS MÄTARE & KALENDERINMATNING */}
            {isCurrentCompleted && (
              <div className="space-y-5 border-t border-slate-100 pt-4">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600 uppercase">
                    <span>
                      Framsteg: {totalLoggedAmount} / {savedTier}
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Tidsstyrd Loggning med Kalender */}
                <form
                  onSubmit={handleLogDailyProgress}
                  className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100"
                >
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Logga aktivitet
                  </span>

                  {/* Grid-layout: Staplas på mobil (1 kolumn), blir 3 kolumner på datorer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="date"
                      value={logDate}
                      min={minDate}
                      max={maxDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-blue-600 text-slate-700 font-medium shadow-sm"
                    />
                    <input
                      type="number"
                      value={logAmount}
                      onChange={(e) => setLogAmount(e.target.value)}
                      placeholder="Antal (t.ex. 50)"
                      required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-blue-600 shadow-sm"
                    />
                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
                    >
                      Logga reps
                    </button>
                  </div>
                </form>

                {/* Loggar och historik */}
                {dailyLogs.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Dina registrerade loggar
                    </label>
                    <div className="max-h-28 overflow-y-auto space-y-1 border border-slate-100 rounded-lg p-2 bg-white shadow-inner">
                      {dailyLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex justify-between text-xs text-slate-600 border-b border-slate-100/60 pb-1 last:border-0 last:pb-0"
                        >
                          <span className="font-medium">
                            🗓️ {log.logged_at}
                          </span>
                          <span className="font-bold text-slate-800">
                            +{log.amount} reps
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profilinställningar */}
      <div className="space-y-4 border-t border-slate-100 pt-6">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          Profilinställningar
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              placeholder="Namn"
            />
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              placeholder="Alias"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-xl text-xs"
          >
            Spara profil
          </button>
        </form>
        {profileMessage && (
          <div className="p-3 text-xs bg-emerald-50 text-emerald-800 rounded-xl font-medium">
            {profileMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
