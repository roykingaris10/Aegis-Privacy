// Route protection middleware. Uses the edge-safe auth.config.ts so
// Prisma + Resend + other Node-only code don't get bundled into the
// edge runtime.

import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = [
  /^\/auth(\/.*)?$/,
  /^\/api\/auth(\/.*)?$/,
  /^\/_next(\/.*)?$/,
  /^\/favicon\.ico$/,
];

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((re) => re.test(pathname));
  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    const signIn = new URL("/auth/signin", nextUrl);
    signIn.searchParams.set("callbackUrl", pathname + nextUrl.search);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
