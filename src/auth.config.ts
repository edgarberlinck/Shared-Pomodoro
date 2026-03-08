import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Lightweight auth config for Edge Runtime (middleware)
// Does NOT import Prisma or bcrypt
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    // Provider definition is required but authorize runs only on Node.js
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async () => null,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
