import {
  type Achievement,
  type BadgeCardState,
  type BadgeProgress,
} from "../achievements";

const SWEDISH_MONTHS = [
  "jan",
  "feb",
  "mars",
  "apr",
  "maj",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

function formatUnlockedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = SWEDISH_MONTHS[date.getMonth()] ?? "";
  return `${date.getDate()} ${month}`;
}

interface BadgeCardProps {
  achievement: Achievement;
  state: BadgeCardState;
  progress?: BadgeProgress | null;
  unlockedAt?: string;
}

export function BadgeCard({
  achievement,
  state,
  progress,
  unlockedAt,
}: BadgeCardProps) {
  const earned = state === "earned";
  const inProgress = state === "progress";
  const unlockedLabel =
    earned && unlockedAt ? formatUnlockedDate(unlockedAt) : "";

  const containerClass = earned
    ? "bg-success-soft border-success-soft-border"
    : inProgress
      ? "bg-inset border-accent-soft-border"
      : "bg-inset/60 border-outline-soft opacity-70";

  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-3 ${containerClass}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-2xl ${earned || inProgress ? "" : "opacity-40 grayscale"}`}
          aria-hidden
        >
          {achievement.emoji}
        </span>
        {earned && (
          <span className="text-xs font-bold text-success-strong" aria-hidden>
            ✓
          </span>
        )}
      </div>
      <p
        className={`text-sm font-bold leading-tight ${
          earned
            ? "text-success-soft-text"
            : inProgress
              ? "text-content"
              : "text-content-faint"
        }`}
      >
        {achievement.title}
      </p>
      <p className="text-[11px] leading-snug text-content-faint">
        {achievement.hint}
      </p>

      {earned && unlockedLabel && (
        <p className="mt-auto text-[11px] font-semibold text-success-strong">
          {unlockedLabel}
        </p>
      )}

      {inProgress && progress?.kind === "count" && (
        <div className="mt-auto space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline">
            <div
              className="h-full rounded-full bg-accent"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (progress.current / Math.max(progress.target, 1)) * 100,
                  ),
                )}%`,
              }}
            />
          </div>
          <p className="text-[11px] font-semibold text-accent-soft-text">
            {`${progress.current} / ${progress.target}`}
          </p>
        </div>
      )}

      {inProgress && progress?.kind === "text" && (
        <p className="mt-auto text-[11px] font-semibold text-accent-soft-text">
          {progress.text}
        </p>
      )}
    </div>
  );
}
