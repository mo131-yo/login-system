import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const hasName = typeof body?.name === "string";
  const hasPhone = typeof body?.phone === "string";

  if (!hasName && !hasPhone) {
    return NextResponse.json({ error: "Өөрчлөх зүйл алга" }, { status: 400 });
  }

  const name = hasName ? body.name.trim() : undefined;
  if (hasName && !name) {
    return NextResponse.json({ error: "Нэрээ оруулна уу" }, { status: 400 });
  }
  const phone = hasPhone ? body.phone.trim() || null : undefined;

  const userId = session.user.id;

  if (name !== undefined && phone !== undefined) {
    await sql`UPDATE users SET name = ${name}, phone = ${phone} WHERE id = ${userId}`;
  } else if (name !== undefined) {
    await sql`UPDATE users SET name = ${name} WHERE id = ${userId}`;
  } else {
    await sql`UPDATE users SET phone = ${phone as string | null} WHERE id = ${userId}`;
  }

  return NextResponse.json({ ok: true });
}
