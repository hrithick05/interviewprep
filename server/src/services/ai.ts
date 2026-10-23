import { z } from "zod";

export interface AiProvider {
  completeJson(prompt: string, schema: z.ZodType): Promise<unknown>;
  streamChat(prompt: string): AsyncIterable<string>;
}

export class MockAiProvider implements AiProvider {
  async completeJson(prompt: string, schema: z.ZodType): Promise<unknown> {
    const result = {
      communication: 8,
      technicalDepth: 7,
      structure: 8,
      confidence: 7,
      strengths: ["Clear explanation", "Logical structure"],
      weaknesses: ["Add a more specific example"],
      actionPlan: ["Practice one STAR answer using a measurable result."],
      summary: `Deterministic mock review for: ${prompt.slice(0, 120)}`,
      improvedAnswer: "Situation: A project had a tight deadline. Task: I owned a critical integration. Action: I clarified priorities, reduced risk, and communicated progress. Result: We delivered the agreed scope with measurable quality improvements.",
      followUp: "What measurable result came from your action?",
    };
    return schema.parse(result);
  }

  async *streamChat(prompt: string): AsyncIterable<string> {
    const response = `This is a deterministic mock interview response to “${prompt.slice(0, 80)}”. Use the STAR structure, explain your own contribution, and finish with a measurable result.`;
    for (const word of response.split(" ")) yield `${word} `;
  }
}

export function createAiProvider(): AiProvider {
  return new MockAiProvider();
}
