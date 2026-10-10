import { describe, expect, it } from "vitest";
import {
  filterUnreadAnnouncements,
  type Announcement,
} from "./announcements";

const announcements: Announcement[] = [
  {
    id: 1,
    title: "Nyhet 1",
    body: "Första nyheten",
    created_at: "2026-10-01T10:00:00Z",
  },
  {
    id: 2,
    title: "Nyhet 2",
    body: "Andra nyheten",
    created_at: "2026-10-02T10:00:00Z",
  },
];

describe("filterUnreadAnnouncements", () => {
  it("returns only announcements without a read receipt", () => {
    expect(filterUnreadAnnouncements(announcements, new Set([1]))).toEqual([
      announcements[1],
    ]);
  });

  it("returns all announcements when none have been read", () => {
    expect(filterUnreadAnnouncements(announcements, new Set())).toEqual(
      announcements,
    );
  });

  it("returns no announcements when all have been read", () => {
    expect(filterUnreadAnnouncements(announcements, new Set([1, 2]))).toEqual(
      [],
    );
  });
});
