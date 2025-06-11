import type { Metadata } from "next";
import "./globals.css"; // Assuming globals.css will be created or come with Next.js

export const metadata: Metadata = {
  title: "Course Consumer App",
  description: "Consumes the course creation plugin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
