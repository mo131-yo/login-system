import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createEmailVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`signup:${ip}`, 5, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Хэт олон удаа оролдлоо. 15 минутын дараа дахин оролдоно уу." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Нэр, имэйл, нууц үг бүгдийг бөглөнө үү" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Нууц үг дор хаяж 8 тэмдэгт байх ёстой" }, { status: 400 });
  }

  const [existing] = await sql<{ id: string; google_id: string | null }[]>`
    SELECT id, google_id FROM users WHERE email = ${email}
  `;
  if (existing) {
    const message = existing.google_id
      ? "Энэ имэйл Google акаунтаар бүртгэлтэй байна. Google-ээр нэвтэрнэ үү."
      : "Энэ имэйл хаяг бүртгэлтэй байна";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const [inserted] = await sql<{ id: string }[]>`
    INSERT INTO users (email, name, password_hash)
    VALUES (${email}, ${name}, ${passwordHash})
    RETURNING id
  `;

  try {
    const rawToken = await createEmailVerificationToken(inserted.id);
    const verifyUrl = new URL(`/api/auth/verify-email?token=${rawToken}`, request.nextUrl.origin).toString();
    await sendVerificationEmail(email, verifyUrl);
  } catch (err) {
    // Бүртгэл үүссэн хэвээр байна — баталгаажуулах имэйлийг дараа нь дахин
    // (resend-verification) илгээж болно, тиймээс энд бүртгэлийг унагаахгүй
    console.error("Баталгаажуулах имэйл илгээхэд алдаа гарлаа:", err);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
