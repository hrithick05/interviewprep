import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prepforge/shared";
import { env } from "../config.js";
import { getSupabaseAdmin } from "../supabase.js";

export interface AuthRequest extends Request {
  auth?: { userId: string; role: UserRole; email: string };
}

export async function requireAuth(
  request: AuthRequest,
  response: Response,
  next: NextFunction,
) {
  const authorization = request.header("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!token) {
    response.status(401).json({
      error: { code: "UNAUTHENTICATED", message: "Please sign in to continue." },
    });
    return;
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    response.status(503).json({
      error: { code: "SUPABASE_UNAVAILABLE", message: "Authenticated features need SUPABASE_URL and SUPABASE_SECRET_KEY configured on the API." },
    });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.email) {
    response.status(401).json({
      error: { code: "INVALID_SESSION", message: "Please sign in again." },
    });
    return;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Could not load the authenticated user's profile role:", profileError);
    response.status(503).json({
      error: { code: "PROFILE_UNAVAILABLE", message: "Your profile is temporarily unavailable." },
    });
    return;
  }

  request.auth = {
    userId: data.user.id,
    email: data.user.email,
    role: profile?.role ?? "USER",
  };
  next();
}

export function requireAdmin(
  request: AuthRequest,
  response: Response,
  next: NextFunction,
) {
  if (request.auth?.role !== "ADMIN") {
    response.status(403).json({
      error: { code: "FORBIDDEN", message: "Administrator access is required." },
    });
    return;
  }
  next();
}
