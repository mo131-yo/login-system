import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { sql, type User } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ROLE_RECHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 минут

async function getActiveSessionUserId(): Promise<string | null> {
  const reqHeaders = await headers();
  const req = { headers: reqHeaders };
  const secret = process.env.AUTH_SECRET!;
  const token =
    (await getToken({ req, secret, secureCookie: true })) ??
    (await getToken({ req, secret, secureCookie: false }));
  return (token?.userId as string | undefined) ?? null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const ip = getClientIp(request);
        const withinEmailLimit = await checkRateLimit(`login:email:${email}`, 10, 15 * 60 * 1000);
        const withinIpLimit = await checkRateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000);
        if (!withinEmailLimit || !withinIpLimit) return null;

        const [user] = await sql<User[]>`SELECT * FROM users WHERE email = ${email}`;
        if (!user || !user.password_hash) return null;

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;

        const [existing] = await sql<User[]>`SELECT * FROM users WHERE email = ${email}`;
        if (!existing) {
          // Google аль хэдийн энэ имэйлийн эзэмшлийг баталгаажуулсан тул
          // давхар баталгаажуулах имэйл шаардлагагүй
          await sql`
            INSERT INTO users (email, name, google_id, email_verified_at)
            VALUES (${email}, ${user.name ?? email}, ${account.providerAccountId}, now())
          `;
        } else if (!existing.google_id && existing.password_hash) {
          // Имэйл эзэмшлийг баталгаажуулдаггүй тул нууц үгтэй хуучин бүртгэлд
          // Google-ийг чимээгүй холбохгүй — зөвхөн яг тэр бүртгэлдээ нэвтэрсэн
          // хэрэглэгч профайл дээрээсээ зориудаар холбож байгаа тохиолдолд зөвшөөрнө
          const activeUserId = await getActiveSessionUserId();
          if (activeUserId !== existing.id) {
            return "/login?error=UseCredentials";
          }
          await sql`
            UPDATE users SET google_id = ${account.providerAccountId}, email_verified_at = COALESCE(email_verified_at, now())
            WHERE id = ${existing.id}
          `;
        } else if (!existing.google_id) {
          await sql`
            UPDATE users SET google_id = ${account.providerAccountId}, email_verified_at = COALESCE(email_verified_at, now())
            WHERE id = ${existing.id}
          `;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.email) {
        const [dbUser] = await sql<User[]>`SELECT * FROM users WHERE email = ${user.email}`;
        if (dbUser) {
          token.userId = dbUser.id;
          token.name = dbUser.name;
          token.role = dbUser.role;
        }
        if (user.image) {
          token.picture = user.image;
        }
        token.roleCheckedAt = Date.now();
      } else if (trigger === "update" && token.userId) {
        const [dbUser] = await sql<User[]>`SELECT * FROM users WHERE id = ${token.userId as string}`;
        if (dbUser) {
          token.name = dbUser.name;
          token.role = dbUser.role;
        }
        token.roleCheckedAt = Date.now();
      } else if (token.userId) {
        // Session нь энгийн шинэчлэлт (навигаци, session fetch) — role-ыг DB-тэй
        // тогтмол бус, ~5 минут тутамд л дахин тулгана. Ингэснээр admin эрх
        // хассаны дараа хамгийн ихдээ 5 минутын дотор /admin хаагдана, гэхдээ
        // хүсэлт бүрт DB рүү хандахгүй (зөвхөн `roleCheckedAt`-аа шинэчилдэг тул
        // энэ шинэчлэлт cookie рүү бодитоор бичигдэх ёстой — jwt callback-ийн
        // token.iat өөрөө request бүрт шинэчлэгддэггүй тул үүнийг өөрсдөө хийнэ).
        const lastChecked = typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0;
        if (Date.now() - lastChecked > ROLE_RECHECK_INTERVAL_MS) {
          const [dbUser] = await sql<Pick<User, "role">[]>`SELECT role FROM users WHERE id = ${token.userId as string}`;
          if (dbUser) {
            token.role = dbUser.role;
          }
          token.roleCheckedAt = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? "";
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.role = (token.role as "user" | "admin") ?? "user";
        session.user.image = (token.picture as string | undefined) ?? session.user.image ?? null;
      }
      return session;
    },
  },
});
