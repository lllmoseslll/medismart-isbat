'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getDashboardPath } from '@/lib/auth';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) router.replace(getDashboardPath(user.role));
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 flex flex-col items-center justify-center px-4">
      <div className="text-center text-white max-w-2xl">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-5xl font-bold mb-4">MediSmart</h1>
        <p className="text-xl text-brand-200 mb-8">
          AI-powered healthcare — analyse symptoms, book specialists, and manage care in one place.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/login"
            className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-xl hover:bg-brand-50 transition-colors">
            Sign In
          </Link>
          <Link href="/register"
            className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
            Register
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          {[
            { icon: '🧠', title: 'AI Symptom Analysis', desc: 'Describe symptoms, get ranked conditions and specialist recommendations instantly.' },
            { icon: '📅', title: 'Smart Booking', desc: 'Browse available doctors, view real-time slots, and book in seconds.' },
            { icon: '📋', title: 'Complete Records', desc: 'Consultation notes, diagnoses, and treatment plans — all in one secure place.' },
          ].map(f => (
            <div key={f.title} className="bg-white/10 backdrop-blur rounded-xl p-5">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-brand-200">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
