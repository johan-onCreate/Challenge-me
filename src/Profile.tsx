import { useState, FormEvent, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  calculateEarnedPoints,
  calculateProgressPercent,
  canChangeTier,
} from "./profileUtils";
import { getChallengeDates, getIsoWeekNumber } from "./calendarUtils";
import { toLocalDateKey as toTodayKey, toDateKey } from "./statsUtils";
import { buildChallengeState, type Achievement } from "./achievements";
import { syncOwnAchievements } from "./useAchievementSync";
import { UnlockCelebration } from "./components/UnlockCelebration";

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

interface HistoricalChallenge {
  challengeId: number;
  title: string;
  description: string;
  points: number;
  chosenTier: string;
  completedAt: string;
  totalAmount: number;
  earnedPoints: number;
  placement: number | null;
  participantCount: number;
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
  const [tierMessage, setTierMessage] = useState<string>("");
  const [tierLoading, setTierLoading] = useState<boolean>(false);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [historicalChallenges, setHistoricalChallenges] = useState<
    HistoricalChallenge[]
  >([]);
  const [loadingChallenge, setLoadingChallenge] = useState<boolean>(true);

  // States för daglig loggning
  const [logAmount, setLogAmount] = useState<string>("");
  const [logDate, setLogDate] = useState<string>("");
  const [totalLoggedAmount, setTotalLoggedAmount] = useState<number>(0);
  const [dailyLogs, setDailyLogs] = useState<LogEntry[]>([]);

  // States för att redigera en rad live i listan
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>("");
  const [editingCalendarDate, setEditingCalendarDate] = useState<string | null>(
    null,
  );
  const [editingCalendarAmount, setEditingCalendarAmount] =
    useState<string>("");
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [cancelPhrase, setCancelPhrase] = useState<string>("");
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [cancelMessage, setCancelMessage] = useState<string>("");

  // States för prisupplåsningar (confetti-kön)
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const clearCelebration = useCallback(() => setNewlyUnlocked([]), []);

  const syncAchievementsAfterLogs = async (
    userId: string,
    logs: LogEntry[],
  ) => {
    if (!currentChallenge) return;
    try {
      const dayTotals = new Map<string, number>();
      logs.forEach((log) => {
        const day = toDateKey(String(log.logged_at));
        dayTotals.set(day, (dayTotals.get(day) ?? 0) + log.amount);
      });
      const state = buildChallengeState({
        challengeId: currentChallenge.id,
        startKey: toDateKey(currentChallenge.start_date),
        endKey: toDateKey(currentChallenge.end_date),
        todayKey: toTodayKey(new Date()),
        userId,
        userDayTotals: dayTotals,
        chosenTier: savedTier,
        points: currentChallenge.points,
        // Snabbspår utan tier-gruppsdata — tävlingsbadgar samordnas
        // på prisväggen (fullt spår)
        tierParticipants: [],
      });
      const { newlyUnlocked: fresh } = await syncOwnAchievements(
        userId,
        currentChallenge.id,
        state,
      );
      if (fresh.length > 0) {
        setNewlyUnlocked((prev) => [...prev, ...fresh]);
      }
    } catch {
      // Priser får aldrig skada loggningen — misslyckande ignoreras
    }
  };

  const fetchChallengeLogs = async (
    userId: string,
    challengeId: number,
    celebrate = false,
  ) => {
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
      if (celebrate) {
        void syncAchievementsAfterLogs(userId, logs);
      }
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
        setLogDate(new Date().toISOString().split("T")[0]);

        const { data: completedCheck } = await supabase
          .from("user_challenges")
          .select("id, chosen_tier")
          .eq("user_id", user.id)
          .eq("challenge_id", activeChallenge.id)
          .maybeSingle();

        if (completedCheck) {
          setIsCurrentCompleted(true);
          const selectedTier = completedCheck.chosen_tier || "";
          setChosenTier(selectedTier);
          setSavedTier(selectedTier);
          fetchChallengeLogs(user.id, activeChallenge.id);
        }
      }

