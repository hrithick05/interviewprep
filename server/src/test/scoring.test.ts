import { describe, expect, it } from "vitest";
import { scoreQuestionSet } from "../services/scoring.js";

describe("question scoring", () => {
  it("scores correct, wrong, and unanswered questions without dropping question order", () => {
    const result = scoreQuestionSet([
      { id: "one", correct_answer: "A", topic_id: "math" },
      { id: "two", correct_answer: "B", topic_id: "logic" },
      { id: "three", correct_answer: "C", topic_id: "math" },
    ], [
      { question_id: "one", selected_answer: "A", elapsed_seconds: 8, flagged: false },
      { question_id: "two", selected_answer: "A", elapsed_seconds: 16, flagged: true },
    ]);

    expect(result.score).toBe(1);
    expect(result.total).toBe(3);
    expect(result.answers.map((answer) => answer.is_correct)).toEqual([true, false, false]);
    expect(result.answers.map((answer) => answer.id)).toEqual(["one", "two", "three"]);
    expect(result.answers[2]?.selected_answer).toBeUndefined();
  });
});
