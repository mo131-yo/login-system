"use client";

import { useState } from "react";

export function ResendVerificationBanner() {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleResend() {
    setStatus("loading");
    setMessage(null);

    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Алдаа гарлаа");
      return;
    }

    setStatus("sent");
    setMessage(data.message ?? "Баталгаажуулах имэйл дахин илгээгдлээ.");
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-500/20 dark:bg-amber-500/10">
      <span className="text-amber-800 dark:text-amber-400">
        {message ?? "Имэйл хаягаа баталгаажуулаагүй байна."}
      </span>
      {status !== "sent" && (
        <button
          type="button"
          onClick={handleResend}
          disabled={status === "loading"}
          className="shrink-0 rounded-md bg-amber-800/10 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-800/20 disabled:opacity-50 dark:bg-amber-400/10 dark:text-amber-300 dark:hover:bg-amber-400/20"
        >
          {status === "loading" ? "Илгээж байна..." : "Дахин имэйл илгээх"}
        </button>
      )}
    </div>
  );
}
