import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { CoursePlugin, type PluginUserInfo, type PluginStripeConfig, type StorageConfig } from "@course-app/plugin";
// The above import relies on workspaces being linked and plugin being built or TS paths configured.
// It might fail if plugin isn't built and linked. For now, assume it conceptually works.
import { redirect } from 'next/navigation';

export default async function CourseCreatorDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    redirect('/auth/signin?callbackUrl=/course-creator-dashboard'); // Redirect to sign-in if not authenticated
    return null; // Or return a loading/unauthorized component
  }

  const userInfo: PluginUserInfo = {
    id: (session.user as any).id,
    email: session.user.email || undefined,
    name: session.user.name || undefined,
    // TODO: Get planId and planStatus from session once added in authOptions callback
    planId: (session.user as any).plan || 'free', // Placeholder
    planStatus: (session.user as any).planStatus || 'active', // Placeholder
  };

  const storageConfig: StorageConfig = {
    // Assuming API routes are hosted on the same domain, relative path is /api
    // In production, this might be a full URL from an environment variable.
    apiUrl: '/api',
    apiKey: 'TEST_API_KEY' // Placeholder: This should be securely managed,
                           // perhaps user-specific or not needed if session auth protects API routes.
                           // The API routes were set up to check for this key.
  };

  const stripeConfig: PluginStripeConfig = {
    // This should come from environment variables on the consumer app
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_YOUR_STRIPE_PUBLISHABLE_KEY",
  };

  return (
    <div>
      <header style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <h1>Course Creator Dashboard</h1>
        <p>Welcome, {userInfo.name || userInfo.email}!</p>
      </header>
      <main style={{ padding: '1rem' }}>
        {/* Reminder: npm install is needed for @course-app/plugin to be resolved */}
        {/* Reminder: @course-app/plugin needs a build step (e.g. tsup) */}
        <CoursePlugin
          userInfo={userInfo}
          storageConfig={storageConfig}
          stripeConfig={stripeConfig}
          showDebugPanel={process.env.NODE_ENV === 'development'}
        />
      </main>
    </div>
  );
}
