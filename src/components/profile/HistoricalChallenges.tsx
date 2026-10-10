import { calculateProgressPercent } from "../../profileUtils";

export interface HistoricalChallenge {
  challengeId: number;
  title: string;
  description: string;
  points: number;
  chosenTier: string;
  completedAt: string;
  totalAmount: number;
  earnedPoints: number;
  placement: number | null;
  participantCount: number;
}

export function HistoricalChallenges({
  challenges,
}: {
  challenges: HistoricalChallenge[];
}) {
  if (challenges.length === 0) return null;

  return (
    <section className="space-y-4 border-t border-outline-soft pt-6">
      <div>
        <h3 className="text-lg font-bold text-content tracking-tight">
          Tidigare challenges
        </h3>
        <p className="text-xs text-content-faint mt-1">
          Dina tidigare deltaganden, endast för visning.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {challenges.map((challenge) => (
          <article
            key={challenge.challengeId}
            className="rounded-xl border border-outline bg-inset p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-content">{challenge.title}</h4>
                <p className="text-xs text-content-faint mt-1">
                  Avklarad{" "}
                  {new Date(challenge.completedAt).toLocaleDateString("sv-SE")}
                </p>
              </div>
              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-warning-soft text-warning-soft-text font-bold">
                +{challenge.earnedPoints} / {challenge.points} XP
              </span>
              {challenge.placement && challenge.placement <= 3 && (
                <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-warning-soft text-warning-soft-text font-bold">
                  {["🥇", "🥈", "🥉"][challenge.placement - 1]}{" "}
                  {challenge.placement}:a plats av {challenge.participantCount}
                </span>
              )}
            </div>
            <p className="text-sm text-content-muted">
              {challenge.description}
            </p>
            <p className="text-xs font-semibold text-content-secondary">
              Vald nivå: {challenge.chosenTier}
            </p>
            <div className="flex items-center justify-between gap-3 border-t border-outline pt-3">
              <span className="text-sm font-bold text-content">
                Resultat: {challenge.totalAmount} / {challenge.chosenTier}
              </span>
              <span className="text-xs font-bold text-success-strong">
                {calculateProgressPercent(
                  challenge.totalAmount,
                  challenge.chosenTier,
                )}
                %
              </span>
              {challenge.placement && challenge.placement > 3 && (
                <p className="text-xs text-content-faint">
                  Plats {challenge.placement} av {challenge.participantCount}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
