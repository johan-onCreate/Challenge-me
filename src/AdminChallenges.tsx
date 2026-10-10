import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { getPasswordResetRedirectUrl } from "./authConfig";
import AdminAnnouncements from "./AdminAnnouncements";
import { AdminUsers } from "./components/admin/AdminUsers";
import { ChallengeForm } from "./components/admin/ChallengeForm";
import { ChallengeList } from "./components/admin/ChallengeList";
import type {
  Challenge,
  UserProfile,
} from "./components/admin/adminTypes";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function AdminChallenges() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(100);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tiers, setTiers] = useState<string[]>([]);
  const [newTierInput, setNewTierInput] = useState("");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingChallengeId, setEditingChallengeId] = useState<number | null>(
    null,
  );
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .order("id", { ascending: false });
    if (data) setChallenges(data);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, alias, is_admin")
      .order("created_at", { ascending: false });

    if (error) {
      setUserMessage(`Fel: ${error.message}`);
    } else if (data) {
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchChallenges();
    fetchUsers();
  }, []);

  const handleAddTier = () => {
    const trimmed = newTierInput.trim();
    if (trimmed && !tiers.includes(trimmed)) {
      setTiers([...tiers, trimmed]);
      setNewTierInput("");
    }
  };

  const handleRemoveTier = (indexToRemove: number) => {
    setTiers(tiers.filter((_, index) => index !== indexToRemove));
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

  const handleSubmitChallenge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const challengeData = {
      title,
      description,
      points,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      tiers,
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

      <AdminAnnouncements />

      <ChallengeForm
        title={title}
        description={description}
        points={points}
        startDate={startDate}
        endDate={endDate}
        tiers={tiers}
        newTierInput={newTierInput}
        editing={editingChallengeId !== null}
        loading={loading}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onPointsChange={setPoints}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onNewTierInputChange={setNewTierInput}
        onAddTier={handleAddTier}
        onRemoveTier={handleRemoveTier}
        onCancelEdit={resetForm}
        onSubmit={handleSubmitChallenge}
      />

      {message && (
        <div className="p-3 text-xs bg-success-soft text-success-soft-text border border-success-soft-border rounded-lg font-medium">
          {message}
        </div>
      )}

      <AdminUsers
        users={users}
        message={userMessage}
        resettingUserId={resettingUserId}
        onSendPasswordReset={handleSendPasswordReset}
      />

      <ChallengeList
        challenges={challenges}
        onEdit={handleEditChallenge}
        onSetActive={handleSetActive}
        onDelete={handleDeleteChallenge}
      />
    </div>
  );
}

export default AdminChallenges;
