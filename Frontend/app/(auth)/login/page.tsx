'use client';
import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { saveAuth, getDashboardPath } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password }) as {
        token: string; refreshToken: string; user: { id: string; email: string; role: string; name: string };
      };
      saveAuth(res.token, res.refreshToken, res.user as Parameters<typeof saveAuth>[2]);
      document.cookie = `ms_token=${res.token}; path=/`;
      const next = params.get('next') || getDashboardPath(res.user.role);
      router.push(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
      <p className="text-slate-500 text-sm mb-6">Sign in to your MediSmart account</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input id="email" type="email" className="input" required
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" autoComplete="email" />
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" required
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" autoComplete="current-password" />
        </div>

        <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-sm text-slate-500 text-center">
          No account?{' '}
          <Link href="/register" className="text-brand-600 hover:text-brand-700 font-medium">
            Register here
          </Link>
        </p>
        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
          <p className="font-medium mb-1">Demo credentials</p>
          <p>Patient: patient@medismart.com / Patient@123</p>
          <p>Doctor: dr.chen@medismart.com / Doctor@123</p>
          <p>Admin: admin@medismart.com / Admin@123</p>
        </div>
      </div>
    </>
  );
}
