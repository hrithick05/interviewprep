export interface ScoringQuestion {
  id: string;
  correct_answer: string;
  topic_id?: string;
}

export interface ScoringAnswer {
  question_id: string;
  selected_answer: string | null;
  elapsed_seconds: number;
  flagged: boolean;
}

export interface ScoringConfig {
  negativeMarking: boolean;
  correctPoints: number;
  wrongPenalty: number;
}

export const DEFAULT_SCORING: ScoringConfig = {
  negativeMarking: false,
  correctPoints: 1,
  wrongPenalty: 0.25,
};

export function scoreQuestionSet<T extends ScoringQuestion>(
  questions: T[],
  answers: ScoringAnswer[],
  config: ScoringConfig = DEFAULT_SCORING,
) {
  const answersByQuestion = new Map(answers.map((answer) => [answer.question_id, answer]));
  const scoredAnswers = questions.map((question) => {
    const answer = answersByQuestion.get(question.id);
    const selected = answer?.selected_answer ?? null;
    const answered = selected !== null;
    const is_correct = answered && selected === question.correct_answer;
    let points = 0;
    if (is_correct) points = config.correctPoints;
    else if (answered && config.negativeMarking) points = -config.wrongPenalty;
    return {
      ...question,
      ...answer,
      selected_answer: selected,
      is_correct,
      points,
    };
  });
  const rawScore = scoredAnswers.reduce((sum, answer) => sum + answer.points, 0);
  return {
    score: Math.max(0, Math.round(rawScore * 100) / 100),
    total: scoredAnswers.length,
    maxScore: questions.length * config.correctPoints,
    answers: scoredAnswers,
  };
}
