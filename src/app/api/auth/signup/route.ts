import { NextRequest, NextResponse } from "next/server";
import { db, type User } from "@/lib/db";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

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

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json({ error: "Энэ имэйл хаяг бүртгэлтэй байна" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const result = db
    .prepare("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)")
    .run(email, name, passwordHash);

  const user = db
    .prepare("SELECT id, email, name FROM users WHERE id = ?")
    .get(result.lastInsertRowid) as Pick<User, "id" | "email" | "name">;

  const token = await createSessionToken({ userId: user.id, email: user.email, name: user.name });
  await setSessionCookie(token);

  return NextResponse.json({ user }, { status: 201 });
}
