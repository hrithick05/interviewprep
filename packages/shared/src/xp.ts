export const XP_EVENTS = {
  question_correct: 10,
  timed_complete: 25,
  coding_solve: 40,
  hr_answer: 15,
  interview_complete: 50,
  daily_challenge: 20,
  hint: -5,
  streak_bonus: 8,
} as const;

export type XpEventType = keyof typeof XP_EVENTS;

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1);
}

export function xpForEvent(type: XpEventType): number {
  return XP_EVENTS[type];
}

export function applyStreak(
  lastDate: string | null,
  today: string,
  freezeCount: number,
): { streak: number; freezes: number; continued: boolean } {
  if (!lastDate) return { streak: 1, freezes: freezeCount, continued: true };
  if (lastDate === today) return { streak: 1, freezes: freezeCount, continued: true };
  const last = new Date(`${lastDate}T00:00:00Z`).getTime();
  const now = new Date(`${today}T00:00:00Z`).getTime();
  const delta = Math.round((now - last) / 86_400_000);
  if (delta === 1) return { streak: 1, freezes: freezeCount, continued: true };
  if (delta === 2 && freezeCount > 0) return { streak: 1, freezes: freezeCount - 1, continued: true };
  return { streak: 1, freezes: freezeCount, continued: false };
}

export function nextStreakCount(previous: number, continued: boolean): number {
  return continued ? previous + 1 : 1;
}
