import type {
  AuthResponse,
  OnboardingInput,
  PublicUser,
  TextSize,
  UserProfileRow,
} from "@prepforge/shared";
import { requireSupabase, supabase } from "./supabase";

const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? "";

export type SignupResult =
  | { confirmationRequired: true }
  | { confirmationRequired: false; data: AuthResponse };

export async function readApiJson<T>(response: Response): Promise<T> {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`The API returned an empty response (HTTP ${response.status}). Check that the API service is running.`);
  }
  try {
    return JSON.parse(body) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`The API returned an invalid response (HTTP ${response.status}). Check the API service logs.`);
    }
    throw error;
  }
}

function authenticationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/response.*json|unexpected end of json/i.test(message)) {
    return "Supabase returned an empty or invalid response during authentication. Check the Supabase project URL, publishable key, and Auth service status.";
  }
  return message || "The authentication request could not be completed.";
}

async function runAuthRequest<T>(request: () => PromiseLike<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw new Error(authenticationErrorMessage(error));
  }
}

function toPublicUser(profile: UserProfileRow, email: string): PublicUser {
  return {
    id: profile.id,
    email,
    name: profile.full_name || email.split("@")[0] || "PrepForge member",
    role: profile.role,
    profile: {
      targetRole: profile.target_role,
      experienceLevel: profile.experience_level,
      targetCompanies: profile.target_companies,
      dailyGoalMinutes: profile.daily_goal_minutes,
      onboardingComplete: profile.onboarding_complete,
      textSize: profile.text_size,
    },
  };
}

function throwIfError(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message);
}

async function getProfile(userId: string, email: string, fullName: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  throwIfError(error);
  if (data) return toPublicUser(data, email);

  const { data: created, error: insertError } = await client
    .from("user_profiles")
    .insert({ id: userId, full_name: fullName })
    .select("*")
    .single();
  throwIfError(insertError);
  return toPublicUser(created, email);
}

export const api = {
  async practiceRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const client = requireSupabase();
    const { data: { session }, error } = await client.auth.getSession();
    throwIfError(error);
    if (!session?.access_token) throw new Error("Your session expired. Please sign in again.");
    const response = await fetch(`${apiBaseUrl}/api/v1/practice${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...options.headers,
      },
    });
    if (!response.ok) {
      const result = await readApiJson<{ error?: { message?: string } }>(response);
      throw new Error(result.error?.message || "The practice request could not be completed.");
    }
    if (response.status === 204) return undefined as T;
    const result = await readApiJson<{ data: T }>(response);
    return result.data;
  },

  async me(): Promise<AuthResponse | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (error.name === "AuthSessionMissingError") return null;
      throw new Error(error.message);
    }
    const user = data.user;
    if (!user?.email) return null;
    const fullName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : "";
    return { user: await getProfile(user.id, user.email, fullName) };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const client = requireSupabase();
    const { data, error } = await runAuthRequest(() => client.auth.signInWithPassword({ email, password }));
    throwIfError(error);
    if (!data.user?.email) throw new Error("Supabase signed in without returning a user.");
    const fullName = typeof data.user.user_metadata.full_name === "string" ? data.user.user_metadata.full_name : "";
    return { user: await getProfile(data.user.id, data.user.email, fullName) };
  },

  async signup(email: string, name: string, password: string): Promise<SignupResult> {
    const client = requireSupabase();
    const { data, error } = await runAuthRequest(() => client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      }));
    throwIfError(error);
    if (!data.session) return { confirmationRequired: true };
    if (!data.user?.email) throw new Error("Supabase created a session without returning a user.");
    return {
      confirmationRequired: false,
      data: { user: await getProfile(data.user.id, data.user.email, name) },
    };
  },

  async logout() {
    const { error } = await requireSupabase().auth.signOut();
    throwIfError(error);
    return { loggedOut: true };
  },

  async saveOnboarding(input: OnboardingInput): Promise<AuthResponse> {
    const client = requireSupabase();
    const { data: authData, error: authError } = await client.auth.getUser();
    throwIfError(authError);
    if (!authData.user?.email) throw new Error("Your session expired. Please sign in again.");

    const { data, error } = await client
      .from("user_profiles")
      .update({
        target_role: input.targetRole,
        experience_level: input.experienceLevel,
        target_companies: input.targetCompanies,
        daily_goal_minutes: input.dailyGoalMinutes,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id)
      .select("*")
      .single();
    throwIfError(error);
    return { user: toPublicUser(data, authData.user.email) };
  },

  async saveTextSize(textSize: TextSize): Promise<AuthResponse> {
    const client = requireSupabase();
    const { data: authData, error: authError } = await client.auth.getUser();
    throwIfError(authError);
    if (!authData.user?.email) throw new Error("Your session expired. Please sign in again.");
    const { data, error } = await client.from("user_profiles")
      .update({ text_size: textSize, updated_at: new Date().toISOString() })
      .eq("id", authData.user.id).select("*").single();
    throwIfError(error);
    return { user: toPublicUser(data, authData.user.email) };
  },
};

export type { PublicUser };
