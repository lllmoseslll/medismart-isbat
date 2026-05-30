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
  session?: { aiResult?: { recommendedSpecialty: string } };
}

export default function PatientDashboard() {
  const user = getUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.appointments.list().then(data => {
      setAppointments(data as Appointment[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter(a => a.status !== 'cancelled' && new Date(a.scheduledAt) > new Date());
  const past = appointments.filter(a => a.status === 'completed');
  const next = upcoming[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Good {timeOfDay()}, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-slate-500 mt-1">Here's your health overview for today.</p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <StatCard title="Upcoming appointments" value={upcoming.length} color="blue"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard title="Completed visits" value={past.length} color="green"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="Total appointments" value={appointments.length} color="purple"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          {next && (
            <div className="card border-l-4 border-brand-500">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-3">Next appointment</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{next.doctor.name}</p>
                  <p className="text-sm text-slate-500">{next.doctor.specialty}</p>
                  <p className="text-sm text-slate-700 mt-2">
                    {new Date(next.scheduledAt).toLocaleString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`badge-${next.status}`}>{next.status}</span>
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Recent appointments</h2>
              <Link href="/patient/appointments" className="text-sm text-brand-600 hover:text-brand-700">View all</Link>
            </div>
            {loading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-slate-400">No appointments yet.</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.doctor.name}</p>
                      <p className="text-xs text-slate-500">{new Date(a.scheduledAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`badge-${a.status}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
            <h3 className="font-semibold mb-2">Feeling unwell?</h3>
            <p className="text-brand-100 text-sm mb-4">Use our AI to analyse your symptoms and find the right specialist.</p>
            <Link href="/patient/symptoms"
              className="block text-center bg-white text-brand-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-brand-50 transition-colors">
              Analyse symptoms
            </Link>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3 text-slate-900">Quick actions</h3>
            <div className="space-y-2">
              <Link href="/patient/appointments"
                className="flex items-center gap-2 text-sm text-slate-700 hover:text-brand-600 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Book appointment
              </Link>
              <Link href="/patient/profile"
                className="flex items-center gap-2 text-sm text-slate-700 hover:text-brand-600 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
