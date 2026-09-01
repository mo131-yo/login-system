import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "app.db");

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

export const db = global.__db ?? new Database(dbPath);
if (process.env.NODE_ENV !== "production") {
  global.__db = db;
}

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export type User = {
  id: number;
  email: string;
  name: string;
  password_hash: string | null;
  google_id: string | null;
  created_at: string;
};
