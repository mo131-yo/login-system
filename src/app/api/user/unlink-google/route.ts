import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql, type User } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
  }

  const [user] = await sql<User[]>`SELECT * FROM users WHERE id = ${Number(session.user.id)}`;
  if (!user) {
    return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });
  }

  if (!user.password_hash) {
    return NextResponse.json(
      { error: "Эхлээд нууц үг тохируулна уу, эс тэгвэл нэвтрэх өөр арга үлдэхгүй" },
      { status: 400 }
    );
  }

  await sql`UPDATE users SET google_id = NULL WHERE id = ${user.id}`;

  return NextResponse.json({ ok: true });
}
