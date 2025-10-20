import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getSupabase } from "@/lib/supabase";

const authOptions = {
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
        const { data } = await getSupabase()
          .from("accounts")
          .select("id, first_name, role, age")
          .eq("first_name", firstName)
          .eq("last_name", lastName)
          .maybeSingle();
        if (!data) return null;
        return { id: data.id, name: data.first_name, role: data.role, age: (data as any)?.age ?? null } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).name = (user as any).name;
        (token as any).role = (user as any).role;
        (token as any).age = (user as any).age ?? null;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      (session as any).user = {
        id: String((token as any)?.id || ""),
        name: String((token as any)?.name ?? ""),
        role: (token as any)?.role ?? "player",
        age: (token as any)?.age ?? null,
      };
      return session;
    },
  },
} as const;

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };


