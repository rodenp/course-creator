import type { Metadata } from "next";
import "./globals.css"; // Assuming globals.css will be created or come with Next.js
import { NextAuthProvider } from "@/components/NextAuthProvider"; // Assuming @ is src/

export const metadata: Metadata = {
  title: "Course Consumer App",
  description: "Consumes the course creation plugin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Optional: Fetch session on server for initial state for SessionProvider
  // import { getServerSession } from "next-auth/next"
  // import { authOptions } from "./api/auth/[...nextauth]/route" // careful with path
  // const session = await getServerSession(authOptions) // This would make RootLayout async

  return (
    <html lang="en">
      <body>
        <NextAuthProvider /*session={session}*/>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
