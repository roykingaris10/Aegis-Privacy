import * as React from "react";
import { ShieldCheck } from "lucide-react";

import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams: { callbackUrl?: string; error?: string };
};

const ERROR_COPY: Record<string, string> = {
  Configuration:
    "The coach is misconfigured. Check the server logs — most likely AUTH_SECRET isn't set.",
  AccessDenied: "That email address isn't allowed to sign in here.",
  Verification:
    "That magic link has expired or was already used. Ask for a new one below.",
};

export default function SignInPage({
  searchParams,
}: Props): React.ReactElement {
  const errorKey = searchParams.error;
  const callbackUrl = searchParams.callbackUrl ?? "/";

  async function sendMagicLink(formData: FormData): Promise<void> {
    "use server";
    const email = (formData.get("email") as string | null)?.trim();
    if (!email) return;
    await signIn("email", {
      email,
      redirectTo: callbackUrl,
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6" />
        <span className="text-lg font-semibold tracking-tight">Aegis</span>
      </div>

      <div className="w-full rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">
          Sign in to Aegis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll email you a one-time link that signs you in. No password.
        </p>

        {errorKey ? (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {ERROR_COPY[errorKey] ??
              "Something went wrong. Try again in a moment."}
          </p>
        ) : null}

        <form action={sendMagicLink} className="mt-6 space-y-3">
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-md border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button type="submit" className="w-full">
            Send sign-in link
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Aegis Privacy Partners · a training platform, not a real consultancy.
      </p>
    </div>
  );
}
