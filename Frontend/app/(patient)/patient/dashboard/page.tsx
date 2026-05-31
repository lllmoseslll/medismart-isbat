'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import StatCard from '@/components/StatCard';

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  doctor: { name: string; specialty: string };
  notes?: { diagnosis?: string }[];
}

function timeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

export default function PatientDashboard() {
  const user = getUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(true);

  useEffect(() => {
    api.appointments.list()
      .then(d => setAppointments(d as Appointment[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const upcoming  = appointments.filter(a => a.status !== 'cancelled' && new Date(a.scheduledAt) > new Date());
  const completed = appointments.filter(a => a.status === 'completed');
  const next      = upcoming[0];

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* Guidance banner */}
      {banner && (
        <div className="flex items-start gap-3 bg-teal-600 text-white px-5 py-4 mb-7 shadow-sm">
          <span className="text-xl flex-shrink-0">👋</span>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ fontFamily: 'Outfit,sans-serif' }}>Welcome to your health dashboard</p>
            <p className="text-teal-100 text-xs mt-0.5">
              Use <strong>Symptom Analysis</strong> to describe how you're feeling — MediSmart AI will assess your symptoms and recommend which specialist to see. Then book directly from the results.
            </p>
          </div>
          <button onClick={() => setBanner(false)} className="text-teal-200 hover:text-white transition-colors flex-shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>
          Good {timeOfDay()}, {user?.name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's your health overview for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-7">
        <StatCard title="Upcoming appointments" value={upcoming.length} color="teal"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <StatCard title="Completed visits" value={completed.length} color="green"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Total appointments" value={appointments.length} color="blue"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">

          {/* Next appointment */}
          {next ? (
            <div className="-2xl p-6 text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg,#0c4a6e 0%,#0369a1 60%,#0f766e 100%)' }}>
              <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mb-3">Next appointment</p>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-bold" style={{ fontFamily: 'Outfit,sans-serif' }}>{next.doctor.name}</p>
                  <p className="text-blue-200 text-sm">{next.doctor.specialty}</p>
                  <div className="flex items-center gap-2 mt-3 text-sm text-white/80">
                    <svg className="h-4 w-4 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(next.scheduledAt).toLocaleString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </div>
                </div>
                <span className={`badge-${next.status}`}>{next.status}</span>
              </div>
            </div>
          ) : !loading && (
            <div className="card border-2 border-dashed border-slate-200 flex flex-col items-center py-10 text-center">
              <div className="h-12 w-12 bg-teal-50 flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm mb-3">No upcoming appointments</p>
              <Link href="/patient/appointments" className="btn-primary text-sm px-4 py-2">Book your first →</Link>
            </div>
          )}

          {/* Recent list */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-brand-900 text-lg" style={{ fontFamily: 'Outfit,sans-serif' }}>Recent appointments</h2>
              <Link href="/patient/appointments" className="text-sm text-teal-600 hover:text-teal-700 font-semibold">View all →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 animate-pulse" />)}</div>
            ) : appointments.length === 0 ? (
              <p className="text-slate-400 text-sm py-6 text-center">No appointments yet.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {appointments.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-sm">
                        {a.doctor.name.charAt(4) || 'D'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{a.doctor.name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(a.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}{a.doctor.specialty}
                        </p>
                      </div>
                    </div>
                    <span className={`badge-${a.status}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Quick actions</h3>
            <div className="space-y-2">
              {[
                { href: '/patient/symptoms', icon: '🧠', label: 'Analyse symptoms', sub: 'AI-powered assessment', hover: 'hover:bg-teal-50 hover:border-teal-200' },
                { href: '/patient/appointments', icon: '📅', label: 'Book appointment', sub: 'Find the right specialist', hover: 'hover:bg-blue-50 hover:border-blue-200' },
                { href: '/patient/profile', icon: '👤', label: 'Update profile', sub: 'Medical history & info', hover: 'hover:bg-purple-50 hover:border-purple-200' },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className={`flex items-center gap-3 p-3 border border-slate-100 transition-all duration-150 group ${a.hover}`}>
                  <span className="text-xl">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{a.label}</p>
                    <p className="text-xs text-slate-400">{a.sub}</p>
                  </div>
                  <svg className="h-4 w-4 text-slate-300 group-hover:text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          <div className="-2xl p-5 text-white"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
            <div className="text-3xl mb-3">🧠</div>
            <h3 className="font-bold mb-1 text-sm" style={{ fontFamily: 'Outfit,sans-serif' }}>Feeling unwell?</h3>
            <p className="text-teal-100 text-xs mb-4 leading-relaxed">
              Describe your symptoms and MediSmart AI will recommend which specialist to see.
            </p>
            <Link href="/patient/symptoms"
              className="block text-center bg-white text-teal-700 font-bold px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors">
              Start AI analysis →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
