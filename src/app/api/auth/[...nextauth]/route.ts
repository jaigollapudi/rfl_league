import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";

const authOptions = {
  session: {
    strategy: "jwt" as const,
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
        // Relax return typing to avoid NextAuth types friction during build
        return { id: data.id, name: data.first_name, role: data.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).name = (user as any).name;
        (token as any).role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      // Ensure safe defaults and avoid strict type mismatches
      (session as any).user = {
        id: String((token as any)?.id || ""),
        name: String((token as any)?.name ?? ""),
        role: (token as any)?.role ?? "player",
      };
      return session;
    },
  },
} as const;

// Relax config typing at callsite to prevent build-time type incompatibilities
const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };


