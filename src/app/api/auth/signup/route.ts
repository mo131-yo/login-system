import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
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

  const [existing] = await sql<{ id: number; google_id: string | null }[]>`
    SELECT id, google_id FROM users WHERE email = ${email}
  `;
  if (existing) {
    const message = existing.google_id
      ? "Энэ имэйл Google акаунтаар бүртгэлтэй байна. Google-ээр нэвтэрнэ үү."
      : "Энэ имэйл хаяг бүртгэлтэй байна";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  await sql`
    INSERT INTO users (email, name, password_hash)
    VALUES (${email}, ${name}, ${passwordHash})
  `;

  return NextResponse.json({ ok: true }, { status: 201 });
}
