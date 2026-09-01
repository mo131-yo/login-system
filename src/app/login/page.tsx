"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleButton } from "@/components/google-button";
import { AuthCard, AuthDivider, AuthField, AuthSubmitButton } from "@/components/auth-card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/post-login";
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Имэйл эсвэл нууц үг буруу байна");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthCard
      title="Нэвтрэх"
      subtitle="Тавтай морил! Үргэлжлүүлэхийн тулд нэвтэрнэ үү"
      footer={
        <>
          Бүртгэлгүй юу?{" "}
          <Link href="/signup" className="font-semibold text-gray-900 dark:text-white">
            Бүртгүүлэх
          </Link>
        </>
      }
    >
      {oauthError === "UseCredentials" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
          Энэ имэйл хаяг нууц үгээр бүртгэлтэй байна. Google-ээр биш, доорх имэйл/нууц үгээр нэвтэрнэ үү.
        </p>
      )}

      <GoogleButton callbackUrl={callbackUrl} />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          id="email"
          label="Имэйл хаяг"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Имэйл хаягаа оруулна уу"
        />

        <div className="flex flex-col gap-1.5">
          <AuthField
            id="password"
            label="Нууц үг"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Нууц үгээ оруулна уу"
          />
          <Link
            href="/forgot-password"
            className="self-end text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Нууц үгээ мартсан уу?
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <AuthSubmitButton disabled={loading}>
          {loading ? "Нэвтэрч байна..." : "Үргэлжлүүлэх"}
        </AuthSubmitButton>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
