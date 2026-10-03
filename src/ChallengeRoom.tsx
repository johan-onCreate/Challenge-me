import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "react-router-dom";

interface RoomMessage {
  id: number;
  user_id: string;
  achievement_id: number | null;
  content: string;
  created_at: string;
  author: string;
  likeCount: number;
  likedByMe: boolean;
}

interface UnlockedAchievement {
  achievement_id: number;
  name: string;
  description: string;
}

interface RoomData {
  roomId: number;
  userId: string;
  challengeTitle: string;
  messages: RoomMessage[];
  unlockedAchievements: UnlockedAchievement[];
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function ChallengeRoomContent({ challengeId }: { challengeId?: string }) {
  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    UnlockedAchievement[]
  >([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingLikes, setPendingLikes] = useState<Set<number>>(
    () => new Set(),
  );
  const [error, setError] = useState("");

  const loadRoom = useCallback(async () => {
    if (!challengeId) throw new Error("Utmaningen kunde inte hittas.");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error("Du måste vara inloggad för att öppna rummet.");

    const { data: room, error: roomLookupError } = await supabase
      .from("challenge_rooms")
      .select("id, challenge_id")
      .eq("challenge_id", Number(challengeId))
      .maybeSingle();
    if (roomLookupError) throw roomLookupError;
    if (!room) throw new Error("Aktivitetsrummet kunde inte hittas.");

    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("id, title")
      .eq("id", room.challenge_id)
      .maybeSingle();
    if (challengeError) throw challengeError;
    if (!challenge) throw new Error("Utmaningen kunde inte hittas.");

    const { data: roomRows, error: messagesError } = await supabase
      .from("challenge_room_messages")
      .select("id, user_id, achievement_id, content, created_at")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true });
    if (messagesError) throw messagesError;

    const { data: likes, error: likesError } = roomRows?.length
      ? await supabase
          .from("challenge_room_message_likes")
          .select("message_id, user_id")
          .eq("room_id", room.id)
      : { data: [], error: null };
    if (likesError) throw likesError;

    const likesByMessage = new Map<
      number,
      { count: number; likedByMe: boolean }
    >();
    (likes || []).forEach((like) => {
      const current = likesByMessage.get(like.message_id) || {
        count: 0,
        likedByMe: false,
      };
      current.count += 1;
      current.likedByMe ||= like.user_id === user.id;
      likesByMessage.set(like.message_id, current);
    });

    const authorIds = [...new Set((roomRows || []).map((row) => row.user_id))];
    const { data: profiles, error: profilesError } = authorIds.length
      ? await supabase
          .from("profiles")
          .select("id, alias, full_name")
          .in("id", authorIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const profileById = new Map(
      (profiles || []).map((profile) => [
        profile.id,
        profile.alias || profile.full_name || "Anonym användare",
      ]),
    );

    const { data: userAwards, error: awardsError } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("challenge_id", Number(challengeId))
      .eq("user_id", user.id);
    if (awardsError) throw awardsError;

    const { data: achievementRows, error: achievementsError } = await supabase
      .from("challenge_achievements")
      .select("id, name, description")
      .eq("challenge_id", Number(challengeId));
    if (achievementsError) throw achievementsError;

    const sharedAchievementIds = new Set(
      (roomRows || [])
        .map((row) => row.achievement_id)
        .filter((id): id is number => id !== null),
    );
    const achievementById = new Map(
      (achievementRows || []).map((achievement) => [
        achievement.id,
        achievement,
      ]),
    );
    const unlockedAchievements = (userAwards || [])
        .filter((award) => !sharedAchievementIds.has(award.achievement_id))
        .flatMap((award) => {
          const achievement = achievementById.get(award.achievement_id);
          return achievement
            ? [
                {
                  achievement_id: achievement.id,
                  name: achievement.name,
                  description: achievement.description,
                },
              ]
            : [];
        });
    const messages = (roomRows || []).map((row) => ({
      ...row,
      author: profileById.get(row.user_id) || "Anonym användare",
      likeCount: likesByMessage.get(row.id)?.count || 0,
      likedByMe: likesByMessage.get(row.id)?.likedByMe || false,
    }));
    return {
      roomId: room.id,
      userId: user.id,
      challengeTitle: challenge.title,
      messages,
      unlockedAchievements,
    };
  }, [challengeId]);

  const applyRoomData = useCallback((room: RoomData) => {
    setRoomId(room.roomId);
    setUserId(room.userId);
    setChallengeTitle(room.challengeTitle);
    setMessages(room.messages);
    setUnlockedAchievements(room.unlockedAchievements);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadRoom()
      .then((room) => {
        if (!cancelled) applyRoomData(room);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Kunde inte hämta aktivitetsrummet.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const channel = challengeId && roomId !== null
      ? supabase
          .channel(`challenge-room-${challengeId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "challenge_room_messages",
              filter: `room_id=eq.${roomId}`,
            },
            () => {
              loadRoom()
                .then(applyRoomData)
                .catch((loadError: unknown) =>
                  setError(
                    loadError instanceof Error
                      ? loadError.message
                      : "Kunde inte uppdatera aktivitetsrummet.",
                  ),
                );
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "challenge_room_message_likes",
              filter: `room_id=eq.${roomId}`,
            },
            () => {
              loadRoom()
                .then(applyRoomData)
                .catch((loadError: unknown) =>
                  setError(
                    loadError instanceof Error
                      ? loadError.message
                      : "Kunde inte uppdatera likes.",
                  ),
                );
            },
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "user_achievements",
              filter: `user_id=eq.${userId}`,
            },
            () => {
              loadRoom()
                .then(applyRoomData)
                .catch((loadError: unknown) =>
                  setError(
                    loadError instanceof Error
                      ? loadError.message
                      : "Kunde inte uppdatera dina achievements.",
                  ),
                );
            },
          )
          .subscribe()
      : null;

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [applyRoomData, challengeId, loadRoom, roomId, userId]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = messageText.trim();
    if (!content || !challengeId || roomId === null || sending) return;

    setSending(true);
    setError("");
    const { error: insertError } = await supabase
      .from("challenge_room_messages")
      .insert({
        challenge_id: Number(challengeId),
        room_id: roomId,
        user_id: userId,
        content,
      });
    if (insertError) {
      setError(`Meddelandet kunde inte skickas: ${insertError.message}`);
    } else {
      setMessageText("");
      try {
        applyRoomData(await loadRoom());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Meddelandet skickades, men rummet kunde inte uppdateras.",
        );
      }
    }
    setSending(false);
  };

  const shareAchievement = async (achievement: UnlockedAchievement) => {
    if (!challengeId || roomId === null || sending) return;
    setSending(true);
    setError("");
    const { error: insertError } = await supabase
      .from("challenge_room_messages")
      .insert({
        challenge_id: Number(challengeId),
        room_id: roomId,
        user_id: userId,
        achievement_id: achievement.achievement_id,
        content: `🏆 ${achievement.name} — ${achievement.description}`,
      });
    if (insertError) {
      setError(`Achievementet kunde inte delas: ${insertError.message}`);
    } else {
      try {
        applyRoomData(await loadRoom());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Achievementet delades, men rummet kunde inte uppdateras.",
        );
      }
    }
    setSending(false);
  };

  const toggleLike = async (message: RoomMessage) => {
    if (
      !challengeId ||
      roomId === null ||
      !userId ||
      pendingLikes.has(message.id)
    )
      return;
    setPendingLikes((current) => new Set(current).add(message.id));
    setError("");

    try {
      const result = message.likedByMe
        ? await supabase
            .from("challenge_room_message_likes")
            .delete()
            .eq("message_id", message.id)
            .eq("user_id", userId)
        : await supabase.from("challenge_room_message_likes").insert({
            message_id: message.id,
            challenge_id: Number(challengeId),
            room_id: roomId,
            user_id: userId,
          });

      if (result.error) {
        setError(`Liken kunde inte sparas: ${result.error.message}`);
      } else {
        applyRoomData(await loadRoom());
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Liken kunde inte sparas.",
      );
    } finally {
      setPendingLikes((current) => {
        const next = new Set(current);
        next.delete(message.id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-content-fainter animate-pulse text-center py-6">
        Laddar aktivitetsrummet...
      </p>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <header>
        <h3 className="text-xl font-bold text-content tracking-tight">
          Aktivitetsrum
        </h3>
        <p className="text-xs text-content-faint mt-0.5">{challengeTitle}</p>
      </header>

      {unlockedAchievements.length > 0 && (
        <section className="space-y-2 rounded-xl border border-warning-soft-border bg-warning-soft/40 p-4">
          <h4 className="text-sm font-bold text-content">
            Dina upplåsta achievements
          </h4>
          {unlockedAchievements.map((achievement) => (
            <div
              key={achievement.achievement_id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-raised p-3"
            >
              <div>
                <p className="text-sm font-semibold text-content">
                  {achievement.name}
                </p>
                <p className="text-xs text-content-muted">
                  {achievement.description}
                </p>
              </div>
              <button
                type="button"
                disabled={sending}
                onClick={() => shareAchievement(achievement)}
                className="shrink-0 rounded-lg bg-warning px-3 py-1.5 text-xs font-semibold text-white hover:bg-warning-strong disabled:opacity-50"
              >
                Dela i rummet
              </button>
            </div>
          ))}
        </section>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <section className="space-y-3 rounded-xl border border-outline-soft bg-inset p-3 sm:p-4">
        <div
          className="max-h-[28rem] min-h-48 space-y-3 overflow-y-auto"
          aria-live="polite"
          aria-label="Meddelanden i aktivitetsrummet"
        >
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-content-faint">
              Inga meddelanden ännu. Säg hej!
            </p>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className="rounded-lg border border-outline-soft bg-raised p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-bold text-content">
                    {message.author}
                  </p>
                  <time
                    className="text-[10px] text-content-fainter"
                    dateTime={message.created_at}
                  >
                    {new Date(message.created_at).toLocaleString("sv-SE")}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-content-secondary">
                  {message.content}
                </p>
                <button
                  type="button"
                  onClick={() => toggleLike(message)}
                  disabled={pendingLikes.has(message.id)}
                  aria-pressed={message.likedByMe}
                  aria-label={`${message.likedByMe ? "Ta bort like" : "Gilla"}: ${message.likeCount}`}
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                    message.likedByMe
                      ? "bg-danger-soft text-danger"
                      : "bg-inset text-content-muted hover:bg-danger-soft hover:text-danger"
                  }`}
                >
                  <span aria-hidden="true">
                    {message.likedByMe ? "♥" : "♡"}
                  </span>
                  <span>{message.likeCount}</span>
                </button>
              </article>
            ))
          )}
        </div>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            maxLength={1000}
            placeholder="Skriv ett meddelande..."
            aria-label="Meddelande"
            className="min-w-0 flex-1 rounded-lg border border-outline bg-raised px-3 py-2 text-sm text-content"
          />
          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            Skicka
          </button>
        </form>
      </section>
    </div>
  );
}

function ChallengeRoom() {
  const { challengeId } = useParams<{ challengeId: string }>();
  return (
    <ChallengeRoomContent
      key={challengeId || "missing"}
      challengeId={challengeId}
    />
  );
}

export default ChallengeRoom;
