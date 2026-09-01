import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL орчны хувьсагч тохируулаагүй байна (.env.local)");
}

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

export const sql = global.__sql ?? postgres(connectionString, { max: 5 });
if (process.env.NODE_ENV !== "production") {
  global.__sql = sql;
}

export type User = {
  id: number;
  email: string;
  name: string;
  password_hash: string | null;
  google_id: string | null;
  role: "user" | "admin";
  phone: string | null;
  created_at: string;
};

export type PasswordResetToken = {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};
