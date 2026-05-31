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
    user: { id: 'demo-patient-1', email: 'patient@medismart.com', role: 'patient', name: 'Alex Johnson' },
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
    user: { id: 'demo-doctor-1', email: 'dr.chen@medismart.com', role: 'doctor', name: 'Dr. Sarah Chen' },
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
    user: { id: 'demo-admin-1', email: 'admin@medismart.com', role: 'admin', name: 'Admin User' },
  },
];

const DEMO_MAP = Object.fromEntries(DEMOS.map(d => [d.email, d]));

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
      // Always try the real backend first — gets real data when backend is running
      const res = await api.auth.login({ email, password }) as {
        token: string; refreshToken: string;
        user: { id: string; email: string; role: string; name: string };
      };
      saveAuth(res.token, res.refreshToken, res.user as Parameters<typeof saveAuth>[2]);
      document.cookie = `ms_token=${res.token}; path=/`;
      router.push(params.get('next') || getDashboardPath(res.user.role));
    } catch {
      // Backend unreachable — fall back to local demo mode for demo credentials only
      const demo = DEMO_MAP[email];
      if (demo && demo.password === password) {
        const fakeToken = `demo-${demo.user.role}-${Date.now()}`;
        saveAuth(fakeToken, fakeToken, demo.user as Parameters<typeof saveAuth>[2]);
        document.cookie = `ms_token=${fakeToken}; path=/`;
        router.push(params.get('next') || getDashboardPath(demo.user.role));
      } else {
        setError('Invalid credentials or server unavailable.');
      }
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
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-5">
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
            ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin" />Signing in…</span>
            : 'Sign in →'}
        </button>
      </form>

      {/* Demo accounts */}
      <div className="border border-slate-200 bg-slate-50/80 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demo accounts</span>
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] text-slate-400">no sign-up needed</span>
        </div>
        <div className="flex gap-1.5">
          {DEMOS.map(d => {
            const active = email === d.email;
            return (
              <button key={d.role} onClick={() => fillDemo(d)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 border text-center transition-all duration-150 ${d.bg} ${active ? `ring-2 ${d.ring}` : ''}`}>
                <span className="text-lg leading-none">{d.emoji}</span>
                <span className="font-semibold text-xs text-slate-700">{d.role}</span>
                {active && <span className="text-[10px] text-teal-600 font-bold leading-none">✓</span>}
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
