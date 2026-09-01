import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { sql, type User } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

async function getActiveSessionUserId(): Promise<number | null> {
  const reqHeaders = await headers();
  const req = { headers: reqHeaders };
  const secret = process.env.AUTH_SECRET!;
  const token =
    (await getToken({ req, secret, secureCookie: true })) ??
    (await getToken({ req, secret, secureCookie: false }));
  return token?.userId ? Number(token.userId) : null;
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
        const withinEmailLimit = checkRateLimit(`login:email:${email}`, 10, 15 * 60 * 1000);
        const withinIpLimit = checkRateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000);
        if (!withinEmailLimit || !withinIpLimit) return null;

        const [user] = await sql<User[]>`SELECT * FROM users WHERE email = ${email}`;
        if (!user || !user.password_hash) return null;

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) return null;

        return { id: String(user.id), email: user.email, name: user.name };
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
          await sql`
            INSERT INTO users (email, name, google_id)
            VALUES (${email}, ${user.name ?? email}, ${account.providerAccountId})
          `;
        } else if (!existing.google_id && existing.password_hash) {
          // Имэйл эзэмшлийг баталгаажуулдаггүй тул нууц үгтэй хуучин бүртгэлд
          // Google-ийг чимээгүй холбохгүй — зөвхөн яг тэр бүртгэлдээ нэвтэрсэн
          // хэрэглэгч профайл дээрээсээ зориудаар холбож байгаа тохиолдолд зөвшөөрнө
          const activeUserId = await getActiveSessionUserId();
          if (activeUserId !== existing.id) {
            return "/login?error=UseCredentials";
          }
          await sql`UPDATE users SET google_id = ${account.providerAccountId} WHERE id = ${existing.id}`;
        } else if (!existing.google_id) {
          await sql`UPDATE users SET google_id = ${account.providerAccountId} WHERE id = ${existing.id}`;
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
      } else if (trigger === "update" && token.userId) {
        const [dbUser] = await sql<User[]>`SELECT * FROM users WHERE id = ${Number(token.userId)}`;
        if (dbUser) {
          token.name = dbUser.name;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? "");
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.role = (token.role as "user" | "admin") ?? "user";
        session.user.image = (token.picture as string | undefined) ?? session.user.image ?? null;
      }
      return session;
    },
  },
});
