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
  patient: { email: string; patientProfile: { name: string } | null };
  session?: { aiResult?: { conditions: { condition: string; confidence: number }[] } };
}

function timeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

export default function DoctorDashboard() {
  const user = getUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.appointments.list().then(d => setAppointments(d as Appointment[])).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    await api.appointments.update(id, { status });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  const upcoming = appointments.filter(a => a.status !== 'cancelled' && new Date(a.scheduledAt) > new Date());
  const pending   = appointments.filter(a => a.status === 'pending');
  const completed = appointments.filter(a => a.status === 'completed');
  const today     = upcoming.filter(a => new Date(a.scheduledAt).toDateString() === new Date().toDateString());

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Guidance banner */}
      <div className="flex items-start gap-3 rounded-2xl px-5 py-4 mb-7 text-white shadow-sm"
        style={{ background: 'linear-gradient(135deg,#0369a1,#0d9488)' }}>
        <span className="text-xl flex-shrink-0">📋</span>
        <div>
          <p className="font-semibold text-sm" style={{ fontFamily: 'Outfit,sans-serif' }}>Your appointment queue</p>
          <p className="text-blue-100 text-xs mt-0.5">
            Review pending requests below. Click any appointment to see the patient's <strong>MediSmart AI pre-assessment</strong> and write your consultation notes.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>
          Good {timeOfDay()}, {user?.name?.split(' ').slice(0,2).join(' ') ?? 'Doctor'}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          You have <strong className="text-brand-900">{today.length}</strong> appointment{today.length !== 1 ? 's' : ''} today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Today" value={today.length} color="teal"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Upcoming" value={upcoming.length} color="blue"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <StatCard title="Pending requests" value={pending.length} color="amber"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Completed" value={completed.length} color="green"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-brand-900 text-lg" style={{ fontFamily: 'Outfit,sans-serif' }}>Upcoming appointments</h2>
              <Link href="/doctor/appointments" className="text-sm text-teal-600 hover:text-teal-700 font-semibold">View all →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"/>)}</div>
            ) : upcoming.length === 0 ? (
              <p className="text-slate-400 text-sm py-6 text-center">No upcoming appointments.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0,6).map(a => {
                  const name = a.patient.patientProfile?.name || a.patient.email;
                  const aiHint = a.session?.aiResult?.conditions?.[0];
                  return (
                    <Link key={a.id} href={`/doctor/appointments/${a.id}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/40 transition-all duration-150 group">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(a.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          {aiHint && <span className="text-teal-600 font-medium"> · AI: {aiHint.condition}</span>}
                        </p>
                      </div>
                      <span className={`badge-${a.status} flex-shrink-0`}>{a.status}</span>
                      <svg className="h-4 w-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pending sidebar */}
        <div className="card">
          <h3 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>
            Pending requests
            {pending.length > 0 && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{pending.length}</span>}
          </h3>
          {pending.length === 0 ? (
            <div className="text-center py-6">
              <svg className="h-8 w-8 text-teal-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-400 text-sm">All caught up!</p>
            </div>
          ) : pending.slice(0,5).map(a => {
            const name = a.patient.patientProfile?.name || a.patient.email;
            return (
              <div key={a.id} className="py-3 border-b border-slate-50 last:border-0">
                <p className="text-sm font-semibold text-slate-900 mb-0.5">{name}</p>
                <p className="text-xs text-slate-400 mb-2">{new Date(a.scheduledAt).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(a.id, 'confirmed')}
                    className="flex-1 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold py-1.5 rounded-lg transition-colors">Confirm</button>
                  <button onClick={() => updateStatus(a.id, 'cancelled')}
                    className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-1.5 rounded-lg border border-red-200 transition-colors">Decline</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
