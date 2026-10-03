import { useState, FormEvent, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { getPasswordResetRedirectUrl } from "./authConfig";

interface Challenge {
  id: number;
  title: string;
  description: string;
  points: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  tiers: string[];
}

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  alias: string | null;
  is_admin: boolean;
}

type AchievementCondition = "goal_percentage" | "daily_record";

interface Achievement {
  id: number;
  name: string;
  description: string;
  condition_type: AchievementCondition;
  condition_value: number | null;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function AdminChallenges() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [points, setPoints] = useState<number>(100);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Hantering av de dynamiska nivåerna
  const [tiers, setTiers] = useState<string[]>([]);
  const [newTierInput, setNewTierInput] = useState<string>("");

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [editingChallengeId, setEditingChallengeId] = useState<number | null>(
    null,
  );
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userMessage, setUserMessage] = useState<string>("");
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [achievementChallengeId, setAchievementChallengeId] =
    useState<string>("");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementName, setAchievementName] = useState("");
  const [achievementDescription, setAchievementDescription] = useState("");
  const [achievementCondition, setAchievementCondition] =
    useState<AchievementCondition>("goal_percentage");
  const [achievementValue, setAchievementValue] = useState("50");
  const [achievementMessage, setAchievementMessage] = useState("");
  const [savingAchievement, setSavingAchievement] = useState(false);

  const fetchAchievements = useCallback(async (challengeId: string) => {
    if (!challengeId) return;
    const { data, error } = await supabase
      .from("challenge_achievements")
      .select("id, name, description, condition_type, condition_value")
      .eq("challenge_id", Number(challengeId))
      .order("id", { ascending: true });
    if (error) {
      setAchievementMessage(`Fel: ${error.message}`);
      return;
    }
    setAchievements(data || []);
  }, []);

  const fetchChallenges = useCallback(async () => {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      setMessage(`Fel: ${error.message}`);
      return;
    }
    if (data) {
      setChallenges(data);
      const selectedId = data[0] ? String(data[0].id) : "";
      setAchievementChallengeId(selectedId);
      await fetchAchievements(selectedId);
    }
  }, [fetchAchievements]);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, alias, is_admin")
      .order("created_at", { ascending: false });

    if (error) {
      setUserMessage(`Fel: ${error.message}`);
    } else if (data) {
      setUsers(data);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
    fetchUsers();
  }, [fetchChallenges, fetchUsers]);

  const handleAddAchievement = async (e: FormEvent) => {
    e.preventDefault();
    if (!achievementChallengeId) return;

    setSavingAchievement(true);
    setAchievementMessage("");
    const { error } = await supabase.from("challenge_achievements").insert({
      challenge_id: Number(achievementChallengeId),
      name: achievementName.trim(),
      description: achievementDescription.trim(),
      condition_type: achievementCondition,
      condition_value:
        achievementCondition === "goal_percentage"
          ? Number(achievementValue)
          : null,
    });
    if (error) {
      setAchievementMessage(`Fel: ${error.message}`);
    } else {
      setAchievementName("");
      setAchievementDescription("");
      setAchievementMessage("Achievementet har lagts till.");
      fetchAchievements(achievementChallengeId);
    }
    setSavingAchievement(false);
  };

  const handleDeleteAchievement = async (achievementId: number) => {
    const { error } = await supabase
      .from("challenge_achievements")
      .delete()
      .eq("id", achievementId);
    setAchievementMessage(
      error ? `Fel: ${error.message}` : "Achievementet har tagits bort.",
    );
    if (!error) fetchAchievements(achievementChallengeId);
  };

  const handleAddTier = () => {
    const trimmed = newTierInput.trim();
    if (trimmed && !tiers.includes(trimmed)) {
      setTiers([...tiers, trimmed]);
      setNewTierInput("");
    }
  };

  const handleRemoveTier = (indexToRemove: number) => {
    setTiers(tiers.filter((_, idx) => idx !== indexToRemove));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPoints(100);
    setStartDate("");
    setEndDate("");
    setTiers([]);
    setNewTierInput("");
    setEditingChallengeId(null);
  };

  const handleEditChallenge = (challenge: Challenge) => {
    setEditingChallengeId(challenge.id);
    setTitle(challenge.title);
    setDescription(challenge.description);
    setPoints(challenge.points);
    setStartDate(challenge.start_date ? challenge.start_date.slice(0, 10) : "");
    setEndDate(challenge.end_date ? challenge.end_date.slice(0, 10) : "");
    setTiers(challenge.tiers || []);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitChallenge = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const challengeData = {
      title,
      description,
      points,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      tiers: tiers,
    };

    const result = editingChallengeId
      ? await supabase
          .from("challenges")
          .update(challengeData)
          .eq("id", editingChallengeId)
      : await supabase
          .from("challenges")
          .insert([{ ...challengeData, is_active: false }]);

    if (result.error) {
      setMessage(`Fel: ${result.error.message}`);
    } else {
      setMessage(
        editingChallengeId
          ? "Utmaningen har uppdaterats!"
          : "🎉 Utmaningen har sparats!",
      );
      resetForm();
      fetchChallenges();
    }
    setLoading(false);
  };

  const handleSetActive = async (id: number) => {
    setMessage("");
    const { error: deactivateError } = await supabase
      .from("challenges")
      .update({ is_active: false })
      .neq("id", id);

    if (deactivateError) {
      setMessage(`Fel: ${deactivateError.message}`);
      return;
    }

    const { error: activateError } = await supabase
      .from("challenges")
      .update({ is_active: true })
      .eq("id", id);

    if (activateError) {
      setMessage(`Fel: ${activateError.message}`);
    } else {
      setMessage("Utmaningen är nu aktiv.");
      fetchChallenges();
    }
  };

  const handleDeleteChallenge = async (id: number) => {
    if (
      !window.confirm(
        "Är du helt säker? Detta raderar även deltagarnas historik för denna specifika challenge.",
      )
    ) {
      return;
    }
    const { error } = await supabase.from("challenges").delete().eq("id", id);
    if (!error) fetchChallenges();
  };

  const handleSendPasswordReset = async (user: UserProfile) => {
    if (!user.email) {
      setUserMessage("Fel: Användaren saknar en e-postadress.");
      return;
    }

    setResettingUserId(user.id);
    setUserMessage("");

    const redirectTo = getPasswordResetRedirectUrl(window.location.origin);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo,
    });

    setUserMessage(
      error
        ? `Fel: ${error.message}`
        : "Om adressen finns registrerad har ett återställningsmail skickats.",
    );
    setResettingUserId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-content tracking-tight">
          Admin-panel
        </h3>
        <p className="text-xs text-content-faint">
          Skapa, hantera eller ta bort dina utmaningar.
        </p>
      </div>

      <form
        onSubmit={handleSubmitChallenge}
        className="space-y-4 bg-inset p-4 rounded-xl border border-outline-soft"
      >
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-content">
            {editingChallengeId ? "Redigera utmaning" : "Skapa utmaning"}
          </h4>
          {editingChallengeId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-content-faint hover:text-content font-medium"
            >
              Avbryt redigering
            </button>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
            Titel
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
            Beskrivning
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={2}
            className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised outline-none focus:border-accent"
          />
        </div>

        {/* NIVÅBYGGARE */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted">
            Konfigurera Nivåer / Mål
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTierInput}
              onChange={(e) => setNewTierInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-outline rounded-lg text-sm bg-raised outline-none"
              placeholder="t.ex. 1000 squats"
            />
            <button
              type="button"
              onClick={handleAddTier}
              className="bg-btn text-on-btn px-3 py-2 rounded-lg text-sm font-medium hover:bg-btn-hover"
            >
              Lägg till
            </button>
          </div>

          {tiers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tiers.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs bg-accent-soft text-accent-soft-text font-semibold px-2.5 py-1 rounded-lg border border-accent-soft-border"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTier(idx)}
                    className="text-content-faint hover:text-content font-bold ml-1 text-sm leading-none"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
              Poäng
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
              Startdag
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
              Slutdag
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg text-sm shadow-sm transition-colors"
        >
          {loading
            ? "Sparar..."
            : editingChallengeId
              ? "Spara ändringar"
              : "Skapa utmaning"}
        </button>
      </form>

      {message && (
        <div className="p-3 text-xs bg-success-soft text-success-soft-text border border-success-soft-border rounded-lg font-medium">
          {message}
        </div>
      )}

      <div className="space-y-3 bg-warning-soft p-4 rounded-xl border border-warning-soft-border">
        <div>
          <h4 className="font-bold text-sm text-content">
            Användare ({users.length})
          </h4>
          <p className="text-xs text-content-muted mt-1">
            Skicka en säker återställningslänk till en användare.
          </p>
        </div>
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-raised p-3 rounded-lg border border-warning-soft-border"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-content truncate">
                  {user.alias || user.full_name || "Namnlös användare"}
                  {user.is_admin && " (admin)"}
                </p>
                <p className="text-xs text-content-faint truncate">
                  {user.email || "Ingen e-postadress"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSendPasswordReset(user)}
                disabled={!user.email || resettingUserId === user.id}
                className="w-full sm:w-auto shrink-0 bg-warning hover:bg-warning-strong text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resettingUserId === user.id ? "Skickar..." : "Återställ"}
              </button>
            </div>
          ))}
        </div>
        {userMessage && (
          <p
            className={`text-xs font-medium ${userMessage.startsWith("Fel") ? "text-danger" : "text-success-strong"}`}
          >
            {userMessage}
          </p>
        )}
      </div>

      {/* LISTA MED UTMANINGAR */}
      <div className="space-y-3 pt-4 border-t border-outline-soft">
        <h4 className="font-bold text-sm text-content">
          Administrera utmaningar ({challenges.length})
        </h4>
        <div className="space-y-2">
          {challenges.map((c) => (
            <div
              key={c.id}
              className={`p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${c.is_active ? "bg-accent-soft/40 border-accent-soft-border shadow-sm" : "bg-raised border-outline shadow-sm"}`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-content">
                    {c.title}
                  </span>
                  <span className="text-[10px] bg-inset text-content-muted px-1.5 py-0.5 rounded font-bold">
                    +{c.points} XP
                  </span>
                  {c.is_active && (
                    <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded font-semibold animate-pulse">
                      Aktiv
                    </span>
                  )}
                </div>
                {c.tiers && c.tiers.length > 0 && (
                  <div className="flex gap-1 flex-wrap pt-0.5">
                    {c.tiers.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-inset text-content-muted px-2 py-0.5 rounded-md font-medium"
                      >
                        Nivå: {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleEditChallenge(c)}
                  className="text-xs bg-accent-soft hover:bg-accent-soft-border text-accent-soft-text px-3 py-1.5 rounded-xl font-medium"
                >
                  Redigera
                </button>
                <button
                  onClick={() => handleSetActive(c.id)}
                  disabled={c.is_active}
                  className="text-xs bg-raised hover:bg-inset text-content-secondary border border-outline px-3 py-1.5 rounded-xl font-medium shadow-sm disabled:cursor-default disabled:opacity-60"
                >
                  {c.is_active ? "Aktiv" : "Aktivera"}
                </button>
                <button
                  onClick={() => handleDeleteChallenge(c.id)}
                  className="text-xs bg-danger-soft hover:bg-danger-soft-border text-danger px-3 py-1.5 rounded-xl font-medium"
                >
                  Radera
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="space-y-4 pt-4 border-t border-outline-soft">
        <div>
          <h4 className="font-bold text-sm text-content">
            Administrera achievements
          </h4>
          <p className="text-xs text-content-muted mt-1">
            Achievements låses upp automatiskt när villkoret uppfylls.
          </p>
        </div>
        {challenges.length === 0 ? (
          <p className="text-xs text-content-faint">
            Skapa en utmaning innan du lägger till achievements.
          </p>
        ) : (
          <>
            <label className="block text-xs font-semibold text-content-muted">
              Utmaning
              <select
                value={achievementChallengeId}
                onChange={(event) => {
                  setAchievementChallengeId(event.target.value)
                  fetchAchievements(event.target.value)
                }}
                className="mt-1 w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised"
              >
                {challenges.map((challenge) => (
                  <option key={challenge.id} value={challenge.id}>
                    {challenge.title}
                  </option>
                ))}
              </select>
            </label>

            <form
              onSubmit={handleAddAchievement}
              className="space-y-3 bg-inset p-4 rounded-xl border border-outline-soft"
            >
              <input
                type="text"
                value={achievementName}
                onChange={(event) => setAchievementName(event.target.value)}
                placeholder="Namn, t.ex. Halvvägs!"
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised"
              />
              <textarea
                value={achievementDescription}
                onChange={(event) =>
                  setAchievementDescription(event.target.value)
                }
                placeholder="Beskrivning"
                required
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised"
              />
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <select
                  value={achievementCondition}
                  onChange={(event) =>
                    setAchievementCondition(
                      event.target.value === "daily_record"
                        ? "daily_record"
                        : "goal_percentage",
                    )
                  }
                  className="px-3 py-2 border border-outline rounded-lg text-sm bg-raised"
                >
                  <option value="goal_percentage">
                    Procent av deltagarens valda mål
                  </option>
                  <option value="daily_record">
                    Slå personligt dagsrekord
                  </option>
                </select>
                {achievementCondition === "goal_percentage" && (
                  <label className="flex items-center gap-2 text-xs text-content-muted">
                    Målnivå %
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={achievementValue}
                      onChange={(event) =>
                        setAchievementValue(event.target.value)
                      }
                      required
                      className="w-24 px-3 py-2 border border-outline rounded-lg text-sm bg-raised"
                    />
                  </label>
                )}
              </div>
              <button
                type="submit"
                disabled={savingAchievement}
                className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {savingAchievement ? "Lägger till..." : "Lägg till achievement"}
              </button>
            </form>

            {achievementMessage && (
              <p
                className={`text-xs font-medium ${achievementMessage.startsWith("Fel") ? "text-danger" : "text-success-strong"}`}
              >
                {achievementMessage}
              </p>
            )}

            <div className="space-y-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-start justify-between gap-3 bg-raised border border-outline-soft rounded-lg p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-content">
                      {achievement.name}
                    </p>
                    <p className="text-xs text-content-muted">
                      {achievement.description}
                    </p>
                    <p className="text-[11px] text-content-faint mt-1">
                      {achievement.condition_type === "goal_percentage"
                        ? `${achievement.condition_value}% av valt mål`
                        : "Nytt personligt dagsrekord"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAchievement(achievement.id)}
                    className="shrink-0 text-xs text-danger hover:underline"
                  >
                    Ta bort
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default AdminChallenges;
