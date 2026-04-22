// Auth-backed current-user helpers. Server-only.
//
// Sprint 3a replaced the hardcoded stub from Sprint 1 with real session
// reads via NextAuth. Middleware guarantees that authenticated routes
// reach these helpers with a session attached — the explicit throws
// here defend against mis-routing or future middleware changes.
//
// Migration note: the seeded test user (roy@aegis.local) was created
// with id "user_roy_local". When the real person signs in with that
// email, the PrismaAdapter finds the existing row by email, links an
// Account to it, and preserves all Aegis state (XP, streak, badges,
// completions). No special-case code is required.

import type { User } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export class UnauthorizedError extends Error {
  readonly code = "unauthorized" as const;
  constructor() {
    super("Not signed in.");
  }
}

/**
 * Resolves the current signed-in user from the NextAuth session.
 * Throws UnauthorizedError if no session is present — middleware
 * usually prevents this, but API routes run before middleware can
 * redirect, so callers must handle it.
 */
export async function getCurrentUser(): Promise<User> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new UnauthorizedError();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function getCurrentUserOrNull(): Promise<User | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

export async function requireCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  return user.id;
}
