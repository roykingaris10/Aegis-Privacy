import * as React from "react";
import Link from "next/link";
import { AlertCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = { searchParams: { error?: string } };

const COPY: Record<string, { title: string; body: string }> = {
  Configuration: {
    title: "Sign-in is misconfigured",
    body: "The server is missing AUTH_SECRET or another required environment variable. Check the dev console.",
  },
  AccessDenied: {
    title: "Access denied",
    body: "That email address isn't allowed to sign in to this deployment.",
  },
  Verification: {
    title: "That link has expired",
    body: "Magic links expire after 10 minutes, and can only be used once. Ask for a fresh one.",
  },
};

export default function AuthErrorPage({
  searchParams,
}: Props): React.ReactElement {
  const copy = COPY[searchParams.error ?? ""] ?? {
    title: "Something went wrong",
    body: "Sign-in failed unexpectedly. Try again in a moment.",
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6" />
        <span className="text-lg font-semibold tracking-tight">Aegis</span>
      </div>

      <div className="w-full rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
        <Button asChild className="mt-6">
          <Link href="/auth/signin">Try again</Link>
        </Button>
      </div>
    </div>
  );
}
