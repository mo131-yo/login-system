import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql, type User } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
  }

  const [user] = await sql<User[]>`SELECT * FROM users WHERE id = ${session.user.id}`;
  if (!user) {
    return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });
  }

  if (user.password_hash) {
    const body = await request.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";
    const valid = password ? await verifyPassword(password, user.password_hash) : false;
    if (!valid) {
      return NextResponse.json({ error: "Нууц үг буруу байна" }, { status: 400 });
    }
  }

  await sql`DELETE FROM users WHERE id = ${user.id}`;

  return NextResponse.json({ ok: true });
}
