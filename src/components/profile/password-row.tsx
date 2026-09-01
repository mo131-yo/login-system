"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PasswordRow({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Шинэ нууц үг таарахгүй байна");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Алдаа гарлаа");
      return;
    }

    resetForm();
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="flex items-start justify-between gap-4 px-6 py-5">
      <div className="w-24 shrink-0 pt-2 text-sm text-gray-500 dark:text-gray-400">Нууц үг</div>

      <div className="flex-1">
        {!editing ? (
          <span className="text-sm text-gray-900 dark:text-white">
            {hasPassword ? "••••••••" : <span className="text-gray-400 dark:text-gray-500">Тохируулаагүй</span>}
          </span>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {hasPassword && (
              <input
                type="password"
                required
                placeholder="Одоогийн нууц үг"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-black/10 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
            )}
            <input
              type="password"
              required
              minLength={8}
              placeholder="Шинэ нууц үг"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-black/10 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Шинэ нууц үг давтах"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-black/10 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900"
              >
                {loading ? "..." : "Хадгалах"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  resetForm();
                }}
                className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              >
                Цуцлах
              </button>
            </div>
          </form>
        )}
      </div>

      {!editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {hasPassword ? "Солих" : "Тохируулах"}
        </button>
      )}
    </div>
  );
}
