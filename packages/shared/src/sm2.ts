export interface Sm2Card {
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
}

export function reviewSm2(card: Sm2Card, quality: 0 | 1 | 2 | 3 | 4 | 5, now = new Date()): Sm2Card {
  const q = quality;
  let ease = card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease < 1.3) ease = 1.3;
  let repetitions = card.repetitions;
  let intervalDays = card.intervalDays;
  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(card.intervalDays * ease);
  }
  const due = new Date(now.getTime() + intervalDays * 86_400_000);
  return { ease, intervalDays, repetitions, dueAt: due.toISOString() };
}

export const DEFAULT_SM2: Sm2Card = {
  ease: 2.5,
  intervalDays: 0,
  repetitions: 0,
  dueAt: new Date(0).toISOString(),
};
