import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { createAiProvider } from "../services/ai.js";
import { MockCodeRunner } from "../services/codeRunner.js";

export const toolsRouter = Router();

const aiSchema = z.object({ prompt: z.string().trim().min(1).max(8000) });
const runSchema = z.object({
  sourceCode: z.string().min(1).max(100000),
  language: z.enum(["javascript", "python", "java", "c++"]),
  input: z.string().max(10000).default(""),
  expectedOutput: z.string().max(10000).default(""),
});

toolsRouter.use(requireAuth);

toolsRouter.post("/ai/chat", async (request: AuthRequest, response, next) => {
  const parsed = aiSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Provide a valid prompt.", details: parsed.error.flatten() } });
  try {
    const provider = createAiProvider();
    let output = "";
    for await (const chunk of provider.streamChat(parsed.data.prompt)) output += chunk;
    response.json({ data: { response: output.trim(), provider: "mock" } });
  } catch (error) { next(error); }
});

toolsRouter.post("/code/run", async (request: AuthRequest, response, next) => {
  const parsed = runSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Provide valid code-run parameters.", details: parsed.error.flatten() } });
  try {
    const result = await new MockCodeRunner().run(parsed.data.sourceCode, parsed.data.language, parsed.data.input, parsed.data.expectedOutput);
    response.json({ data: result });
  } catch (error) { next(error); }
});
