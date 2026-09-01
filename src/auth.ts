import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { sql, type User } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

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
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

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
        } else if (!existing.google_id) {
          await sql`UPDATE users SET google_id = ${account.providerAccountId} WHERE id = ${existing.id}`;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const [dbUser] = await sql<User[]>`SELECT * FROM users WHERE email = ${user.email}`;
        if (dbUser) {
          token.userId = dbUser.id;
          token.name = dbUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? "");
        session.user.name = (token.name as string) ?? session.user.name;
      }
      return session;
    },
  },
});
