// Full NextAuth entry. Imported by API routes and server components
// (route.ts files, `auth()` calls in server components, the Session
// provider). Middleware uses auth.config.ts instead to keep the edge
// bundle free of Node-only modules (Prisma + Resend).

import NextAuth, { type NextAuthConfig, type Session } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Resend } from "resend";

import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key && key.trim() ? new Resend(key) : null;
}

function buildAdapter(): Adapter {
  const base = PrismaAdapter(prisma) as Adapter;
  return {
    ...base,
    createUser: async (user) => {
      const created = await prisma.user.create({
        data: {
          email: user.email,
          emailVerified: user.emailVerified,
          name: user.name ?? null,
          image: user.image ?? null,
          skillProgress: {},
          badges: [],
          goals: [],
        },
      });
      return {
        id: created.id,
        email: created.email,
        emailVerified: created.emailVerified,
        name: created.name,
        image: created.image,
      } satisfies AdapterUser;
    },
    // Override: @auth/core passes `identifier` from `?email=` in the
    // callback URL, but the official Prisma adapter's default lookup
    // requires both identifier and token. When the email query param
    // is missing (or Auth.js's internal request parsing drops it),
    // Prisma errors. The token itself is already a hashed secret, so
    // looking it up by token alone is safe — we still verify the
    // identifier matches and check expiry per Auth.js conventions.
    // The official Prisma adapter's useVerificationToken looks up by the
    // compound `identifier_token` key, but Auth.js v5 sometimes loses the
    // identifier query param in transit — leaving Prisma with a half-
    // populated compound key and a PrismaClientValidationError. Look up
    // by token alone (the token is already a per-link random+hashed
    // secret, so this is safe), and enforce the identifier match in
    // code when it is supplied.
    useVerificationToken: async ({ identifier, token }) => {
      const found = await prisma.verificationToken.findFirst({
        where: { token },
      });
      if (!found) return null;
      if (identifier && found.identifier !== identifier) return null;
      await prisma.verificationToken
        .deleteMany({ where: { token } })
        .catch(() => undefined);
      return found;
    },
  };
}

const logBanner = "━".repeat(64);

const emailProvider = {
  id: "email",
  name: "Email",
  type: "email" as const,
  maxAge: 10 * 60,
  from: process.env.AUTH_FROM_EMAIL ?? "Aegis <onboarding@resend.dev>",
  server: { host: "", port: 0, auth: { user: "", pass: "" } },
  options: {},
  async sendVerificationRequest(params: {
    identifier: string;
    url: string;
  }): Promise<void> {
    const { identifier, url } = params;
    const resend = getResend();
    if (!resend) {
      // eslint-disable-next-line no-console
      console.log(
        `\n${logBanner}\n[auth] magic link for ${identifier}:\n  ${url}\n${logBanner}\n`,
      );
      return;
    }
    const { error } = await resend.emails.send({
      from: process.env.AUTH_FROM_EMAIL ?? "Aegis <onboarding@resend.dev>",
      to: identifier,
      subject: "Your Aegis sign-in link",
      html: renderEmailHtml(url),
      text: `Sign in to Aegis: ${url}\n\nThis link expires in 10 minutes. If you didn't request this, you can safely ignore it.`,
    });
    if (error) {
      console.error("[auth] Resend error:", error);
      throw new Error(`Email send failed: ${error.message}`);
    }
  },
};

function renderEmailHtml(url: string): string {
  return `<!doctype html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, Inter, sans-serif; background:#0a0a0a; color:#f4f4f5; margin:0; padding:32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #171717; border: 1px solid #27272a; border-radius: 12px; padding: 32px;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">Sign in to Aegis</h1>
    <p style="color: #a1a1aa; margin: 0 0 24px; line-height: 1.5;">
      Click the button below to sign in to your Aegis training account.
      This link expires in 10 minutes.
    </p>
    <a href="${url}" style="display: inline-block; background: #f4f4f5; color: #0a0a0a; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      Sign in
    </a>
    <p style="color: #71717a; font-size: 13px; margin: 32px 0 0; line-height: 1.5;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`;
}

export const fullAuthConfig: NextAuthConfig = {
  ...authConfig,
  adapter: buildAdapter(),
  providers: [emailProvider],
  callbacks: {
    ...authConfig.callbacks,
    jwt: async ({ token, user }) => {
      // On first sign-in, the adapter supplies the user; persist their
      // id into the JWT so session() can surface it without a DB hit.
      if (user?.id) token.sub = user.id;
      return token;
    },
    session: ({
      session,
      token,
    }: {
      session: Session;
      token: { sub?: string };
    }) => {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(fullAuthConfig);
