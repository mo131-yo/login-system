import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL орчны хувьсагч тохируулаагүй байна (.env.local)");
}

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

// DATABASE_URL нь Supabase-ийн "Session pooler" (port 5432, pooler host) ашиглана —
// "Transaction pooler" (port 6543) БИШ. Session mode нь client бүрд тогтвортой нэг
// backend connection олгодог тул postgres.js-ийн server-side prepared statement
// (`prepare: true`, default) найдвартай ажиллана. Transaction mode-д үүнийг ашиглавал
// зэрэгцээ query-үүд hang хийх/"prepared statement does not exist" алдаа өгөх эрсдэлтэй
// (баталгаажуулсан: 6543 дээр prepare:true үед hang, prepare:false-оор засарсан).
export const sql = global.__sql ?? postgres(connectionString, { max: 5 });
if (process.env.NODE_ENV !== "production") {
  global.__sql = sql;
}

export type User = {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  google_id: string | null;
  role: "user" | "admin";
  phone: string | null;
  email_verified_at: string | null;
  created_at: string;
};

export type PasswordResetToken = {
  id: number;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type EmailVerificationToken = {
  id: number;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};
