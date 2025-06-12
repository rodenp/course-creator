import NextAuth, { type NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma'; // Adjust path if necessary, assuming @ is src/

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any, // 'as any' can help with type mismatches sometimes, or ensure adapter version matches NextAuth
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // IMPORTANT: This is a placeholder authorize function.
        // In a real application, you would:
        // 1. Validate credentials.email and credentials.password.
        // 2. Find the user in your database by email.
        //    const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        // 3. If user found, compare the provided password with the stored hashed password.
        //    (You'll need a library like bcryptjs for hashing and comparison:
        //     `npm install bcryptjs` and `@types/bcryptjs`)
        //    const isValid = user ? await bcrypt.compare(credentials.password, user.hashedPassword) : false;
        // 4. If credentials are valid, return the user object (must include at least `id` and `email`).
        //    if (isValid && user) { return { id: user.id, email: user.email, name: user.name }; }

        // For now, accept any credentials for testing if email is provided.
        if (credentials?.email) {
          // Simulate finding or creating a user for placeholder purposes
          let user = await prisma.user.findUnique({ where: { email: credentials.email }});
          if (!user) {
            // For testing, create user if not exists. In production, only allow login for existing users.
            // Also, password should be hashed before saving. This is highly insecure for production.
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split('@')[0], // simple name
                // hashedPassword: "hashed_password_here" // Should be properly hashed
              }
            });
          }
          return { id: user.id, email: user.email, name: user.name }; // Return what NextAuth expects
        }
        // If you return null then an error will be displayed advising the user to check their details.
        return null;
        // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
      }
    })
    // TODO: Add other providers like Google, GitHub, etc.
    // Example:
    // import GoogleProvider from 'next-auth/providers/google';
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],
  session: {
    // strategy: 'jwt', // Or 'database'. JWT is often simpler to start with if not needing DB sessions for specific features.
                     // Database strategy is good with PrismaAdapter for full DB session persistence. Let's use 'database'.
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async session({ session, token, user }) {
      // If using JWT strategy, token contains JWT fields.
      // If using database strategy, user object from DB is available.
      if (session.user && user) {
        (session.user as any).id = user.id; // Add user ID to the session
        // TODO: Add user's plan/subscription status to the session here
        // const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
        // (session.user as any).plan = subscription ? subscription.planId : null;
        // (session.user as any).planStatus = subscription ? subscription.status : null;
      }
      return session;
    },
    // If using JWTs, you might need a jwt callback to put user ID into the token
    // async jwt({ token, user }) {
    //   if (user) {
    //     token.id = user.id;
    //   }
    //   return token;
    // }
  },
  pages: {
    signIn: '/auth/signin', // Example: Path to custom sign-in page
    // error: '/auth/error', // Error code passed in query string as ?error=
    // signOut: '/auth/signout'
  },
  // debug: process.env.NODE_ENV === 'development', // Enable debug messages in development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
