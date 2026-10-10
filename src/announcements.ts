import { createClient } from "@supabase/supabase-js";

export interface Announcement {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

type AnnouncementRow = Announcement;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function filterUnreadAnnouncements(
  announcements: readonly Announcement[],
  readIds: ReadonlySet<number>,
): Announcement[] {
  return announcements.filter((announcement) => !readIds.has(announcement.id));
}

export async function fetchUnreadAnnouncements(
  userId: string,
): Promise<Announcement[]> {
  const [announcementsResult, readsResult] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .not("published_at", "is", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", userId),
  ]);

  if (announcementsResult.error) throw announcementsResult.error;
  if (readsResult.error) throw readsResult.error;

  const announcements: Announcement[] = (
    announcementsResult.data ?? []
  ).map((row: AnnouncementRow) => ({
    id: Number(row.id),
    title: row.title,
    body: row.body,
    created_at: row.created_at,
  }));
  const readIds = new Set(
    (readsResult.data ?? []).map((row) => Number(row.announcement_id)),
  );

  return filterUnreadAnnouncements(announcements, readIds);
}

export async function markAnnouncementRead(
  userId: string,
  announcementId: number,
): Promise<void> {
  const { error } = await supabase.from("announcement_reads").upsert(
    { user_id: userId, announcement_id: announcementId },
    {
      onConflict: "announcement_id,user_id",
      ignoreDuplicates: true,
    },
  );

  if (error) throw error;
}
