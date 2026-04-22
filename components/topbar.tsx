"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

function titleFromPath(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/inbox")) return "Inbox";
  if (pathname.startsWith("/learn")) return "Learn";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/scenario")) return "Scenario";
  return "Aegis";
}

function initialsOf(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email;
  return source
    .split(/\s+|@|\./)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar(): React.ReactElement {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const displayName = user?.name ?? user?.email ?? "Trainee";
  const email = user?.email ?? "";
  const initials = initialsOf(user?.name, email);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h1 className="text-sm font-medium text-muted-foreground">
        {titleFromPath(pathname)}
      </h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar>
              <AvatarFallback className="text-xs font-semibold">
                {initials || "…"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{displayName}</div>
              {email ? (
                <div className="text-xs text-muted-foreground">{email}</div>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Settings (soon)</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
