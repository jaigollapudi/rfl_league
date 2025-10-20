import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getSupabase } from "@/lib/supabase";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      role: "player" | "leader";
      age?: number | null;
    };
  }
}

const authConfig = {
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        firstName: { label: "First Name", type: "text" },
        lastName: { label: "Last Name", type: "password" },
      },
      async authorize(credentials) {
        const firstName = (credentials?.firstName || "").trim();
        const lastName = (credentials?.lastName || "").trim();

        if (!firstName || !lastName) return null;

        const { data, error } = await getSupabase()
          .from("accounts")
          .select("id, first_name, last_name, role, age")
          .eq("first_name", firstName)
          .eq("last_name", lastName)
          .maybeSingle();

        if (error) return null;
        if (!data) return null;

        return {
          id: data.id,
          name: data.first_name,
          role: data.role as "player" | "leader",
          age: (data as any)?.age ?? null,
        } as { id: string; name: string; role: "player" | "leader"; age?: number | null };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = (user as unknown as { id: string }).id;
        token.name = user.name;
        token.role = (user as unknown as { role: "player" | "leader" }).role;
        token.age = (user as any)?.age ?? null;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.user = {
        id: String(token.id || ""),
        name: String(token.name || ""),
        role: (token as { role?: "player" | "leader" }).role || "player",
        age: (token as any)?.age ?? null,
      };
      return session;
    },
  },
};

const { auth, signIn, signOut } = NextAuth(authConfig);

export { auth, signIn, signOut };


