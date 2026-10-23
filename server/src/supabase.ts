import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@prepforge/shared";
import { env } from "./config.js";

let adminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error("Supabase server access is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.");
  }
  adminClient ??= createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return adminClient;
}
