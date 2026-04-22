// Edge-safe NextAuth config. Imported by middleware.ts so the edge
// bundle doesn't try to pull in Node-only modules (Prisma adapter,
// Resend, etc). The full config (auth.ts) extends this with providers
// and the Prisma adapter for the runtime that actually signs people in.

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  providers: [],
  // JWT strategy so the middleware (edge runtime) can verify session
  // cookies without a database adapter. The user row still exists via
  // the Prisma adapter in auth.ts — JWT just moves session state from
  // the Session table into a signed cookie.
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth);
    },
  },
} satisfies NextAuthConfig;
