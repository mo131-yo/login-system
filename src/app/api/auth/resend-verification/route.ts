import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql, type User } from "@/lib/db";
import { createEmailVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/mailer";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`resend-verification:ip:${ip}`, 5, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Хэт олон удаа оролдлоо. 15 минутын дараа дахин оролдоно уу." },
      { status: 429 }
    );
  }

  const [user] = await sql<User[]>`SELECT * FROM users WHERE id = ${session.user.id}`;
  if (!user) {
    return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });
  }

  if (user.email_verified_at) {
    return NextResponse.json({ message: "Имэйл хаяг аль хэдийн баталгаажсан байна." });
  }

  if (!(await checkRateLimit(`resend-verification:email:${user.email}`, 3, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Хэт олон удаа оролдлоо. 15 минутын дараа дахин оролдоно уу." },
      { status: 429 }
    );
  }

  try {
    const rawToken = await createEmailVerificationToken(user.id);
    const verifyUrl = new URL(`/api/auth/verify-email?token=${rawToken}`, request.nextUrl.origin).toString();
    await sendVerificationEmail(user.email, verifyUrl);
  } catch (err) {
    console.error("Баталгаажуулах имэйл дахин илгээхэд алдаа гарлаа:", err);
    return NextResponse.json({ error: "Имэйл илгээхэд алдаа гарлаа. Дараа дахин оролдоно уу." }, { status: 500 });
  }

  return NextResponse.json({ message: "Баталгаажуулах имэйл дахин илгээгдлээ." });
}
