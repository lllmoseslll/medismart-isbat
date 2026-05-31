'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getDashboardPath } from '@/lib/auth';
import Link from 'next/link';

const HERO = 'https://images.pexels.com/photos/11756843/pexels-photo-11756843.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80';

const features = [
  {
    emoji: '🧠',
    title: 'AI Symptom Analysis',
    body: 'Describe how you feel in plain language. MediSmart AI (Gemini 2.5) ranks possible conditions by likelihood and recommends the right specialist.',
    from: 'from-teal-50',
    to: 'to-teal-100/40',
    border: 'border-teal-200/60',
    text: 'text-teal-800',
  },
  {
    emoji: '📅',
    title: 'Smart Booking',
    body: 'Browse verified specialists, check real-time availability, and confirm an appointment in seconds — with your AI assessment attached.',
    from: 'from-sky-50',
    to: 'to-sky-100/40',
    border: 'border-sky-200/60',
    text: 'text-sky-800',
  },
  {
    emoji: '📋',
    title: 'Consultation Records',
    body: 'Doctors write structured notes, diagnoses, and treatment plans that are securely stored and linked to your permanent health record.',
    from: 'from-violet-50',
    to: 'to-violet-100/40',
    border: 'border-violet-200/60',
    text: 'text-violet-800',
  },
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (u) router.replace(getDashboardPath(u.role));
  }, [router]);

  return (
    <div className="min-h-screen" style={{ fontFamily: 'DM Sans,system-ui,sans-serif' }}>

      {/* ── Hero ─────────────────────────────── */}
      <section className="relative h-screen flex flex-col overflow-hidden">
        <img src={HERO} alt="Medical care" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/92 via-brand-900/80 to-teal-900/60" />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-10 py-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg,#0d9488,#0284c7)' }}>
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl" style={{ fontFamily: 'Outfit,sans-serif' }}>MediSmart</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login"
              className="text-white/80 hover:text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all">
              Sign In
            </Link>
            <Link href="/register"
              className="bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-500/30">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/15 border border-teal-400/25 text-teal-300 text-sm font-medium mb-8 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            Powered by MediSmart AI · Gemini 2.5
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-[1.05] max-w-4xl"
            style={{ fontFamily: 'Outfit,sans-serif' }}>
            Intelligent Healthcare,{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg,#2dd4bf,#38bdf8)' }}>
              Simplified
            </span>
          </h1>

          <p className="text-lg text-white/65 max-w-2xl mb-6 leading-relaxed">
            AI-powered symptom analysis, specialist booking, and care management — all in one platform built for patients and healthcare providers.
          </p>

          {/* Guidance note */}
          <div className="flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-3 text-sm text-white/70 mb-10">
            <span>💡</span>
            <span>
              New here? Click <strong className="text-teal-300 font-semibold">Get Started</strong> to create a free patient account,
              or <strong className="text-teal-300 font-semibold">Sign In</strong> with a demo account.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/register"
              className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-10 py-4 rounded-2xl transition-all duration-200 shadow-2xl shadow-teal-500/30 text-base"
              style={{ fontFamily: 'Outfit,sans-serif' }}>
              Get Started Free →
            </Link>
            <Link href="/login"
              className="border border-white/25 text-white hover:bg-white/10 font-semibold px-10 py-4 rounded-2xl transition-all backdrop-blur-sm text-base">
              Sign In
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="relative z-10 flex justify-center pb-8 animate-bounce">
          <svg className="h-5 w-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Features ─────────────────────────── */}
      <section className="bg-white py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-3">What we offer</p>
            <h2 className="text-4xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>
              Everything you need in one place
            </h2>
            <p className="text-slate-500 mt-4 text-lg max-w-xl mx-auto">
              From first symptoms to post-consultation — MediSmart covers the complete care journey.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title}
                className={`bg-gradient-to-br ${f.from} ${f.to} border ${f.border} rounded-3xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 group`}>
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">{f.emoji}</div>
                <h3 className={`text-lg font-bold mb-3 ${f.text}`} style={{ fontFamily: 'Outfit,sans-serif' }}>{f.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#0c4a6e' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-10 text-center">
          {[
            { n: '15+', label: 'Medical specialties' },
            { n: 'AI', label: 'Powered by Gemini 2.5' },
            { n: '24 h', label: 'Appointment reminders' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-5xl font-bold text-teal-400 mb-2" style={{ fontFamily: 'Outfit,sans-serif' }}>{s.n}</p>
              <p className="text-sm text-blue-200/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────── */}
      <footer className="py-10 px-6 text-center" style={{ backgroundColor: '#082f49' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0284c7)' }}>
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-white font-bold" style={{ fontFamily: 'Outfit,sans-serif' }}>MediSmart</span>
        </div>
        <p className="text-blue-300/50 text-xs">
          Powered by MediSmart AI (Gemini 2.5) · For educational and demonstration purposes only
        </p>
      </footer>
    </div>
  );
}