      const { data: allUserChallenges } = await supabase
        .from("user_challenges")
        .select("id, challenge_id, chosen_tier, completed_at")
        .eq("user_id", user.id);
      const { data: challengeRows } = await supabase
        .from("challenges")
        .select("id, title, description, points");
      const challengeById = new Map(
        (challengeRows || []).map((challenge) => [challenge.id, challenge]),
      );
      const { data: userChallengeLogs } = await supabase
        .from("challenge_logs")
        .select("challenge_id, amount")
        .eq("user_id", user.id);
      const totalsByChallenge = new Map<number, number>();
      userChallengeLogs?.forEach((log) => {
        totalsByChallenge.set(
          log.challenge_id,
          (totalsByChallenge.get(log.challenge_id) || 0) + log.amount,
        );
      });
      const { data: allParticipants } = await supabase
        .from("user_challenges")
        .select("user_id, challenge_id, chosen_tier");
      const { data: allChallengeLogs } = await supabase
        .from("challenge_logs")
        .select("user_id, challenge_id, amount");
      const totalsByParticipant = new Map<string, number>();
      allChallengeLogs?.forEach((log) => {
        const key = `${log.challenge_id}:${log.user_id}`;
        totalsByParticipant.set(
          key,
          (totalsByParticipant.get(key) || 0) + log.amount,
        );
      });
      const participantsByGroup = new Map<
        string,
        Array<{ userId: string; totalAmount: number }>
      >();
      allParticipants?.forEach((participant) => {
        const groupKey = `${participant.challenge_id}:${participant.chosen_tier || "Ej vald"}`;
        const participants = participantsByGroup.get(groupKey) || [];
        participants.push({
          userId: participant.user_id,
          totalAmount:
            totalsByParticipant.get(
              `${participant.challenge_id}:${participant.user_id}`,
            ) || 0,
        });
        participantsByGroup.set(groupKey, participants);
      });
      if (allUserChallenges) {
        const points = allUserChallenges.reduce((sum: number, item: any) => {
          const challenge = challengeById.get(item.challenge_id);
          const totalAmount = totalsByChallenge.get(item.challenge_id) || 0;
          return (
            sum +
            calculateEarnedPoints(
              totalAmount,
              item.chosen_tier || "",
              challenge?.points || 0,
            )
          );
        }, 0);
        setTotalPoints(points);

        const previousChallenges = allUserChallenges.flatMap((item: any) => {
          const challenge = challengeById.get(item.challenge_id);

          if (!challenge || challenge.id === activeChallenge?.id) return [];

          const groupKey = `${challenge.id}:${item.chosen_tier || "Ej vald"}`;
          const rankedParticipants = (
            participantsByGroup.get(groupKey) || []
          ).sort((a, b) => b.totalAmount - a.totalAmount);
          const currentPlacement = rankedParticipants.findIndex(
            (participant) => participant.userId === user.id,
          );

          return [
            {
              challengeId: challenge.id,
              title: challenge.title,
              description: challenge.description,
              points: challenge.points,
              chosenTier: item.chosen_tier || "Ej vald",
              completedAt: item.completed_at,
              totalAmount: totalsByChallenge.get(challenge.id) || 0,
              earnedPoints: calculateEarnedPoints(
                totalsByChallenge.get(challenge.id) || 0,
                item.chosen_tier || "",
                challenge.points,
              ),
              placement: currentPlacement >= 0 ? currentPlacement + 1 : null,
              participantCount: rankedParticipants.length,
            },
          ];
        });

        setHistoricalChallenges(
          previousChallenges.sort(
            (a: HistoricalChallenge, b: HistoricalChallenge) =>
              new Date(b.completedAt).getTime() -
              new Date(a.completedAt).getTime(),
          ),
        );
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
    await supabase.from("profiles").upsert({
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

    const { error } = await supabase.from("user_challenges").insert([
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

  const handleCancelChallenge = async () => {
    const normalizedPhrase = cancelPhrase.trim().toLocaleLowerCase("sv-SE");
    if (normalizedPhrase !== "jag skäms" || !currentChallenge) return;

    setCancelLoading(true);
    setCancelMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: logsError } = await supabase
      .from("challenge_logs")
      .delete()
      .eq("user_id", user.id)
      .eq("challenge_id", currentChallenge.id);

    if (logsError) {
      setCancelMessage(`Fel: ${logsError.message}`);
      setCancelLoading(false);
      return;
    }

    const { error: challengeError } = await supabase
      .from("user_challenges")
      .delete()
      .eq("user_id", user.id)
      .eq("challenge_id", currentChallenge.id);

    if (challengeError) {
      setCancelMessage(`Fel: ${challengeError.message}`);
    } else {
      setIsCurrentCompleted(false);
      setChosenTier("");
      setSavedTier("");
      setDailyLogs([]);
      setTotalLoggedAmount(0);
      setTotalPoints((points) =>
        Math.max(
          0,
          points -
            calculateEarnedPoints(
              totalLoggedAmount,
              savedTier,
              currentChallenge.points,
            ),
        ),
      );
      setCancelPhrase("");
      setShowCancelDialog(false);
    }
    setCancelLoading(false);
  };

  const handleChangeTier = async () => {
    if (
      !currentChallenge ||
      !canChangeTier(chosenTier, savedTier, currentChallenge.tiers || [])
    ) {
      return;
    }

    setTierLoading(true);
    setTierMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_challenges")
      .update({ chosen_tier: chosenTier })
      .eq("user_id", user.id)
      .eq("challenge_id", currentChallenge.id);

    if (error) {
      setTierMessage(`Fel: ${error.message}`);
    } else {
      setSavedTier(chosenTier);
      setTierMessage("Nivån har uppdaterats!");
    }
    setTierLoading(false);
  };

  const handleLogDailyProgress = async (e: FormEvent) => {
    e.preventDefault();
    if (!isCurrentCompleted || !currentChallenge) return;

    const amountNum = parseInt(logAmount);
    if (isNaN(amountNum) || amountNum <= 0 || !logDate) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !currentChallenge) return;

    const { data: existingLog } = await supabase
      .from("challenge_logs")
      .select("amount")
      .eq("user_id", user.id)
      .eq("challenge_id", currentChallenge.id)
      .eq("logged_at", logDate)
      .maybeSingle();

    const newAmount = existingLog ? existingLog.amount + amountNum : amountNum;

    const { error } = await supabase.from("challenge_logs").upsert(
      {
        user_id: user.id,
        challenge_id: currentChallenge.id,
        amount: newAmount,
        logged_at: logDate,
      },
      { onConflict: "user_id,challenge_id,logged_at" },
    );

    if (!error) {
      setLogAmount("");
      fetchChallengeLogs(user.id, currentChallenge.id, true);
    }
  };

  // NYTT: Spara en ändrad historisk logg
  const handleUpdateLog = async (logId: number) => {
    if (!isCurrentCompleted || !currentChallenge) return;

    const amountNum = parseInt(editingAmount);
    if (isNaN(amountNum) || amountNum < 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !currentChallenge) return;

    // Om admin ändrar till 0, ta bort raden istället
    if (amountNum === 0) {
      handleDeleteLog(logId);
      return;
    }

    const { error } = await supabase
      .from("challenge_logs")
      .update({ amount: amountNum })
      .eq("id", logId);

    if (!error) {
      setEditingLogId(null);
      fetchChallengeLogs(user.id, currentChallenge.id, true);
    }
  };

  const handleUpdateCalendarLog = async () => {
    if (!isCurrentCompleted || !editingCalendarDate || !currentChallenge) {
      return;
    }

    const amountNum = parseInt(editingCalendarAmount, 10);
    if (isNaN(amountNum) || amountNum < 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const existingLog = dailyLogs.find(
      (log) => log.logged_at === editingCalendarDate,
    );
    const query = existingLog
      ? amountNum === 0
        ? supabase.from("challenge_logs").delete().eq("id", existingLog.id)
        : supabase
            .from("challenge_logs")
            .update({ amount: amountNum })
            .eq("id", existingLog.id)
      : supabase.from("challenge_logs").insert({
          user_id: user.id,
          challenge_id: currentChallenge.id,
          amount: amountNum,
          logged_at: editingCalendarDate,
        });

    const { error } = await query;
    if (!error) {
      setEditingCalendarDate(null);
      setEditingCalendarAmount("");
      fetchChallengeLogs(user.id, currentChallenge.id, true);
    }
  };

  // NYTT: Radera en historisk logg helt
  const handleDeleteLog = async (logId: number) => {
    if (!isCurrentCompleted || !currentChallenge) return;

    if (!window.confirm("Vill du ta bort denna loggning permanent?")) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !currentChallenge) return;

    const { error } = await supabase
      .from("challenge_logs")
      .delete()
      .eq("id", logId);

    if (!error) {
      fetchChallengeLogs(user.id, currentChallenge.id, true);
    }
  };
  const progressPercent = calculateProgressPercent(
    totalLoggedAmount,
    savedTier,
  );

  const minDate = currentChallenge?.start_date
    ? currentChallenge.start_date.split("T")[0]
    : "";
  const maxDate = currentChallenge?.end_date
    ? currentChallenge.end_date.split("T")[0]
    : "";
  const availableTiers = currentChallenge?.tiers || [];
  const savedTierUnavailable =
    isCurrentCompleted &&
    savedTier !== "" &&
    !availableTiers.includes(savedTier);
  const loggedAmountByDate = new Map(
    dailyLogs.map((log) => [log.logged_at, log.amount]),
  );
  const toLocalDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const challengeDates =
    minDate && maxDate ? getChallengeDates(minDate, maxDate) : [];
  const calendarStartOffset = minDate
    ? new Date(`${minDate}T00:00:00`).getDay()
    : 0;
  const calendarCells: Array<string | null> = [
    ...Array.from({ length: calendarStartOffset }, () => null),
    ...challengeDates,
  ];
  const calendarGridCells: Array<
    | { type: "week"; weekNumber: number | null }
    | { type: "day"; date: string | null }
  > = [];
  for (let index = 0; index < calendarCells.length; index += 7) {
    const weekDays = calendarCells.slice(index, index + 7);
    const firstDate = weekDays.find((date): date is string => Boolean(date));
    calendarGridCells.push({
      type: "week",
      weekNumber: firstDate ? getIsoWeekNumber(firstDate) : null,
    });
    weekDays.forEach((date) => calendarGridCells.push({ type: "day", date }));
  }
  const calendarMonthLabel =
    minDate && maxDate
      ? `${new Date(`${minDate}T00:00:00`).toLocaleDateString("sv-SE", { month: "long", year: "numeric" })} – ${new Date(`${maxDate}T00:00:00`).toLocaleDateString("sv-SE", { month: "long", year: "numeric" })}`
      : "";
  const todayDate = toLocalDateKey(new Date());

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
      <div className="space-y-4 border-t border-outline-soft pt-6">
        <h3 className="text-lg font-bold text-content tracking-tight">
          Aktuell utmaning
        </h3>

        {loadingChallenge ? (
          <p className="text-sm text-content-fainter animate-pulse">
            Hämtar utmaning...
          </p>
        ) : !currentChallenge ? (
          <p className="text-sm text-content-faint italic">
            Ingen aktiv utmaning just nu.
          </p>
        ) : (
          <div className="p-5 border rounded-2xl bg-raised border-outline shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-content">
                  {currentChallenge.title}
                </h4>
                <span className="text-xs px-2.5 py-0.5 font-bold rounded-full bg-warning-soft text-warning-soft-text">
                  +
                  {calculateEarnedPoints(
                    totalLoggedAmount,
                    savedTier,
                    currentChallenge.points,
                  )}{" "}
                  / {currentChallenge.points} XP
                </span>
              </div>
              <p className="text-sm text-content-muted mt-1">
                {currentChallenge.description}
              </p>
            </div>

            {/* VÄLJ NIVÅ */}
            {!isCurrentCompleted &&
              currentChallenge.tiers &&
              currentChallenge.tiers.length > 0 && (
                <div className="bg-inset p-4 rounded-xl border border-outline-soft space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-content-muted">
                    Välj din målsättning:
                  </label>
                  <div className="flex gap-4">
                    {currentChallenge.tiers.map((t, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-1.5 text-sm font-medium text-content-secondary cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="tier"
                          value={t}
                          checked={chosenTier === t}
                          onChange={(e) => setChosenTier(e.target.value)}
                          className="text-accent"
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleStartChallenge}
                    className="w-full mt-2 bg-accent hover:bg-accent-hover text-white font-semibold py-2 rounded-xl text-sm transition-colors"
                  >
                    Anta utmaningen!
                  </button>
                </div>
              )}

            {/* PROGRESS MÄTARE & LOGGNING */}
            {isCurrentCompleted && (
              <div className="space-y-5 border-t border-outline-soft pt-4">
                {savedTierUnavailable && (
                  <div className="p-4 rounded-xl border border-warning-soft-border bg-warning-soft text-warning-soft-text space-y-1">
                    <p className="text-sm font-bold">
                      Din valda nivå har tagits bort
                    </p>
                    <p className="text-xs">
                      Nivån <strong>{savedTier}</strong> finns inte längre i den
                      här utmaningen.{" "}
                      {availableTiers.length > 0
                        ? "Välj en ny nivå nedan för att fortsätta logga progress."
                        : "Admin måste lägga till en ny nivå innan du kan fortsätta."}
                    </p>
                  </div>
                )}

                {challengeDates.length > 0 && (
                  <div className="hidden space-y-3 bg-inset p-4 rounded-xl border border-outline-soft">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                        Kalender
                      </span>
                      <span className="text-[11px] text-content-faint">
                        Klicka på en dag för att logga aktivitet
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-content-fainter">
                      {["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"].map(
                        (day) => (
                          <span key={day}>{day}</span>
                        ),
                      )}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarCells.map((date, index) => {
                        if (!date) {
                          return (
                            <div key={`empty-${index}`} className="min-h-14" />
                          );
                        }

                        const loggedAmount = loggedAmountByDate.get(date) || 0;
                        const isToday = date === todayDate;
                        const isFuture = date > todayDate;
                        const dayNumber = Number(date.slice(8, 10));

                        if (editingCalendarDate === date) {
                          return (
                            <div
                              key={date}
                              className="min-h-14 rounded-lg border border-accent-soft-border bg-accent-soft p-1"
                            >
                              <span className="block text-xs font-bold text-accent-soft-text">
                                {dayNumber}
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={editingCalendarAmount}
                                onChange={(event) =>
                                  setEditingCalendarAmount(event.target.value)
                                }
                                className="w-full rounded border border-accent-soft-border px-1 py-0.5 text-[10px] text-content"
                                autoFocus
                              />
                              <div className="mt-1 flex gap-1">
                                <button
                                  type="button"
                                  onClick={handleUpdateCalendarLog}
                                  className="flex-1 rounded bg-success-strong px-1 py-0.5 text-[10px] font-bold text-white"
                                >
                                  Spara
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCalendarDate(null)}
                                  className="rounded bg-raised px-1 py-0.5 text-[10px] font-bold text-content-faint"
                                >
                                  X
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={date}
                            type="button"
                            disabled={isFuture}
                            onClick={() => {
                              setLogDate(date);
                              setEditingCalendarDate(date);
                              setEditingCalendarAmount(
                                loggedAmount > 0 ? String(loggedAmount) : "",
                              );
                            }}
                            className={`min-h-14 rounded-lg border p-1 text-left transition-colors ${
                              loggedAmount > 0
                                ? "border-success-soft-border bg-success-soft text-success-soft-text"
                                : isToday
                                  ? "border-accent-soft-border bg-accent-soft text-accent-soft-text"
                                  : isFuture
                                    ? "border-outline-soft bg-raised text-content-fainter"
                                    : "border-outline bg-raised text-content-muted hover:border-accent-soft-border hover:bg-accent-soft"
                            } disabled:cursor-not-allowed`}
                            title={`${date}${loggedAmount > 0 ? `: ${loggedAmount} reps` : ": lägg till reps"}`}
                          >
                            <span className="block text-xs font-bold">
                              {dayNumber}
                            </span>
                            {loggedAmount > 0 && (
                              <span className="block truncate text-[10px] font-semibold">
                                {loggedAmount} reps
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-content-faint">
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-sm bg-success-soft-border" />
                        Loggad
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-sm bg-accent-soft-border" />
                        Idag
                      </span>
                    </div>
                  </div>
                )}

                {currentChallenge.tiers &&
                  currentChallenge.tiers.length > 0 && (
                    <div className="bg-inset p-4 rounded-xl border border-outline-soft space-y-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-content-muted">
                        Ändra nivå
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {currentChallenge.tiers.map((tier, index) => (
                          <label
                            key={index}
                            className="flex items-center gap-1.5 text-sm font-medium text-content-secondary cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="saved-tier"
                              value={tier}
                              checked={chosenTier === tier}
                              onChange={(e) => {
                                setChosenTier(e.target.value);
                                setTierMessage("");
                              }}
                              className="text-accent"
                            />
                            {tier}
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleChangeTier}
                        disabled={tierLoading || chosenTier === savedTier}
                        className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-2 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {tierLoading ? "Sparar..." : "Spara ny nivå"}
                      </button>
                      {tierMessage && (
                        <p
                          className={`text-xs font-medium ${tierMessage.startsWith("Fel") ? "text-danger" : "text-success-strong"}`}
                        >
                          {tierMessage}
                        </p>
                      )}
                    </div>
                  )}

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-content-muted uppercase">
                    <span>
                      Framsteg: {totalLoggedAmount} / {savedTier}
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-inset h-3 rounded-full overflow-hidden border border-outline/50">
                    <div
                      className="bg-success h-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Loggningsformulär */}
                <form
                  onSubmit={handleLogDailyProgress}
                  className="space-y-3 bg-inset p-4 rounded-xl border border-outline-soft"
                >
                  <span className="block text-xs font-bold uppercase tracking-wider text-content-muted">
                    Logga aktivitet
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="date"
                      value={logDate}
                      min={minDate}
                      max={maxDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-outline rounded-xl text-sm bg-raised"
                    />
                    <input
                      type="number"
                      value={logAmount}
                      onChange={(e) => setLogAmount(e.target.value)}
                      placeholder="Antal reps"
                      required
                      className="w-full px-3 py-2 border border-outline rounded-xl text-sm bg-raised"
                    />
                    <button
                      type="submit"
                      className="w-full bg-btn hover:bg-btn-hover text-on-btn font-semibold py-2 rounded-xl text-sm transition-colors"
                    >
                      Logga reps
                    </button>
                  </div>
                </form>

                {/* HISTORIK MED REDIGERINGSFUNKTIONER */}
                {dailyLogs.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-content-faint">
                      Dina registrerade loggar
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 border border-outline-soft rounded-xl p-2 bg-inset/50">
                      {dailyLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex justify-between items-center text-xs text-content-muted bg-raised p-2 rounded-lg border border-outline/40 shadow-sm"
                        >
                          {/* Om raden är i redigeringsläge, visa input, annars text */}
                          {editingLogId === log.id ? (
                            <div className="flex gap-2 items-center flex-1">
                              <span className="font-semibold text-content-faint">
                                📅 {log.logged_at}:
                              </span>
                              <input
                                type="number"
                                value={editingAmount}
                                onChange={(e) =>
                                  setEditingAmount(e.target.value)
                                }
                                className="w-20 px-2 py-1 border border-outline rounded-md text-content"
                              />
                              <button
                                onClick={() => handleUpdateLog(log.id)}
                                className="bg-success-strong text-white px-2 py-1 rounded-md font-medium"
                              >
                                Spara
                              </button>
                              <button
                                onClick={() => setEditingLogId(null)}
                                className="text-content-fainter hover:text-content-muted"
                              >
                                Avbryt
                              </button>
                            </div>
                          ) : (
                            <>
                              <span>
                                📅{" "}
                                <strong className="font-medium text-content-secondary">
                                  {log.logged_at}
                                </strong>
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-content">
                                  {log.amount} reps
                                </span>

                                {/* Ändra-knapp */}
                                <button
                                  onClick={() => {
                                    setEditingLogId(log.id);
                                    setEditingAmount(String(log.amount));
                                  }}
                                  className="text-accent hover:text-accent-hover font-medium"
                                >
                                  Ändra
                                </button>

                                {/* Radera-knapp */}
                                <button
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="text-danger hover:text-danger-strong font-medium"
                                >
                                  Ta bort
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCancelMessage("");
                    setCancelPhrase("");
                    setShowCancelDialog(true);
                  }}
                  className="w-full border border-danger-soft-border bg-danger-soft text-danger hover:bg-danger-soft-border font-semibold py-2 rounded-xl text-sm transition-colors"
                >
                  Avbryt challenge
                </button>
              </div>
            )}

            {challengeDates.length > 0 && (
              <div className="space-y-3 bg-inset p-4 rounded-xl border border-outline-soft">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                    Kalender
                    <span className="ml-2 font-medium normal-case text-content-faint">
                      {calendarMonthLabel}
                    </span>
                  </span>
                  <span className="text-[11px] text-content-faint">
                    Klicka på en dag för att logga aktivitet
                  </span>
                </div>
                <div className="grid grid-cols-8 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-content-fainter">
                  <span>V</span>
                  {["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"].map(
                    (day) => (
                      <span key={day}>{day}</span>
                    ),
                  )}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {calendarGridCells.map((cell, index) => {
                    if (cell.type === "week") {
                      return (
                        <div
                          key={`week-${index}`}
                          className="flex min-h-14 items-center justify-center rounded-lg bg-inset text-[10px] font-bold text-content-faint"
                        >
                          {cell.weekNumber ? `V${cell.weekNumber}` : ""}
                        </div>
                      );
                    }

                    const date = cell.date;
                    if (!date) {
                      return (
                        <div key={`empty-${index}`} className="min-h-14" />
                      );
                    }

                    const loggedAmount = loggedAmountByDate.get(date) || 0;
                    const isToday = date === todayDate;
                    const isFuture = date > todayDate;
                    const dayNumber = Number(date.slice(8, 10));
                    const isFirstOfMonth = date.slice(8, 10) === "01";
                    const monthLabel = isFirstOfMonth
                      ? new Date(`${date}T00:00:00`).toLocaleDateString(
                          "sv-SE",
                          { month: "short" },
                        )
                      : "";

                    if (editingCalendarDate === date) {
                      return (
                        <div
                          key={date}
                          className="min-h-14 rounded-lg border border-accent-soft-border bg-accent-soft p-1"
                        >
                          {monthLabel && (
                            <span className="block truncate text-[9px] font-bold capitalize text-accent-soft-text">
                              {monthLabel}
                            </span>
                          )}
                          <span className="block text-xs font-bold text-accent-soft-text">
                            {dayNumber}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={editingCalendarAmount}
                            onChange={(event) =>
                              setEditingCalendarAmount(event.target.value)
                            }
                            className="w-full rounded border border-accent-soft-border px-1 py-0.5 text-[10px] text-content"
                            autoFocus
                          />
                          <div className="mt-1 flex gap-1">
                            <button
                              type="button"
                              onClick={handleUpdateCalendarLog}
                              className="flex-1 rounded bg-success-strong px-1 py-0.5 text-[10px] font-bold text-white"
                            >
                              Spara
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCalendarDate(null)}
                              className="rounded bg-raised px-1 py-0.5 text-[10px] font-bold text-content-faint"
                            >
                              X
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={date}
                        type="button"
                        disabled={isFuture}
                        onClick={() => {
                          setLogDate(date);
                          setEditingCalendarDate(date);
                          setEditingCalendarAmount(
                            loggedAmount > 0 ? String(loggedAmount) : "",
                          );
                        }}
                        className={`min-h-14 rounded-lg border p-1 text-left transition-colors ${
                          loggedAmount > 0
                            ? "border-success-soft-border bg-success-soft text-success-soft-text"
                            : isToday
                              ? "border-accent-soft-border bg-accent-soft text-accent-soft-text"
                              : isFuture
                                ? "border-outline-soft bg-raised text-content-fainter"
                                : "border-outline bg-raised text-content-muted hover:border-accent-soft-border hover:bg-accent-soft"
                        } disabled:cursor-not-allowed`}
                        title={`${date}${loggedAmount > 0 ? `: ${loggedAmount} reps` : ": lägg till reps"}`}
                      >
                        {monthLabel && (
                          <span className="block truncate text-[9px] font-bold capitalize text-content-faint">
                            {monthLabel}
                          </span>
                        )}
                        <span className="block text-xs font-bold">
                          {dayNumber}
                        </span>
                        {loggedAmount > 0 && (
                          <span className="block truncate text-[10px] font-semibold">
                            {loggedAmount} reps
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-content-faint">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-success-soft-border" />
                    Loggad
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-accent-soft-border" />
                    Idag
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showCancelDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-raised p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-content">
                Avbryt challenge?
              </h3>
              <p className="mt-2 text-sm text-content-muted">
                Ditt deltagande och alla loggade reps för challengen tas bort.
                Detta går inte att ångra.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-content-muted mb-1.5">
                Skriv &quot;Jag skäms&quot; för att bekräfta
              </label>
              <input
                type="text"
                value={cancelPhrase}
                onChange={(event) => setCancelPhrase(event.target.value)}
                autoFocus
                className="w-full px-3 py-2 border border-outline rounded-xl text-sm outline-none focus:border-danger focus:ring-2 focus:ring-danger-soft-border"
              />
            </div>
            {cancelMessage && (
              <p className="text-xs font-medium text-danger">
                {cancelMessage}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 rounded-xl border border-outline py-2 text-sm font-semibold text-content-muted hover:bg-inset"
              >
                Behåll challenge
              </button>
              <button
                type="button"
                onClick={handleCancelChallenge}
                disabled={
                  cancelLoading ||
                  cancelPhrase.trim().toLocaleLowerCase("sv-SE") !== "jag skäms"
                }
                className="flex-1 rounded-xl bg-danger py-2 text-sm font-semibold text-white hover:bg-danger-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelLoading ? "Avbryter..." : "Avbryt challenge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {historicalChallenges.length > 0 && (
        <section className="space-y-4 border-t border-outline-soft pt-6">
          <div>
            <h3 className="text-lg font-bold text-content tracking-tight">
              Tidigare challenges
            </h3>
            <p className="text-xs text-content-faint mt-1">
              Dina tidigare deltaganden, endast för visning.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {historicalChallenges.map((challenge) => (
              <article
                key={challenge.challengeId}
                className="rounded-xl border border-outline bg-inset p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-content">
                      {challenge.title}
                    </h4>
                    <p className="text-xs text-content-faint mt-1">
                      Avklarad{" "}
                      {new Date(challenge.completedAt).toLocaleDateString(
                        "sv-SE",
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-warning-soft text-warning-soft-text font-bold">
                    +{challenge.earnedPoints} / {challenge.points} XP
                  </span>
                  {challenge.placement && challenge.placement <= 3 && (
                    <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-warning-soft text-warning-soft-text font-bold">
                      {["🥇", "🥈", "🥉"][challenge.placement - 1]}{" "}
                      {challenge.placement}:a plats av{" "}
                      {challenge.participantCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-content-muted">
                  {challenge.description}
                </p>
                <p className="text-xs font-semibold text-content-secondary">
                  Vald nivå: {challenge.chosenTier}
                </p>
                <div className="flex items-center justify-between gap-3 border-t border-outline pt-3">
                  <span className="text-sm font-bold text-content">
                    Resultat: {challenge.totalAmount} / {challenge.chosenTier}
                  </span>
                  <span className="text-xs font-bold text-success-strong">
                    {calculateProgressPercent(
                      challenge.totalAmount,
                      challenge.chosenTier,
                    )}
                    %
                  </span>
                  {challenge.placement && challenge.placement > 3 && (
                    <p className="text-xs text-content-faint">
                      Plats {challenge.placement} av{" "}
                      {challenge.participantCount}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Profilinställningar */}
      <div className="space-y-4 border-t border-outline-soft pt-6">
        <h3 className="text-lg font-bold text-content tracking-tight">
          Profilinställningar
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-outline rounded-xl text-sm"
              placeholder="Namn"
            />
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-3 py-2 border border-outline rounded-xl text-sm"
              placeholder="Alias"
            />
          </div>
          <button
            type="submit"
            disabled={profileLoading}
            className="bg-btn hover:bg-btn-hover text-on-btn font-medium py-2 px-4 rounded-xl text-xs"
          >
            {profileLoading ? "Sparar..." : "Spara profil"}
          </button>
        </form>
        {profileMessage && (
          <div className="p-3 text-xs bg-success-soft text-success-soft-text rounded-xl font-medium">
            {profileMessage}
          </div>
        )}
      </div>

      {newlyUnlocked.length > 0 && (
        <UnlockCelebration
          achievements={newlyUnlocked}
          onDone={clearCelebration}
        />
      )}
    </div>
  );
}

export default Profile;
