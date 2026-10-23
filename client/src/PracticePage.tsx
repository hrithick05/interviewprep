import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Check, ChevronLeft, ChevronRight, Clock3, Flag, Play, RotateCcw } from "lucide-react";
import type { PracticeMode, QuestionDifficulty, TopicCategory, TopicRow } from "@prepforge/shared";
import { api } from "./api";

type PracticeQuestion = {
  id: string;
  topic_id: string;
  question_type: TopicCategory;
  difficulty: QuestionDifficulty;
  prompt: string;
  options: string[];
  explanation: string;
};

type Attempt = {
  id: string;
  mode: PracticeMode;
  status: "in_progress" | "completed";
  question_ids: string[];
  duration_seconds: number | null;
  started_at: string;
};

type SavedAnswer = {
  question_id: string;
  selected_answer: string | null;
  flagged: boolean;
  elapsed_seconds: number;
};

type AttemptData = {
  attempt: Attempt;
  questions: PracticeQuestion[];
  answers: SavedAnswer[];
};

type Feedback = { isCorrect: boolean; correctAnswer: string; explanation: string };
type ResultData = {
  score: number;
  total: number;
  breakdown: { topic: string; score: number; total: number }[];
  answers: (PracticeQuestion & SavedAnswer & { id: string; correct_answer: string; is_correct: boolean })[];
};

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "We couldn't load practice right now.";
}

