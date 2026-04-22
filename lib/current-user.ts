// Single-user shim until NextAuth lands. The hardcoded id matches the seed.
// Every feature that will later read from a session should go through this
// helper so auth can be dropped in with one change.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const CURRENT_USER_ID = "user_roy_local";

type UserRecord = Prisma.UserGetPayload<Record<string, never>>;

/** Fetches the current user, creating a seed-matching row if missing. */
export async function getCurrentUser(): Promise<UserRecord> {
  const existing = await prisma.user.findUnique({
    where: { id: CURRENT_USER_ID },
  });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      id: CURRENT_USER_ID,
      email: "roy@aegis.local",
      name: "Roy",
      skillProgress: {},
      badges: [],
    },
  });
}

export async function requireCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  return user.id;
}
