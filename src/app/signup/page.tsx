"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleButton } from "@/components/google-button";
import { AuthCard, AuthDivider, AuthField, AuthSubmitButton } from "@/components/auth-card";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Бүртгэл үүсгэхэд алдаа гарлаа");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Бүртгэл үүслээ, гэхдээ автоматаар нэвтэрч чадсангүй. Нэвтрэх хуудас руу орно уу.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="Бүртгэл үүсгэх"
      subtitle="Тавтай морил! Эхлэхийн тулд мэдээллээ бөглөнө үү"
      footer={
        <>
          Бүртгэлтэй юу?{" "}
          <Link href="/login" className="font-semibold text-gray-900 dark:text-white">
            Нэвтрэх
          </Link>
        </>
      }
    >
      <GoogleButton callbackUrl="/dashboard" />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          id="name"
          label="Нэр"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Нэрээ оруулна уу"
        />

        <AuthField
          id="email"
          label="Имэйл хаяг"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Имэйл хаягаа оруулна уу"
        />

        <AuthField
          id="password"
          label="Нууц үг"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Дор хаяж 8 тэмдэгт"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <AuthSubmitButton disabled={loading}>
          {loading ? "Бүртгэж байна..." : "Үргэлжлүүлэх"}
        </AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
