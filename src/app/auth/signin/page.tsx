'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navigation from '@/components/Navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      router.push('/registry');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Failed to sign in');
      } else {
        setError('Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      router.push('/registry');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Google sign-in failed');
      } else {
        setError('Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 mt-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
        {error && (
          <div className="mb-4 text-red-600 text-center">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className="my-6 flex items-center">
          <hr className="flex-grow border-t" />
          <span className="mx-4 text-gray-400">or</span>
          <hr className="flex-grow border-t" />
        </div>
        <Button
          type="button"
          className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M44.5 20H24V28.5H35.9C34.5 32.1 31.1 34.5 27 34.5C22.3 34.5 18.5 30.7 18.5 26C18.5 21.3 22.3 17.5 27 17.5C28.7 17.5 30.3 18.1 31.6 19.1L36.2 14.5C33.7 12.6 30.5 11.5 27 11.5C19.8 11.5 13.5 17.8 13.5 25C13.5 32.2 19.8 38.5 27 38.5C34.2 38.5 40.5 32.2 40.5 25C40.5 23.7 40.3 22.4 40 21.2L44.5 20Z" fill="#4285F4"/><path d="M6.5 14.5L12.1 18.9C13.7 16.1 16.9 14.5 20.5 14.5C22.3 14.5 24 15.1 25.4 16.1L30 11.5C27.2 9.6 23.8 8.5 20.5 8.5C13.3 8.5 7 14.8 7 22C7 29.2 13.3 35.5 20.5 35.5C23.8 35.5 27.2 34.4 30 32.5L25.4 28C24 29 22.3 29.5 20.5 29.5C16.9 29.5 13.7 27.9 12.1 25.1L6.5 29.5C9.2 33.1 14.2 35.5 20.5 35.5C27.8 35.5 34.1 29.2 34.1 22C34.1 14.8 27.8 8.5 20.5 8.5C14.2 8.5 9.2 10.9 6.5 14.5Z" fill="#34A853"/></g></svg>
          Sign in with Google
        </Button>
        <div className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
