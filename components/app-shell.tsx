"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

type Props = {
  children: React.ReactNode;
};

/**
 * Renders the sidebar + topbar chrome around app routes, but skips the
 * chrome on pre-login and onboarding routes so those feel distinct
 * from the main product.
 */
export function AppShell({ children }: Props): React.ReactElement {
  const pathname = usePathname();
  const chromeless =
    pathname.startsWith("/auth") || pathname.startsWith("/onboarding");

  if (chromeless) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
