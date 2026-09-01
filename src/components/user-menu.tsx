"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Avatar } from "@/components/avatar";

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:focus:ring-white dark:focus:ring-offset-neutral-950"
        aria-label="Хэрэглэгчийн цэс"
      >
        <Avatar src={session.user.image} name={session.user.name} size={32} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl shadow-black/5 dark:border-white/10 dark:bg-neutral-900">
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar src={session.user.image} name={session.user.name} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {session.user.name}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {session.user.email}
              </p>
            </div>
          </div>

          <div className="border-t border-black/5 py-1 dark:border-white/10">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Профайл
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Хяналтын самбар
            </Link>
            {session.user.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Admin Panel
              </Link>
            )}
          </div>

          <div className="border-t border-black/5 py-1 dark:border-white/10">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Гарах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
