'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { saveAuth, getDashboardPath } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'patient' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.register({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
      }) as { token: string; refreshToken: string; user: { id: string; email: string; role: string; name: string } };

      saveAuth(res.token, res.refreshToken, res.user as Parameters<typeof saveAuth>[2]);
      document.cookie = `ms_token=${res.token}; path=/`;
      router.push(getDashboardPath(res.user.role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Create account</h1>
      <p className="text-slate-500 text-sm mb-6">Join MediSmart today</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input type="text" className="input" required value={form.name} onChange={set('name')}
            placeholder="Your full name" />
        </div>

        <div>
          <label className="label">Email address</label>
          <input type="email" className="input" required value={form.email} onChange={set('email')}
            placeholder="you@example.com" autoComplete="email" />
        </div>

        <div>
          <label className="label">Account type</label>
          <select className="input" value={form.role} onChange={set('role')}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>

        <div>
          <label className="label">Password</label>
          <input type="password" className="input" required value={form.password} onChange={set('password')}
            placeholder="At least 8 characters" autoComplete="new-password" />
        </div>

        <div>
          <label className="label">Confirm password</label>
          <input type="password" className="input" required value={form.confirm} onChange={set('confirm')}
            placeholder="Repeat password" />
        </div>

        <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-500 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
      </p>
    </>
  );
}
