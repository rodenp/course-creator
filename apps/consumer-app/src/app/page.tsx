// Assuming it's a server component by default in App Router
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import Link from 'next/link';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to the Course Platform</h1>
      <p>This is the main consumer application.</p>

      {session && session.user ? (
        <div>
          <p>You are signed in as {session.user.name || session.user.email}.</p>
          <Link href="/course-creator-dashboard" style={{ marginRight: '10px', color: 'blue' }}>
            Go to Course Creator Dashboard
          </Link>
          <Link href="/api/auth/signout" style={{ color: 'blue' }}>
            Sign Out
          </Link>
        </div>
      ) : (
        <div>
          <p>You are not signed in.</p>
          <Link href="/auth/signin" style={{ color: 'blue' }}>
            Sign In
          </Link>
        </div>
      )}
      {/* This page should be easily modifiable to add other content/components */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
        <h2>Other App Content</h2>
        <p>More features of the consumer app can be displayed here.</p>
      </div>
    </main>
  );
}
