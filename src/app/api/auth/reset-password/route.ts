import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { consumePasswordResetToken } from "@/lib/reset-token";
import { hashPassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`reset-password:${ip}`, 20, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Хэт олон удаа оролдлоо. 15 минутын дараа дахин оролдоно уу." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token || !password) {
    return NextResponse.json({ error: "Дутуу мэдээлэл" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Нууц үг дор хаяж 8 тэмдэгт байх ёстой" }, { status: 400 });
  }

  const consumed = await consumePasswordResetToken(token);
  if (!consumed) {
    return NextResponse.json(
      { error: "Холбоосны хугацаа дууссан эсвэл буруу байна. Дахин хүсэлт илгээнэ үү." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${consumed.userId}`;

  return NextResponse.json({ ok: true });
}
