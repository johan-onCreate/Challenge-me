import { useEffect, useRef, useState } from "react";
import {
  fetchUnreadAnnouncements,
  markAnnouncementRead,
  type Announcement,
} from "../announcements";

interface AnnouncementToastProps {
  userId: string;
}

export default function AnnouncementToast({ userId }: AnnouncementToastProps) {
  const [pending, setPending] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);
  const locallyRead = useRef(new Set<number>());

  useEffect(() => {
    let cancelled = false;
    let loading = false;

    const loadUnread = async () => {
      if (loading) return;
      loading = true;
      try {
        const unread = await fetchUnreadAnnouncements(userId);
        if (!cancelled) {
          const stillUnread = unread.filter(
            (item) => !locallyRead.current.has(item.id),
          );
          setPending((current) => {
            const existingIds = new Set(current.map((item) => item.id));
            return [
              ...current,
              ...stillUnread.filter((item) => !existingIds.has(item.id)),
            ];
          });
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Kunde inte hämta nyheter. Försök igen.");
        }
      } finally {
        loading = false;
      }
    };

    void loadUnread();
    const intervalId = window.setInterval(() => void loadUnread(), 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [userId, retry]);

  const dismiss = async (announcement: Announcement) => {
    setDismissingId(announcement.id);
    setError(null);
    try {
      await markAnnouncementRead(userId, announcement.id);
      locallyRead.current.add(announcement.id);
      setPending((current) =>
        current.filter((item) => item.id !== announcement.id),
      );
    } catch {
      setError("Nyheten kunde inte markeras som läst. Försök igen.");
    } finally {
      setDismissingId(null);
    }
  };

  const announcement = pending[0];

  if (!announcement && !error) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[80] w-[calc(100%-2rem)] max-w-md"
      aria-live="polite"
    >
      {announcement ? (
        <section className="rounded-2xl border border-accent-soft-border bg-raised p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-accent">
                Nyhet
                {pending.length > 1 && ` · ${pending.length} olästa`}
              </p>
              <h2 className="mt-1 text-base font-bold text-content">
                {announcement.title}
              </h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-content-secondary">
                {announcement.body}
              </p>
            </div>
            <button
              type="button"
              aria-label="Stäng och markera nyheten som läst"
              disabled={dismissingId === announcement.id}
              onClick={() => void dismiss(announcement)}
              className="shrink-0 rounded-lg px-2 py-1 text-lg font-bold text-content-faint hover:bg-inset disabled:opacity-50"
            >
              {dismissingId === announcement.id ? "…" : "×"}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-xs font-medium text-danger" role="alert">
              {error}
            </p>
          )}
        </section>
      ) : (
        <section className="flex items-center justify-between gap-3 rounded-xl border border-danger-soft-border bg-raised p-3 shadow-xl">
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setRetry((count) => count + 1)}
            className="shrink-0 rounded-lg bg-btn px-3 py-2 text-xs font-semibold text-on-btn"
          >
            Försök igen
          </button>
        </section>
      )}
    </div>
  );
}
