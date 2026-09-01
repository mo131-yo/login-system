import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql, type User } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
  }

  if (!(await checkRateLimit(`change-password:${session.user.id}`, 10, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Шинэ нууц үг дор хаяж 8 тэмдэгт байх ёстой" }, { status: 400 });
  }

  const [user] = await sql<User[]>`SELECT * FROM users WHERE id = ${session.user.id}`;
  if (!user) {
    return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });
  }

  if (user.password_hash) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Одоогийн нууц үгээ оруулна уу" }, { status: 400 });
    }
    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Одоогийн нууц үг буруу байна" }, { status: 400 });
    }
  }

  const newHash = await hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${user.id}`;

  return NextResponse.json({ ok: true });
}
