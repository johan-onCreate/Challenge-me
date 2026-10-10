import { useState, FormEvent, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  calculateProfilePoints,
  canChangeTier,
} from "./profileUtils";
import { isAllowedLogDate } from "./calendarUtils";
import { toLocalDateKey as toTodayKey, toDateKey } from "./statsUtils";
import { buildChallengeState, type Achievement } from "./achievements";
import { syncOwnAchievements } from "./useAchievementSync";
import { UnlockCelebration } from "./components/UnlockCelebration";
import { CancelChallengeDialog } from "./components/profile/CancelChallengeDialog";
import {
  HistoricalChallenges,
  type HistoricalChallenge,
} from "./components/profile/HistoricalChallenges";
import type { ProfileLogEntry } from "./components/profile/ProfileLogManager";
import { buildHistoricalChallenges } from "./components/profile/buildHistoricalChallenges";
import { ProfileSettings } from "./components/profile/ProfileSettings";
import type { ProfileChallenge as Challenge } from "./components/profile/profileTypes";
import { CurrentChallengeSection } from "./components/profile/CurrentChallengeSection";

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
  const [historicalChallenges, setHistoricalChallenges] = useState<
    HistoricalChallenge[]
  >([]);
  const [loadingChallenge, setLoadingChallenge] = useState<boolean>(true);

  // States för daglig loggning
  const [logAmount, setLogAmount] = useState<string>("");
  const [logDate, setLogDate] = useState<string>("");
  const [totalLoggedAmount, setTotalLoggedAmount] = useState<number>(0);
  const [dailyLogs, setDailyLogs] = useState<ProfileLogEntry[]>([]);

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
  const todayDate = toTodayKey(new Date());

  const syncAchievementsAfterLogs = async (
    userId: string,
    logs: ProfileLogEntry[],
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
        setLogDate(toTodayKey(new Date()));

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
      const { data: userChallengeLogs } = await supabase
        .from("challenge_logs")
        .select("challenge_id, amount")
        .eq("user_id", user.id);
      const { data: allParticipants } = await supabase
        .from("user_challenges")
        .select("user_id, challenge_id, chosen_tier");
      const { data: allChallengeLogs } = await supabase
        .from("challenge_logs")
        .select("user_id, challenge_id, amount");
      setHistoricalChallenges(
        buildHistoricalChallenges({
          userId: user.id,
          activeChallengeId: activeChallenge?.id,
          userChallenges: allUserChallenges || [],
          challenges: challengeRows || [],
          userLogs: userChallengeLogs || [],
          participants: allParticipants || [],
          challengeLogs: allChallengeLogs || [],
        }),
      );
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
    if (
      isNaN(amountNum) ||
      amountNum <= 0 ||
      !isAllowedLogDate(
        logDate,
        toDateKey(currentChallenge.start_date),
        toDateKey(currentChallenge.end_date),
        todayDate,
      )
    ) {
      return;
    }

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
    if (
      isNaN(amountNum) ||
      amountNum < 0 ||
      !isAllowedLogDate(
        editingCalendarDate,
        toDateKey(currentChallenge.start_date),
        toDateKey(currentChallenge.end_date),
        todayDate,
      )
    ) {
      return;
    }

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
  const { currentChallengePoints, totalPoints } = calculateProfilePoints(
    historicalChallenges.map((challenge) => ({
      totalLoggedAmount: challenge.totalAmount,
      savedTier: challenge.chosenTier,
      maximumPoints: challenge.points,
    })),
    currentChallenge
      ? {
          totalLoggedAmount,
          savedTier,
          maximumPoints: currentChallenge.points,
        }
      : null,
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <CurrentChallengeSection
        challenge={currentChallenge}
        totalPoints={totalPoints}
        loading={loadingChallenge}
        currentPoints={currentChallengePoints}
        completed={isCurrentCompleted}
        selectedTier={chosenTier}
        savedTier={savedTier}
        totalLoggedAmount={totalLoggedAmount}
        todayDate={todayDate}
        logs={dailyLogs}
        logDate={logDate}
        logAmount={logAmount}
        editingLogId={editingLogId}
        editingAmount={editingAmount}
        editingCalendarDate={editingCalendarDate}
        editingCalendarAmount={editingCalendarAmount}
        tierLoading={tierLoading}
        tierMessage={tierMessage}
        onSelectTier={setChosenTier}
        onStart={handleStartChallenge}
        onSaveTier={handleChangeTier}
        onClearTierMessage={() => setTierMessage("")}
        onLogDateChange={setLogDate}
        onLogAmountChange={setLogAmount}
        onSubmitLog={handleLogDailyProgress}
        onEditingAmountChange={setEditingAmount}
        onUpdateLog={handleUpdateLog}
        onCancelLogEdit={() => setEditingLogId(null)}
        onStartLogEdit={(log) => {
          setEditingLogId(log.id);
          setEditingAmount(String(log.amount));
        }}
        onDeleteLog={handleDeleteLog}
        onStartCancel={() => {
          setCancelMessage("");
          setCancelPhrase("");
          setShowCancelDialog(true);
        }}
        onSaveCalendar={handleUpdateCalendarLog}
        onChangeCalendarAmount={setEditingCalendarAmount}
        onSelectCalendarDate={(date, amount) => {
          setLogDate(date);
          setEditingCalendarDate(date);
          setEditingCalendarAmount(amount > 0 ? String(amount) : "");
        }}
        onCancelCalendarEdit={() => setEditingCalendarDate(null)}
      />

      {showCancelDialog && (
        <CancelChallengeDialog
          phrase={cancelPhrase}
          message={cancelMessage}
          loading={cancelLoading}
          onPhraseChange={setCancelPhrase}
          onDismiss={() => setShowCancelDialog(false)}
          onConfirm={handleCancelChallenge}
        />
      )}

      <HistoricalChallenges challenges={historicalChallenges} />

      <ProfileSettings
        fullName={fullName}
        alias={alias}
        profileLoading={profileLoading}
        profileMessage={profileMessage}
        onFullNameChange={setFullName}
        onAliasChange={setAlias}
        onSubmit={handleUpdateProfile}
      />

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
