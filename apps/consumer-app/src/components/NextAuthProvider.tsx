"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth"; // Optional: for typing the session prop

type Props = {
  children?: React.ReactNode;
  session?: Session; // Optional: if passing initial session from server component
};

export const NextAuthProvider = ({ children, session }: Props) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};