export function PracticePage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | "">("");
  const [company, setCompany] = useState("");
  const [mode, setMode] = useState<PracticeMode>("practice");
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [secondsOnQuestion, setSecondsOnQuestion] = useState(0);

  const questions = useMemo(() => {
    if (!attempt) return [];
    const byId = new Map(attempt.questions.map((question) => [question.id, question]));
    return attempt.attempt.question_ids.map((id) => byId.get(id)).filter((question): question is PracticeQuestion => Boolean(question));
  }, [attempt]);
  const question = questions[index];
  const savedAnswer = attempt?.answers.find((answer) => answer.question_id === question?.id);
  const isBookmarked = question ? bookmarks.includes(question.id) : false;

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.practiceRequest<TopicRow[]>("/topics"),
      api.practiceRequest<{ question_id: string }[]>("/bookmarks"),
    ]).then(([loadedTopics, savedBookmarks]) => {
      if (!active) return;
      setTopics(loadedTopics);
      setBookmarks(savedBookmarks.map((bookmark) => bookmark.question_id));
    }).catch((loadError: unknown) => {
      if (active) setError(messageFrom(loadError));
    });
    return () => { active = false; };
  }, []);

  const saveAnswer = useCallback(async (
    nextQuestion = question,
    answer = selected,
    flagged = savedAnswer?.flagged ?? false,
  ) => {
    if (!attempt || !nextQuestion) return;
    const saved = await api.practiceRequest<Feedback | { saved: true }>(`/attempts/${attempt.attempt.id}/answers`, {
      method: "PUT",
      body: JSON.stringify({
        questionId: nextQuestion.id,
        selectedAnswer: answer,
        flagged,
        elapsedSeconds: secondsOnQuestion,
      }),
    });
    setAttempt((current) => current ? {
      ...current,
      answers: [
        ...current.answers.filter((item) => item.question_id !== nextQuestion.id),
        { question_id: nextQuestion.id, selected_answer: answer, flagged, elapsed_seconds: secondsOnQuestion },
      ],
    } : current);
    if ("isCorrect" in saved) setFeedback(saved);
    return saved;
  }, [attempt, question, selected, savedAnswer, secondsOnQuestion]);

  const completeAttempt = useCallback(async () => {
    if (!attempt || busy || result) return;
    setBusy(true);
    setError("");
    try {
      if (question && selected !== savedAnswer?.selected_answer && (selected !== null || savedAnswer)) {
        await saveAnswer(question, selected);
      }
      const completed = await api.practiceRequest<ResultData>(`/attempts/${attempt.attempt.id}/complete`, { method: "POST" });
      setResult(completed);
    } catch (completionError) {
      setError(messageFrom(completionError));
    } finally {
      setBusy(false);
    }
  }, [attempt, busy, result, question, selected, savedAnswer, saveAnswer]);

  useEffect(() => {
    if (!attempt?.attempt.duration_seconds || attempt.attempt.status !== "in_progress") return;
    const deadline = new Date(attempt.attempt.started_at).getTime() + attempt.attempt.duration_seconds * 1000;
    const update = () => setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [attempt]);

  useEffect(() => {
    if (remainingSeconds === 0 && attempt?.attempt.mode === "timed" && attempt.attempt.status === "in_progress"
      && Date.now() >= new Date(attempt.attempt.started_at).getTime() + (attempt.attempt.duration_seconds ?? 0) * 1000) {
      void completeAttempt();
    }
  }, [remainingSeconds, attempt, completeAttempt]);

  useEffect(() => {
    if (!attempt || result || !question) return;
    const timer = window.setInterval(() => setSecondsOnQuestion((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [attempt, result, question]);

  async function loadAttempt(id: string) {
    const data = await api.practiceRequest<AttemptData>(`/attempts/${id}`);
    const answerById = new Map(data.answers.map((answer) => [answer.question_id, answer]));
    const firstUnanswered = data.attempt.question_ids.findIndex((questionId) => !answerById.get(questionId)?.selected_answer);
    const nextIndex = firstUnanswered < 0 ? Math.max(data.attempt.question_ids.length - 1, 0) : firstUnanswered;
    setAttempt(data);
    setIndex(nextIndex);
    const nextQuestionId = data.attempt.question_ids[nextIndex];
    const answer = data.answers.find((saved) => saved.question_id === nextQuestionId);
    setSelected(answer?.selected_answer ?? null);
    setSecondsOnQuestion(0);
    setFeedback(null);
  }

  async function startAttempt() {
    setBusy(true);
    setError("");
    try {
      const started = await api.practiceRequest<{ id: string }>("/attempts", {
        method: "POST",
        body: JSON.stringify({
          mode,
          topicIds: topicId ? [topicId] : [],
          difficulty: difficulty || undefined,
          company: company.trim() || undefined,
          questionCount: mode === "timed" ? 20 : 10,
          durationSeconds: mode === "timed" ? 1200 : undefined,
        }),
      });
      await loadAttempt(started.id);
      setResult(null);
    } catch (startError) {
      setError(messageFrom(startError));
    } finally {
      setBusy(false);
    }
  }

  async function resumeAttempt() {
    setBusy(true);
    setError("");
    try {
      const resumed = await api.practiceRequest<{ id: string } | null>("/attempts/resume");
      if (!resumed) {
        setError("There isn't an unfinished session to resume.");
        return;
      }
      await loadAttempt(resumed.id);
    } catch (resumeError) {
      setError(messageFrom(resumeError));
    } finally {
      setBusy(false);
    }
  }

  async function goTo(nextIndex: number) {
    if (!question || nextIndex < 0 || nextIndex >= questions.length) return;
    if (selected !== savedAnswer?.selected_answer || (savedAnswer?.elapsed_seconds ?? 0) < secondsOnQuestion) {
      await saveAnswer();
    }
    setIndex(nextIndex);
    const answer = attempt?.answers.find((saved) => saved.question_id === questions[nextIndex]?.id);
    setSelected(answer?.selected_answer ?? null);
    setFeedback(null);
    setSecondsOnQuestion(0);
  }

  async function toggleBookmark() {
    if (!question) return;
    setError("");
    try {
      await api.practiceRequest<void>(`/bookmarks/${question.id}`, { method: isBookmarked ? "DELETE" : "PUT" });
      setBookmarks((current) => isBookmarked ? current.filter((id) => id !== question.id) : [...current, question.id]);
    } catch (bookmarkError) {
      setError(messageFrom(bookmarkError));
    }
  }

  function reset() {
    setAttempt(null);
    setResult(null);
    setIndex(0);
    setSelected(null);
    setFeedback(null);
    setError("");
  }

  if (result) {
    const wrong = result.answers.filter((answer) => !answer.is_correct);
    return <section className="practice-page">
      <div className="practice-heading"><span className="eyebrow">YOUR SESSION RESULTS</span><h1>Practice complete</h1><p>Review what felt strong and where another round will help.</p></div>
      <div className="practice-result-score"><strong>{result.score}<span> / {result.total}</span></strong><span>correct answers</span></div>
      <h2>Topic breakdown</h2><div className="practice-breakdown">{result.breakdown.map((item) => <article key={item.topic}><strong>{item.topic}</strong><span>{item.score} of {item.total} correct</span></article>)}</div>
      <h2>Review answers</h2>
      <div className="practice-review">{wrong.length ? wrong.map((answer) => <article key={answer.id}><span className="practice-status">Review</span><h3>{answer.prompt}</h3><p>Your answer: {answer.selected_answer ?? "Not answered"}</p><p>Correct answer: <strong>{answer.correct_answer}</strong></p><p>{answer.explanation}</p><small>Time: {answer.elapsed_seconds ?? 0} seconds</small></article>) : <p>Excellent work—you got every question right.</p>}</div>
      <button className="button button-primary" type="button" onClick={reset}><RotateCcw size={20} /> Start another session</button>
    </section>;
  }

  if (!attempt) {
    return <section className="practice-page">
      <header className="practice-heading"><span className="eyebrow">QUESTION PRACTICE</span><h1>Build confidence, one question at a time.</h1><p>Choose a topic and practice at your pace, or take a timed test.</p></header>
      <div className="practice-setup">
        <label className="practice-field">Topic<select value={topicId} onChange={(event) => setTopicId(event.target.value)}><option value="">All topics</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
        <label className="practice-field">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as QuestionDifficulty | "")}><option value="">Any difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
        <label className="practice-field">Company<input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Optional company filter" /></label>
        <div className="practice-mode"><span>Session type</span><div><button type="button" className={mode === "practice" ? "selected" : ""} onClick={() => setMode("practice")}>Practice</button><button type="button" className={mode === "timed" ? "selected" : ""} onClick={() => setMode("timed")}>Timed test</button></div></div>
        {mode === "timed" && <p className="practice-note">20 questions · 20 minutes · Answers are revealed after submission.</p>}
        {error && <p className="practice-error" role="alert">{error}</p>}
        <button className="button button-primary practice-start" type="button" disabled={busy} onClick={() => void startAttempt()}><Play size={22} />{busy ? "Starting…" : "Start practice"}</button>
        <button className="button button-quiet practice-resume" type="button" disabled={busy} onClick={() => void resumeAttempt()}>Resume unfinished session</button>
      </div>
    </section>;
  }

  return <section className="practice-page">
    <header className="practice-session-header"><div><span className="eyebrow">{attempt.attempt.mode === "timed" ? "TIMED TEST" : "PRACTICE MODE"}</span><h1>Question {index + 1} of {questions.length}</h1></div>{attempt.attempt.mode === "timed" && <div className="practice-countdown" aria-live="polite"><Clock3 size={26} />{Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}</div>}</header>
    <nav className="practice-navigator" aria-label="Question navigator">{questions.map((item, itemIndex) => {
      const answer = attempt.answers.find((saved) => saved.question_id === item.id);
      return <button key={item.id} type="button" aria-label={`Question ${itemIndex + 1}${answer?.selected_answer ? ", answered" : ", unanswered"}${answer?.flagged ? ", flagged" : ""}`} aria-current={itemIndex === index ? "step" : undefined} className={`${itemIndex === index ? "current" : ""}${answer?.selected_answer ? " answered" : ""}${answer?.flagged ? " flagged" : ""}`} onClick={() => void goTo(itemIndex)}>{itemIndex + 1}</button>;
    })}</nav>
    {error && <p className="practice-error" role="alert">{error}</p>}
    {question ? <article className="practice-question">
      <div className="practice-question-meta"><span>{topics.find((topic) => topic.id === question.topic_id)?.name ?? "Question"}</span><span>{question.difficulty}</span><button type="button" className="practice-bookmark" onClick={() => void toggleBookmark()} aria-label={isBookmarked ? "Remove bookmark" : "Bookmark question"}><Bookmark size={24} fill={isBookmarked ? "currentColor" : "none"} /> {isBookmarked ? "Saved" : "Save"}</button></div>
      <h2>{question.prompt}</h2>
      <div className="practice-options" role="radiogroup" aria-label="Answer options">{question.options.map((option) => <button key={option} type="button" role="radio" aria-checked={selected === option} className={`practice-option${selected === option ? " selected" : ""}${feedback && feedback.correctAnswer === option ? " correct" : ""}${feedback && selected === option && !feedback.isCorrect ? " incorrect" : ""}`} disabled={Boolean(feedback)} onClick={() => { setSelected(option); if (attempt.attempt.mode === "timed") void saveAnswer(question, option).catch((saveError: unknown) => setError(messageFrom(saveError))); }}><span className="practice-option-mark">{selected === option ? <Check size={22} /> : null}</span><span>{option}</span></button>)}</div>
      {feedback && <div className={`practice-feedback${feedback.isCorrect ? " success" : " retry"}`} role="status"><strong>{feedback.isCorrect ? "That's right." : "Not quite."}</strong><p>{feedback.explanation}</p></div>}
      <div className="practice-session-actions">
        <button className="button button-quiet" type="button" disabled={index === 0} onClick={() => void goTo(index - 1)}><ChevronLeft size={22} /> Previous</button>
        <button className="practice-flag" type="button" aria-pressed={Boolean(savedAnswer?.flagged)} onClick={() => void saveAnswer(question, selected, !savedAnswer?.flagged)}><Flag size={22} /> {savedAnswer?.flagged ? "Flagged" : "Flag for review"}</button>
        {attempt.attempt.mode === "practice" && !feedback
          ? <button className="button button-primary" type="button" disabled={!selected || busy} onClick={() => void saveAnswer()}><Check size={22} /> Check answer</button>
          : index < questions.length - 1
            ? <button className="button button-primary" type="button" onClick={() => void goTo(index + 1)}>Next <ChevronRight size={22} /></button>
            : <button className="button button-primary" type="button" disabled={busy} onClick={() => void completeAttempt()}>{busy ? "Submitting…" : attempt.attempt.mode === "timed" ? "Submit test" : "Finish practice"} <Check size={22} /></button>}
      </div>
    </article> : <p className="practice-error">This session has no available questions.</p>}
  </section>;
}
