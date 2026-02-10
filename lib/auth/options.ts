import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../prisma';

const authSecret = process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-me';

const credentialsSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(128),
});

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { username, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { username },
        });
        if (!user) return null;
        if (user.isBanned) {
          throw new Error('Account banned');
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.username,
          username: user.username,
          roles: user.roles,
          publicTag: user.publicTag,
          equippedTitleId: user.equippedTitleId,
          isBanned: user.isBanned,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.username = (user as any).username;
        token.roles = (user as any).roles;
        token.publicTag = (user as any).publicTag;
        token.equippedTitleId = (user as any).equippedTitleId;
        token.isBanned = (user as any).isBanned;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.publicTag = (token.publicTag as string) ?? undefined;
        session.user.equippedTitleId = (token.equippedTitleId as string) ?? undefined;
        session.user.isBanned = token.isBanned as boolean;
      }
      return session;
    },
    async signIn({ user }) {
      if ((user as any)?.isBanned) return false;
      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
  cookies: {
    sessionToken: {
      name: 'gca.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
