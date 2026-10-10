import { calculateEarnedPoints } from "../../profileUtils";
import type { HistoricalChallenge } from "./HistoricalChallenges";

interface UserChallengeRow {
  challenge_id: number;
  chosen_tier: string | null;
  completed_at: string;
}

interface ChallengeRow {
  id: number;
  title: string;
  description: string;
  points: number;
}

interface UserLogRow {
  challenge_id: number;
  amount: number;
}

interface ParticipantRow {
  user_id: string;
  challenge_id: number;
  chosen_tier: string | null;
}

interface ChallengeLogRow {
  user_id: string;
  challenge_id: number;
  amount: number;
}

export function buildHistoricalChallenges({
  userId,
  activeChallengeId,
  userChallenges,
  challenges,
  userLogs,
  participants,
  challengeLogs,
}: {
  userId: string;
  activeChallengeId: number | undefined;
  userChallenges: UserChallengeRow[];
  challenges: ChallengeRow[];
  userLogs: UserLogRow[];
  participants: ParticipantRow[];
  challengeLogs: ChallengeLogRow[];
}): HistoricalChallenge[] {
  const challengeById = new Map(
    challenges.map((challenge) => [challenge.id, challenge]),
  );

  const totalsByChallenge = new Map<number, number>();
  userLogs.forEach((log) => {
    totalsByChallenge.set(
      log.challenge_id,
      (totalsByChallenge.get(log.challenge_id) || 0) + log.amount,
    );
  });

  const totalsByParticipant = new Map<string, number>();
  challengeLogs.forEach((log) => {
    const key = `${log.challenge_id}:${log.user_id}`;
    totalsByParticipant.set(
      key,
      (totalsByParticipant.get(key) || 0) + log.amount,
    );
  });

  const participantsByGroup = new Map<
    string,
    Array<{ userId: string; totalAmount: number }>
  >();
  participants.forEach((participant) => {
    const groupKey = `${participant.challenge_id}:${participant.chosen_tier || "Ej vald"}`;
    const group = participantsByGroup.get(groupKey) || [];
    group.push({
      userId: participant.user_id,
      totalAmount:
        totalsByParticipant.get(
          `${participant.challenge_id}:${participant.user_id}`,
        ) || 0,
    });
    participantsByGroup.set(groupKey, group);
  });

  return userChallenges
    .flatMap((entry) => {
      const challenge = challengeById.get(entry.challenge_id);
      if (!challenge || challenge.id === activeChallengeId) return [];

      const chosenTier = entry.chosen_tier || "Ej vald";
      const groupKey = `${challenge.id}:${chosenTier}`;
      const rankedParticipants = (
        participantsByGroup.get(groupKey) || []
      ).sort((a, b) => b.totalAmount - a.totalAmount);
      const currentPlacement = rankedParticipants.findIndex(
        (participant) => participant.userId === userId,
      );
      const totalAmount = totalsByChallenge.get(challenge.id) || 0;

      return [
        {
          challengeId: challenge.id,
          title: challenge.title,
          description: challenge.description,
          points: challenge.points,
          chosenTier,
          completedAt: entry.completed_at,
          totalAmount,
          earnedPoints: calculateEarnedPoints(
            totalAmount,
            entry.chosen_tier || "",
            challenge.points,
          ),
          placement: currentPlacement >= 0 ? currentPlacement + 1 : null,
          participantCount: rankedParticipants.length,
        },
      ];
    })
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );
}
