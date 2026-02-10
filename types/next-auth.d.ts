import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      id: string;
      username: string;
      roles: string[];
      publicTag?: string;
      equippedTitleId?: string | null;
      isBanned?: boolean;
    };
  }

  interface User {
    id: string;
    username: string;
    roles: string[];
    publicTag?: string | null;
    equippedTitleId?: string | null;
    isBanned?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    roles: string[];
    publicTag?: string | null;
    equippedTitleId?: string | null;
    isBanned?: boolean;
  }
}
