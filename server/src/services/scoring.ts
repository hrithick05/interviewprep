export interface ScoringQuestion {
  id: string;
  correct_answer: string;
}

export interface ScoringAnswer {
  question_id: string;
  selected_answer: string | null;
  elapsed_seconds: number;
  flagged: boolean;
}

export function scoreQuestionSet<T extends ScoringQuestion>(
  questions: T[],
  answers: ScoringAnswer[],
) {
  const answersByQuestion = new Map(answers.map((answer) => [answer.question_id, answer]));
  const scoredAnswers = questions.map((question) => {
    const answer = answersByQuestion.get(question.id);
    return {
      ...question,
      ...answer,
      is_correct: answer?.selected_answer !== null
        && answer?.selected_answer === question.correct_answer,
    };
  });
  return {
    score: scoredAnswers.filter((answer) => answer.is_correct).length,
    total: scoredAnswers.length,
    answers: scoredAnswers,
  };
}
