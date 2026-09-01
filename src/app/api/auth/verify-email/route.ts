import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { consumeEmailVerificationToken } from "@/lib/verification-token";

function htmlResponse(title: string, message: string, status: number) {
  return new NextResponse(
    `<!doctype html>
<html lang="mn">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
      .card { background: #fff; border: 1px solid rgba(0,0,0,0.1); border-radius: 16px; padding: 32px; max-width: 360px; text-align: center; }
      h1 { font-size: 18px; margin: 0 0 8px; color: #111827; }
      p { font-size: 14px; color: #6b7280; margin: 0 0 20px; }
      a { display: inline-block; background: #111827; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>${message}</p>
      <a href="/dashboard">Хяналтын самбар руу очих</a>
    </div>
  </body>
</html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";

  if (!token) {
    return htmlResponse("Буруу холбоос", "Баталгаажуулах токен олдсонгүй.", 400);
  }

  const consumed = await consumeEmailVerificationToken(token);
  if (!consumed) {
    return htmlResponse(
      "Холбоосны хугацаа дууссан",
      "Энэ холбоос хүчингүй болсон эсвэл өмнө нь ашигласан байна. Хяналтын самбараас шинэ холбоос дахин илгээж болно.",
      400
    );
  }

  await sql`UPDATE users SET email_verified_at = now() WHERE id = ${consumed.userId} AND email_verified_at IS NULL`;

  return htmlResponse("Имэйл баталгаажлаа", "Таны имэйл хаяг амжилттай баталгаажлаа.", 200);
}
