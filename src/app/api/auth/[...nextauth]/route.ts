import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";

const authOptions = {
  session: {
    strategy: "jwt",
  },
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
        const { data } = await supabase
          .from("accounts")
          .select("id, first_name, role")
          .eq("first_name", firstName)
          .eq("last_name", lastName)
          .maybeSingle();
        if (!data) return null;
        return { id: data.id, name: data.first_name, role: data.role } as { id: string; name: string; role: "player" | "leader" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown> & { id?: string; name?: string; role?: 'player' | 'leader' }; user?: { id: string; name: string; role: 'player' | 'leader' } }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.name = user.name;
        (token as { role?: "player" | "leader" }).role = (user as { role: "player" | "leader" }).role;
      }
      return token;
    },
    async session({ session, token }: { session: { user?: { id: string; name: string; role: 'player' | 'leader' } }; token: Record<string, unknown> & { id?: string; name?: string; role?: 'player' | 'leader' } }) {
      session.user = {
        id: String((token as { id?: string }).id || ""),
        name: String(token.name || ""),
        role: (token as { role?: "player" | "leader" }).role || "player",
      };
      return session;
    },
  },
} as const;

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


