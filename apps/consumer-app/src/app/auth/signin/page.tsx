'use client'; // Required for event handlers like onClick, and hooks like useSearchParams

import { signIn, getCsrfToken, getProviders } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Provider = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
};

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  // const [providers, setProviders] = useState<Record<string, Provider> | null>(null); // For OAuth providers

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/'; // Redirect after login

  useEffect(() => {
    const fetchCsrfToken = async () => {
      const token = await getCsrfToken();
      setCsrfToken(token);
    };
    // const fetchProviders = async () => {
    //   const res = await getProviders();
    //   setProviders(res);
    // };
    fetchCsrfToken();
    // fetchProviders();

    // Display error from query params if any (e.g., from failed Credentials login)
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'CredentialsSignin':
          setError('Invalid email or password. Please try again.');
          break;
        default:
          setError('An unknown error occurred during sign-in.');
      }
    }
  }, [searchParams]);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    const result = await signIn('credentials', {
      redirect: false, // Handle redirect manually after checking result
      email: email,
      password: password,
      callbackUrl: callbackUrl,
      // csrfToken: csrfToken, // Not always needed for credentials if submitting via JS
    });

    if (result?.error) {
      setError(result.error === 'CredentialsSignin' ? 'Invalid email or password.' : 'Sign-in failed.');
    } else if (result?.ok && result?.url) {
      router.push(result.url); // or router.push(callbackUrl)
    } else if (result?.ok) {
      router.push(callbackUrl);
    } else {
      setError('An unexpected error occurred during sign in.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Sign In</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCredentialsSignIn}>
        {/* CSRF token might be needed if not using NextAuth's default form submission */}
        {/* <input name="csrfToken" type="hidden" defaultValue={csrfToken} /> */}

        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button
          type="submit"
          style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Sign In with Credentials
        </button>
      </form>
      {/* TODO: Add buttons for OAuth providers here */}
      {/* {providers && Object.values(providers).map((provider) => {
          if (provider.id === 'credentials') return null; // Don't show button for credentials
          return (
            <div key={provider.name} style={{ marginTop: '10px' }}>
              <button
                onClick={() => signIn(provider.id, { callbackUrl })}
                style={{ width: '100%', padding: '10px', backgroundColor: '#eee', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
              >
                Sign in with {provider.name}
              </button>
            </div>
          );
      })} */}
    </div>
  );
}
