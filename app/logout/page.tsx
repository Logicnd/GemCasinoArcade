'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function LogoutPage() {
  useEffect(() => {
    signOut({ callbackUrl: '/' });
  }, []);
  return <p className="p-6 text-center text-sm text-muted-foreground">Signing out...</p>;
}
