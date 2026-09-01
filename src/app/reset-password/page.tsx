"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard, AuthField, AuthSubmitButton } from "@/components/auth-card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Нууц үг таарахгүй байна");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Алдаа гарлаа");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!token) {
    return (
      <AuthCard title="Буруу холбоос" subtitle="Токен олдсонгүй">
        <Link href="/forgot-password" className="text-sm font-semibold text-gray-900 dark:text-white">
          Дахин сэргээх хүсэлт илгээх
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Шинэ нууц үг тохируулах" subtitle="Бүртгэлдээ ашиглах шинэ нууц үгээ оруулна уу">
      {success ? (
        <p className="text-sm text-green-600">
          Нууц үг амжилттай солигдлоо. Нэвтрэх хуудас руу шилжиж байна...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthField
            id="password"
            label="Шинэ нууц үг"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Дор хаяж 8 тэмдэгт"
          />

          <AuthField
            id="confirmPassword"
            label="Нууц үг давтах"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Нууц үгээ дахин оруулна уу"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <AuthSubmitButton disabled={loading}>
            {loading ? "Хадгалж байна..." : "Нууц үг солих"}
          </AuthSubmitButton>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
