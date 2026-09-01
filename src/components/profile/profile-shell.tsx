"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { key: "profile", label: "Профайл" },
  { key: "security", label: "Аюулгүй байдал" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ProfileShell({
  profileContent,
  securityContent,
}: {
  profileContent: ReactNode;
  securityContent: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("profile");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16 md:flex-row md:gap-10">
      <aside className="shrink-0 md:w-56">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Акаунт</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Профайлаа удирдах</p>
        <nav className="mt-6 flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                tab === t.key
                  ? "bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm shadow-black/5 dark:border-white/10 dark:bg-neutral-900">
        <div className="border-b border-black/5 px-6 py-5 dark:border-white/10">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {tab === "profile" ? "Профайлын дэлгэрэнгүй" : "Аюулгүй байдал"}
          </h2>
        </div>
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {tab === "profile" ? profileContent : securityContent}
        </div>
      </div>
    </div>
  );
}
