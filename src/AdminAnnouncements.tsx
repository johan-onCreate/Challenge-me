import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

interface Announcement {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminAnnouncements() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAnnouncements = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, body, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (cancelled) return;
      if (error) {
        setMessage(`Fel vid hämtning av nyheter: ${error.message}`);
      } else {
        setAnnouncements(data ?? []);
      }
    };

    void loadAnnouncements();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) {
      setMessage("Ange både rubrik och meddelande.");
      return;
    }

    setSaving(true);
    setMessage("");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      setMessage(`Fel: ${authError?.message ?? "Du är inte inloggad."}`);
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: cleanTitle,
        body: cleanBody,
        created_by: user.id,
      })
      .select("id, title, body, created_at")
      .single();

    if (error) {
      setMessage(`Fel vid publicering: ${error.message}`);
    } else {
      setAnnouncements((current) => [data, ...current].slice(0, 10));
      setTitle("");
      setBody("");
      setMessage("Nyheten har publicerats.");
    }
    setSaving(false);
  };

  return (
    <section className="space-y-4 rounded-xl border border-outline-soft bg-inset p-4">
      <div>
        <h4 className="text-sm font-bold text-content">Nyheter till användarna</h4>
        <p className="mt-1 text-xs text-content-faint">
          Publicera en nyhet som visas tills varje användare stänger den.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-xs font-semibold text-content-secondary">
          Rubrik
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
            className="mt-1 w-full rounded-lg border border-outline bg-raised px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-content-secondary">
          Meddelande
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            rows={3}
            required
            className="mt-1 w-full rounded-lg border border-outline bg-raised px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-btn px-4 py-2 text-sm font-semibold text-on-btn hover:bg-btn-hover disabled:opacity-50"
        >
          {saving ? "Publicerar..." : "Publicera nyhet"}
        </button>
      </form>

      {message && (
        <p
          className={`text-xs font-medium ${message.startsWith("Fel") ? "text-danger" : "text-success-strong"}`}
          role="status"
        >
          {message}
        </p>
      )}

      {announcements.length > 0 && (
        <div className="space-y-2 border-t border-outline-soft pt-3">
          <h5 className="text-xs font-bold uppercase tracking-wide text-content-faint">
            Senaste publicerade
          </h5>
          {announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-lg border border-outline-soft bg-raised p-3"
            >
              <h6 className="text-sm font-semibold text-content">
                {announcement.title}
              </h6>
              <p className="mt-1 whitespace-pre-wrap text-xs text-content-muted">
                {announcement.body}
              </p>
              <time
                className="mt-2 block text-[10px] text-content-fainter"
                dateTime={announcement.created_at}
              >
                {new Date(announcement.created_at).toLocaleString("sv-SE")}
              </time>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
