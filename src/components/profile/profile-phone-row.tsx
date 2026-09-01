"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfilePhoneRow({ initialPhone }: { initialPhone: string }) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(initialPhone);
  const [savedPhone, setSavedPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Алдаа гарлаа");
      return;
    }

    router.refresh();
    setSavedPhone(phone);
    setEditing(false);
  }

  return (
    <div className="flex items-start justify-between gap-4 px-6 py-5">
      <div className="w-24 shrink-0 pt-2 text-sm text-gray-500 dark:text-gray-400">Утас</div>

      <div className="flex-1">
        {editing ? (
          <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="99112233"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-black/10 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
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
                setPhone(savedPhone);
                setError(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            >
              Цуцлах
            </button>
            {error && <p className="w-full text-sm text-red-600">{error}</p>}
          </form>
        ) : (
          <span className="text-sm text-gray-900 dark:text-white">
            {savedPhone || <span className="text-gray-400 dark:text-gray-500">Нэмээгүй</span>}
          </span>
        )}
      </div>

      {!editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {savedPhone ? "Засах" : "+ Нэмэх"}
        </button>
      )}
    </div>
  );
}
