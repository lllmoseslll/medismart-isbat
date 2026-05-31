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
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await api.auth.register({
        email: form.email, password: form.password, name: form.name, role: form.role,
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
      <h1 className="text-3xl font-bold text-brand-900 mb-1" style={{ fontFamily: 'Outfit,sans-serif' }}>
        Create account
      </h1>
      <p className="text-slate-500 text-sm mb-6">Join MediSmart — it's free and takes 30 seconds.</p>

      {/* Guidance note */}
      <div className="flex items-start gap-2.5 bg-teal-50 border border-teal-200 px-4 py-3 mb-6 text-sm text-teal-800">
        <span className="flex-shrink-0 mt-0.5">💡</span>
        <span>
          <strong>Create a patient or doctor account.</strong> Admin accounts are managed by the system.{' '}
          Want to explore first?{' '}
          <Link href="/login" className="underline font-semibold hover:text-teal-700">Use a demo account →</Link>
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-5">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input type="text" className="input" required placeholder="Your full name"
            autoComplete="name" value={form.name} onChange={set('name')} />
        </div>

        <div>
          <label className="label">Email address</label>
          <input type="email" className="input" required placeholder="you@example.com"
            autoComplete="email" value={form.email} onChange={set('email')} />
        </div>

        <div>
          <label className="label">Account type</label>
          <select className="input" value={form.role} onChange={set('role')}>
            <option value="patient">🧑‍💼  Patient — Book appointments & track my health</option>
            <option value="doctor">👩‍⚕️  Doctor — Manage appointments & consultations</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" required placeholder="Min. 8 chars"
              autoComplete="new-password" value={form.password} onChange={set('password')} />
          </div>
          <div>
            <label className="label">Confirm</label>
            <input type="password" className="input" required placeholder="Repeat"
              value={form.confirm} onChange={set('confirm')} />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3 text-[15px]" disabled={loading}>
          {loading
            ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin" />Creating account…</span>
            : 'Create account →'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">Sign in</Link>
      </p>
    </>
  );
}
