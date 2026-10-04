import { useEffect, useState } from "react";
import type { Achievement } from "../achievements";
import { burstConfetti } from "../confetti";

const BADGE_MS = 3500;

interface UnlockCelebrationProps {
  /** Kö av badgar som precis låstes upp (en och taget). */
  achievements: Achievement[];
  onDone: () => void;
}

export function UnlockCelebration({
  achievements,
  onDone,
}: UnlockCelebrationProps) {
  const [index, setIndex] = useState(0);
  const badge = achievements[index];

  useEffect(() => {
    if (!badge) return;
    burstConfetti();
    const timer = setTimeout(() => {
      if (index + 1 >= achievements.length) {
        onDone();
      } else {
        setIndex((current) => current + 1);
      }
    }, BADGE_MS);
    return () => clearTimeout(timer);
  }, [index, badge, achievements.length, onDone]);

  if (!badge) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl border border-success-soft-border bg-raised p-4 shadow-2xl animate-fade-in">
        <span className="text-4xl" aria-hidden>
          {badge.emoji}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-success-strong">
            Ny pris! 🎉
          </p>
          <p className="truncate font-bold text-content">{badge.title}</p>
          <p className="truncate text-xs text-content-faint">{badge.hint}</p>
        </div>
      </div>
    </div>
  );
}
