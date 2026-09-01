"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

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
            <>
              <Link href="/dashboard">Dashboard</Link>
              <span className="text-black/60 dark:text-white/60">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md bg-black/5 px-3 py-1.5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
              >
                Гарах
              </button>
            </>
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
