'use client';
import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { saveAuth, getDashboardPath } from '@/lib/auth';

const DEMOS = [
  {
    role: 'Patient',
    email: 'patient@medismart.com',
    password: 'Patient@123',
    note: 'Browse symptoms · Book appointments',
    emoji: '🧑‍💼',
    ring: 'ring-teal-400/60',
    bg: 'bg-teal-50 hover:bg-teal-100/70 border-teal-200',
    pill: 'bg-teal-100 text-teal-700',
  },
  {
    role: 'Doctor',
    email: 'dr.chen@medismart.com',
    password: 'Doctor@123',
    note: 'Manage appointments · Write notes',
    emoji: '👩‍⚕️',
    ring: 'ring-sky-400/60',
    bg: 'bg-sky-50 hover:bg-sky-100/70 border-sky-200',
    pill: 'bg-sky-100 text-sky-700',
  },
  {
    role: 'Admin',
    email: 'admin@medismart.com',
    password: 'Admin@123',
    note: 'System management · Reports',
    emoji: '🛡️',
    ring: 'ring-violet-400/60',
    bg: 'bg-violet-50 hover:bg-violet-100/70 border-violet-200',
    pill: 'bg-violet-100 text-violet-700',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function fillDemo(d: typeof DEMOS[0]) {
    setEmail(d.email);
    setPassword(d.password);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password }) as {
        token: string; refreshToken: string;
        user: { id: string; email: string; role: string; name: string };
      };
      saveAuth(res.token, res.refreshToken, res.user as Parameters<typeof saveAuth>[2]);
      document.cookie = `ms_token=${res.token}; path=/`;
      router.push(params.get('next') || getDashboardPath(res.user.role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-brand-900 mb-1" style={{ fontFamily: 'Outfit,sans-serif' }}>
        Welcome back
      </h1>
      <p className="text-slate-500 text-sm mb-8">Sign in to your MediSmart account to continue.</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="label">Email address</label>
          <input type="email" className="input" required autoComplete="email"
            placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} className="input pr-12" required
              autoComplete="current-password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-semibold">
              {showPw ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>
        <button type="submit" className="btn-primary w-full py-3 text-[15px]" disabled={loading}>
          {loading
            ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</span>
            : 'Sign in →'}
        </button>
      </form>

      {/* Demo accounts */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Demo accounts</span>
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">no sign-up needed</span>
        </div>
        <p className="text-xs text-slate-500 mb-3 flex items-start gap-1.5">
          <span>💡</span>
          <span>Select an account below to explore the platform — it fills the form automatically.</span>
        </p>
        <div className="space-y-2">
          {DEMOS.map(d => {
            const active = email === d.email;
            return (
              <button key={d.role} onClick={() => fillDemo(d)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 text-left ${d.bg} ${active ? `ring-2 ${d.ring}` : ''}`}>
                <span className="text-2xl flex-shrink-0">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-slate-800">{d.role}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.pill}`}>{d.role}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{d.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{d.note}</p>
                </div>
                {active
                  ? <span className="text-teal-600 text-xs font-bold flex-shrink-0">Selected ✓</span>
                  : <span className="text-slate-300 text-xs flex-shrink-0">→ use</span>
                }
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6">
        No account yet?{' '}
        <Link href="/register" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
          Create one free →
        </Link>
      </p>
    </>
  );
}
