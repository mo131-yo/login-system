"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function DangerZoneRow({ requiresPassword }: { requiresPassword: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/user/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: requiresPassword ? password : undefined }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      setError(data.error ?? "Алдаа гарлаа");
      return;
    }

    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="flex items-start justify-between gap-4 px-6 py-5">
      <div className="w-24 shrink-0 pt-2 text-sm text-gray-500 dark:text-gray-400">Бүртгэл</div>

      <div className="flex-1">
        <p className="text-sm text-gray-900 dark:text-white">Бүртгэлээ устгах</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Бүх мэдээлэл буцаагдашгүйгээр устана.
        </p>

        {confirming && (
          <form onSubmit={handleDelete} className="mt-3 flex flex-col gap-2">
            {requiresPassword && (
              <input
                type="password"
                required
                placeholder="Баталгаажуулах нууц үг"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Устгаж байна..." : "Тийм, устгах"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setError(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              >
                Цуцлах
              </button>
            </div>
          </form>
        )}
      </div>

      {!confirming && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Устгах
        </button>
      )}
    </div>
  );
}
