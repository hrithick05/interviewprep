import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { getSupabaseAdmin } from "../supabase.js";
import { scoreQuestionSet } from "../services/scoring.js";

export const practiceRouter = Router();

const filterSchema = z.object({
  topic: z.string().uuid().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  company: z.string().trim().min(1).max(80).optional(),
});

const startSchema = z.object({
  mode: z.enum(["practice", "timed"]),
  topicIds: z.array(z.string().uuid()).max(20).default([]),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  company: z.string().trim().min(1).max(80).optional(),
  questionCount: z.number().int().min(1).max(50).default(10),
  durationSeconds: z.number().int().min(60).max(14400).optional(),
});

const answerSchema = z.object({
  questionId: z.string().uuid(),
  selectedAnswer: z.string().max(2000).nullable(),
  flagged: z.boolean().default(false),
  elapsedSeconds: z.number().int().min(0).max(86400).default(0),
});

const idSchema = z.string().uuid();

function invalid(response: Response, message: string) {
  response.status(400).json({ error: { code: "INVALID_REQUEST", message } });
}

function notFound(response: Response) {
  response.status(404).json({ error: { code: "NOT_FOUND", message: "The requested resource was not found." } });
}

practiceRouter.use(requireAuth);

practiceRouter.get("/topics", async (_request, response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.from("topics").select("id,name,category,description").order("name");
  if (error) throw error;
  response.json({ data });
});

practiceRouter.get("/questions", async (request, response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const parsed = filterSchema.safeParse(request.query);
  if (!parsed.success) return invalid(response, "Check the topic, difficulty, and company filters.");

  let query = supabaseAdmin
    .from("questions")
    .select("id,topic_id,question_type,difficulty,prompt,options,explanation,company_tags")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(100);
  if (parsed.data.topic) query = query.eq("topic_id", parsed.data.topic);
  if (parsed.data.difficulty) query = query.eq("difficulty", parsed.data.difficulty);
  if (parsed.data.company) query = query.contains("company_tags", [parsed.data.company]);

  const { data, error } = await query;
  if (error) throw error;
  response.json({ data });
});

practiceRouter.post("/attempts", async (request: AuthRequest, response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const parsed = startSchema.safeParse(request.body);
  if (!parsed.success) return invalid(response, "Provide a valid practice or timed-test setup.");
  const input = parsed.data;

  let questionQuery = supabaseAdmin.from("questions").select("id").eq("active", true);
  if (input.topicIds.length) questionQuery = questionQuery.in("topic_id", input.topicIds);
  if (input.difficulty) questionQuery = questionQuery.eq("difficulty", input.difficulty);
  if (input.company) questionQuery = questionQuery.contains("company_tags", [input.company]);
  const { data: candidates, error: questionsError } = await questionQuery.limit(500);
  if (questionsError) throw questionsError;
  if (!candidates?.length) return response.status(404).json({ error: { code: "NO_QUESTIONS", message: "No questions match those filters yet." } });

  const selected = [...candidates].sort(() => Math.random() - 0.5).slice(0, input.questionCount);
  const { data, error } = await supabaseAdmin.from("attempts").insert({
    user_id: request.auth!.userId,
    mode: input.mode,
    topic_ids: input.topicIds,
    difficulty: input.difficulty ?? null,
    company: input.company ?? null,
    question_ids: selected.map((question) => question.id),
    duration_seconds: input.mode === "timed" ? (input.durationSeconds ?? 1800) : null,
    total_questions: selected.length,
  }).select("id,mode,status,question_ids,duration_seconds,started_at,total_questions").single();
  if (error) throw error;
  response.status(201).json({ data });
});

