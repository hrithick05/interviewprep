import { z } from "zod";

export const questionImportRowSchema = z.object({
  topic: z.string().trim().min(1).max(80),
  category: z.enum(["aptitude", "technical", "hr"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  prompt: z.string().trim().min(8).max(4000),
  option1: z.string().trim().min(1).max(500),
  option2: z.string().trim().min(1).max(500),
  option3: z.string().trim().min(1).max(500),
  option4: z.string().trim().min(1).max(500),
  correctAnswer: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(8).max(4000),
  companyTags: z.string().trim().optional(),
});

export type QuestionImportRow = z.infer<typeof questionImportRowSchema>;

export type ImportRowError = { row: number; message: string };

export function validateQuestionImport(rows: unknown[]): {
  valid: QuestionImportRow[];
  errors: ImportRowError[];
} {
  const valid: QuestionImportRow[] = [];
  const errors: ImportRowError[] = [];
  const seen = new Set<string>();
  rows.forEach((raw, index) => {
    const parsed = questionImportRowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({ row: index + 1, message: parsed.error.issues[0]?.message ?? "Invalid row." });
      return;
    }
    const row = parsed.data;
    const options = [row.option1, row.option2, row.option3, row.option4];
    const uniqueOptions = new Set(options);
    if (uniqueOptions.size !== 4) {
      errors.push({ row: index + 1, message: "Options must be four unique values." });
      return;
    }
    if (!options.includes(row.correctAnswer)) {
      errors.push({ row: index + 1, message: "correctAnswer must match exactly one option." });
      return;
    }
    const key = `${row.topic}::${row.prompt.toLowerCase()}`;
    if (seen.has(key)) {
      errors.push({ row: index + 1, message: "Duplicate prompt for this topic." });
      return;
    }
    seen.add(key);
    valid.push(row);
  });
  return { valid, errors };
}
