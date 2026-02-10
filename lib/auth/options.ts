import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../prisma';

const credentialsSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(128),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
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
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = user.username;
        session.user.roles = user.roles;
        session.user.publicTag = user.publicTag ?? undefined;
        session.user.equippedTitleId = user.equippedTitleId ?? undefined;
        session.user.isBanned = user.isBanned;
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
