"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard, AuthField, AuthSubmitButton } from "@/components/auth-card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Алдаа гарлаа");
      return;
    }

    setMessage(data.message);
  }

  return (
    <AuthCard
      title="Нууц үг сэргээх"
      subtitle="Бүртгэлтэй имэйл хаягаа оруулбал сэргээх холбоос илгээнэ"
      footer={
        <Link href="/login" className="font-semibold text-gray-900 dark:text-white">
          Нэвтрэх хуудас руу буцах
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          id="email"
          label="Имэйл хаяг"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Имэйл хаягаа оруулна уу"
          disabled={!!message}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        {!message && (
          <AuthSubmitButton disabled={loading}>
            {loading ? "Илгээж байна..." : "Холбоос илгээх"}
          </AuthSubmitButton>
        )}
      </form>
    </AuthCard>
  );
}
