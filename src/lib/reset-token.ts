import crypto from "crypto";
import { sql, type PasswordResetToken } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 цаг

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId} AND used_at IS NULL`;
  await sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
  `;

  return rawToken;
}

export async function consumePasswordResetToken(rawToken: string): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(rawToken);
  const [record] = await sql<PasswordResetToken[]>`
    SELECT * FROM password_reset_tokens WHERE token_hash = ${tokenHash}
  `;

  if (!record) return null;
  if (record.used_at) return null;
  if (new Date(record.expires_at).getTime() < Date.now()) return null;

  await sql`UPDATE password_reset_tokens SET used_at = now() WHERE id = ${record.id}`;

  return { userId: record.user_id };
}