practiceRouter.get("/attempts/resume", async (request: AuthRequest, response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.from("attempts")
    .select("id,mode,status,topic_ids,difficulty,company,question_ids,duration_seconds,started_at,total_questions")
    .eq("user_id", request.auth!.userId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return response.json({ data: null });
  const { data: answers, error: answerError } = await supabaseAdmin.from("attempt_answers")
    .select("question_id,selected_answer,flagged,elapsed_seconds")
    .eq("attempt_id", data.id);
  if (answerError) throw answerError;
  response.json({ data: { ...data, answers } });
});

practiceRouter.get("/attempts/:id", async (request: AuthRequest, response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const id = idSchema.safeParse(request.params.id);
  if (!id.success) return invalid(response, "Provide a valid attempt ID.");
  const { data: attempt, error } = await supabaseAdmin.from("attempts")
    .select("*").eq("id", id.data).eq("user_id", request.auth!.userId).maybeSingle();
  if (error) throw error;
  if (!attempt) return notFound(response);

  const [{ data: questions, error: questionError }, { data: answers, error: answerError }] = await Promise.all([
    supabaseAdmin.from("questions")
      .select("id,topic_id,question_type,difficulty,prompt,options,explanation")
      .in("id", attempt.question_ids),
    supabaseAdmin.from("attempt_answers").select("*").eq("attempt_id", attempt.id),
  ]);
  if (questionError) throw questionError;
  if (answerError) throw answerError;
  response.json({ data: { attempt, questions, answers } });
});

practiceRouter.put("/attempts/:id/answers", async (request: AuthRequest, response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const id = idSchema.safeParse(request.params.id);
  const parsed = answerSchema.safeParse(request.body);
  if (!id.success || !parsed.success) return invalid(response, "Provide a valid attempt and answer.");
  const { data: attempt, error: attemptError } = await supabaseAdmin.from("attempts")
    .select("id,mode,status,question_ids,user_id")
    .eq("id", id.data).eq("user_id", request.auth!.userId).maybeSingle();
  if (attemptError) throw attemptError;
  if (!attempt || attempt.status !== "in_progress") return notFound(response);
  if (!attempt.question_ids.includes(parsed.data.questionId)) return invalid(response, "That question is not part of this attempt.");

  const { data: question, error: questionError } = await supabaseAdmin.from("questions")
    .select("correct_answer,explanation").eq("id", parsed.data.questionId).single();
  if (questionError) throw questionError;
  const isCorrect = attempt.mode === "practice" && parsed.data.selectedAnswer !== null
    ? parsed.data.selectedAnswer === question.correct_answer
    : null;
  const { error } = await supabaseAdmin.from("attempt_answers").upsert({
    attempt_id: attempt.id,
    question_id: parsed.data.questionId,
    selected_answer: parsed.data.selectedAnswer,
    is_correct: isCorrect,
    flagged: parsed.data.flagged,
    elapsed_seconds: parsed.data.elapsedSeconds,
    answered_at: parsed.data.selectedAnswer === null ? null : new Date().toISOString(),
  }, { onConflict: "attempt_id,question_id" });
  if (error) throw error;
  response.json({
    data: attempt.mode === "practice"
      ? { isCorrect, correctAnswer: question.correct_answer, explanation: question.explanation }
      : { saved: true },
  });
});

practiceRouter.post("/attempts/:id/complete", async (request: AuthRequest, response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const id = idSchema.safeParse(request.params.id);
  if (!id.success) return invalid(response, "Provide a valid attempt ID.");
  const { data: attempt, error: attemptError } = await supabaseAdmin.from("attempts")
    .select("id,question_ids,status,user_id").eq("id", id.data).eq("user_id", request.auth!.userId).maybeSingle();
  if (attemptError) throw attemptError;
  if (!attempt) return notFound(response);

  const { data: answers, error: answersError } = await supabaseAdmin.from("attempt_answers")
    .select("question_id,selected_answer,elapsed_seconds,flagged")
    .eq("attempt_id", attempt.id);
  if (answersError) throw answersError;
  const { data: questions, error: questionsError } = await supabaseAdmin.from("questions")
    .select("id,topic_id,correct_answer,explanation,prompt,options")
    .in("id", attempt.question_ids);
  if (questionsError) throw questionsError;

  const { score, answers: scoredAnswers } = scoreQuestionSet(questions ?? [], answers ?? []);
  if (attempt.status !== "completed") {
    const { error: updateError } = await supabaseAdmin.from("attempts").update({
      status: "completed", score, completed_at: new Date().toISOString(),
    }).eq("id", attempt.id);
    if (updateError) throw updateError;
    const answerUpdates = await Promise.all(scoredAnswers.map((answer) =>
      supabaseAdmin.from("attempt_answers")
        .update({ is_correct: answer.is_correct })
        .eq("attempt_id", attempt.id)
        .eq("question_id", answer.id),
    ));
    const failedAnswerUpdate = answerUpdates.find((update) => update.error);
    if (failedAnswerUpdate?.error) throw failedAnswerUpdate.error;
  }

  const topicIds = [...new Set(scoredAnswers.map((answer) => answer.topic_id))];
  const { data: topics, error: topicsError } = await supabaseAdmin.from("topics")
    .select("id,name").in("id", topicIds);
  if (topicsError) throw topicsError;
  const topicNames = new Map((topics ?? []).map((topic) => [topic.id, topic.name]));
  const breakdown = topicIds.map((topicId) => {
    const topicAnswers = scoredAnswers.filter((answer) => answer.topic_id === topicId);
    return {
      topic: topicNames.get(topicId) ?? "Unknown topic",
      score: topicAnswers.filter((answer) => answer.is_correct).length,
      total: topicAnswers.length,
    };
  });
  response.json({ data: { score, total: scoredAnswers.length, breakdown, answers: scoredAnswers } });
});

practiceRouter.get("/bookmarks", async (request: AuthRequest, response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.from("bookmarks")
    .select("question_id,created_at").eq("user_id", request.auth!.userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  response.json({ data });
});

practiceRouter.put("/bookmarks/:questionId", async (request: AuthRequest, response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const id = idSchema.safeParse(request.params.questionId);
  if (!id.success) return invalid(response, "Provide a valid question ID.");
  const { error } = await supabaseAdmin.from("bookmarks").upsert({
    user_id: request.auth!.userId, question_id: id.data,
  }, { onConflict: "user_id,question_id" });
  if (error) throw error;
  response.status(204).end();
});

practiceRouter.delete("/bookmarks/:questionId", async (request: AuthRequest, response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const id = idSchema.safeParse(request.params.questionId);
  if (!id.success) return invalid(response, "Provide a valid question ID.");
  const { error } = await supabaseAdmin.from("bookmarks").delete()
    .eq("user_id", request.auth!.userId).eq("question_id", id.data);
  if (error) throw error;
  response.status(204).end();
});
