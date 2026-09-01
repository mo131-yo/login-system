import { NextRequest, NextResponse } from "next/server";
import { sql, type User } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/reset-token";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const GENERIC_MESSAGE =
  "Хэрэв энэ имэйл хаяг бүртгэлтэй бол нууц үг сэргээх холбоос илгээгдлээ. Инбоксоо шалгана уу.";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`forgot-password:ip:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Хэт олон удаа оролдлоо. 15 минутын дараа дахин оролдоно уу." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Имэйл хаягаа оруулна уу" }, { status: 400 });
  }

  if (!checkRateLimit(`forgot-password:email:${email}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const [user] = await sql<User[]>`SELECT * FROM users WHERE email = ${email}`;

  if (user?.password_hash) {
    const rawToken = await createPasswordResetToken(user.id);
    const resetUrl = new URL(`/reset-password?token=${rawToken}`, request.nextUrl.origin).toString();
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      console.error("Нууц үг сэргээх имэйл илгээхэд алдаа гарлаа:", err);
      return NextResponse.json({ error: "Имэйл илгээхэд алдаа гарлаа. Дараа дахин оролдоно уу." }, { status: 500 });
    }
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
