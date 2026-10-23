import { describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  isSupabaseConfigured: false,
  supabase: null,
  requireSupabase: () => {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_PUBLISHABLE_KEY to the project .env file, then restart the app.",
    );
  },
}));

import { api, readApiJson } from "./api";
import { isSupabaseConfigured } from "./supabase";

describe("PrepForge Supabase client", () => {
  it("keeps public pages available before Supabase environment is configured", async () => {
    expect(isSupabaseConfigured).toBe(false);
    await expect(api.me()).resolves.toBeNull();
  });

  it("explains which Supabase settings are needed when auth is used", async () => {
    await expect(api.login("jordan@example.com", "password")).rejects.toThrow(
      "VITE_SUPABASE_PUBLISHABLE_KEY",
    );
  });

  it("explains empty or invalid API responses instead of leaking a JSON parse error", async () => {
    await expect(readApiJson(new Response("", { status: 502 }))).rejects.toThrow(
      "The API returned an empty response (HTTP 502).",
    );
    await expect(readApiJson(new Response("<html>failure</html>", { status: 502 }))).rejects.toThrow(
      "The API returned an invalid response (HTTP 502).",
    );
  });
});
