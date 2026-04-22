import * as React from "react";
import { Mail, ShieldCheck } from "lucide-react";

export default function VerifyRequestPage(): React.ReactElement {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6" />
        <span className="text-lg font-semibold tracking-tight">Aegis</span>
      </div>

      <div className="w-full rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Check your inbox
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve sent you a sign-in link. It expires in 10 minutes. You can
          close this tab — clicking the link in your email will bring you back
          here, signed in.
        </p>
        <p className="mt-5 text-xs text-muted-foreground">
          Can&apos;t see it? Check spam, or try again with the same email
          address.
        </p>
      </div>
    </div>
  );
}
