import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import pool from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async signIn({ user }) {
      // Upsert user row on every sign-in
      if (user.email) {
        await pool.query(
          `INSERT INTO users (email, name, image)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO UPDATE SET
             name = EXCLUDED.name,
             image = EXCLUDED.image`,
          [user.email, user.name || null, user.image || null]
        );
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.isAdmin = user.email === process.env.ADMIN_EMAIL;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        (session.user as unknown as Record<string, unknown>).isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
});
