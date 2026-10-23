export interface ReadinessInput {
  accuracy: number;
  timedAccuracy: number;
  codingSolveRate: number;
  hrAnswersSaved: number;
  interviewReports: number;
  dueReviewsClearedRate: number;
  streakDays: number;
  topicCoverage: number;
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Readiness is a 0–100 score. See docs/READINESS.md.
 */
export function computeReadiness(input: ReadinessInput): number {
  const weighted =
    clamp01(input.accuracy) * 0.22 +
    clamp01(input.timedAccuracy) * 0.16 +
    clamp01(input.codingSolveRate) * 0.18 +
    clamp01(Math.min(input.hrAnswersSaved, 12) / 12) * 0.1 +
    clamp01(Math.min(input.interviewReports, 5) / 5) * 0.1 +
    clamp01(input.dueReviewsClearedRate) * 0.08 +
    clamp01(Math.min(input.streakDays, 21) / 21) * 0.08 +
    clamp01(input.topicCoverage) * 0.08;
  return Math.round(weighted * 100);
}

export function practiceNextTopic(topicAccuracy: Record<string, number>, dueTopicIds: string[]): string | null {
  const weak = Object.entries(topicAccuracy)
    .filter(([, accuracy]) => accuracy < 0.7)
    .sort((a, b) => a[1] - b[1]);
  if (dueTopicIds.length) return dueTopicIds[0] ?? null;
  return weak[0]?.[0] ?? Object.keys(topicAccuracy)[0] ?? null;
}
