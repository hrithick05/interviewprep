import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@prepforge/shared";

const projectUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const missingConfig = [
  !projectUrl && "VITE_SUPABASE_URL",
  !publishableKey && "VITE_SUPABASE_PUBLISHABLE_KEY",
].filter((value): value is string => Boolean(value));

export const isSupabaseConfigured = missingConfig.length === 0;

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(projectUrl!, publishableKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      `Supabase is not configured. Add ${missingConfig.join(" and ")} to the project .env file, then restart the app.`,
    );
  }
  return supabase;
}
