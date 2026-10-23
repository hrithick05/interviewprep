import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

loadEnv({ path: resolve(fileURLToPath(new URL(".", import.meta.url)), "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().min(20).optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  JUDGE0_API_URL: z.string().url().optional(),
  JUDGE0_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);

if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
  console.warn("Supabase server access is not configured. Health checks and public pages will work; authenticated API features return 503.");
}
