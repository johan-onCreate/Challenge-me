import type { Challenge } from "./adminTypes";

export function ChallengeList({
  challenges,
  onEdit,
  onSetActive,
  onDelete,
}: {
  challenges: Challenge[];
  onEdit: (challenge: Challenge) => void;
  onSetActive: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <section className="space-y-3 pt-4 border-t border-outline-soft">
      <h4 className="font-bold text-sm text-content">
        Administrera utmaningar ({challenges.length})
      </h4>
      <div className="space-y-2">
        {challenges.map((challenge) => (
          <article
            key={challenge.id}
            className={`p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${challenge.is_active ? "bg-accent-soft/40 border-accent-soft-border shadow-sm" : "bg-raised border-outline shadow-sm"}`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-content">
                  {challenge.title}
                </span>
                <span className="text-[10px] bg-inset text-content-muted px-1.5 py-0.5 rounded font-bold">
                  +{challenge.points} XP
                </span>
                {challenge.is_active && (
                  <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded font-semibold animate-pulse">
                    Aktiv
                  </span>
                )}
              </div>
              {challenge.tiers && challenge.tiers.length > 0 && (
                <div className="flex gap-1 flex-wrap pt-0.5">
                  {challenge.tiers.map((tier, index) => (
                    <span
                      key={index}
                      className="text-[10px] bg-inset text-content-muted px-2 py-0.5 rounded-md font-medium"
                    >
                      Nivå: {tier}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(challenge)}
                className="text-xs bg-accent-soft hover:bg-accent-soft-border text-accent-soft-text px-3 py-1.5 rounded-xl font-medium"
              >
                Redigera
              </button>
              <button
                type="button"
                onClick={() => onSetActive(challenge.id)}
                disabled={challenge.is_active}
                className="text-xs bg-raised hover:bg-inset text-content-secondary border border-outline px-3 py-1.5 rounded-xl font-medium shadow-sm disabled:cursor-default disabled:opacity-60"
              >
                {challenge.is_active ? "Aktiv" : "Aktivera"}
              </button>
              <button
                type="button"
                onClick={() => onDelete(challenge.id)}
                className="text-xs bg-danger-soft hover:bg-danger-soft-border text-danger px-3 py-1.5 rounded-xl font-medium"
              >
                Radera
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
