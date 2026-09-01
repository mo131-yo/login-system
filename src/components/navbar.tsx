"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/user-menu";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold">
          Auth System
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {status === "loading" ? null : session ? (
            <UserMenu />
          ) : (
            <>
              <Link href="/login">Нэвтрэх</Link>
              <Link
                href="/signup"
                className="rounded-md bg-foreground px-3 py-1.5 text-background hover:opacity-90"
              >
                Бүртгүүлэх
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
