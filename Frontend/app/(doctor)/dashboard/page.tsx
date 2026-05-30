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
  patient: {
    email: string;
    patientProfile: { name: string } | null;
  };
  session?: {
    symptoms: string[];
    aiResult?: { recommendedSpecialty: string; conditions: { condition: string; confidence: number }[] };
  };
}

export default function DoctorDashboard() {
  const user = getUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.appointments.list().then(data => setAppointments(data as Appointment[]))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter(a =>
    a.status !== 'cancelled' && new Date(a.scheduledAt) > new Date()
  );
  const pending = appointments.filter(a => a.status === 'pending');
  const completed = appointments.filter(a => a.status === 'completed');
  const todayAppts = upcoming.filter(a => {
    const d = new Date(a.scheduledAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Good {timeOfDay()}, {user?.name?.split(' ').slice(0, 2).join(' ')}
        </h1>
        <p className="text-slate-500 mt-1">You have {todayAppts.length} appointment{todayAppts.length !== 1 ? 's' : ''} today.</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard title="Today" value={todayAppts.length} color="blue"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="Upcoming" value={upcoming.length} color="purple"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard title="Pending approval" value={pending.length} color="amber"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="Completed" value={completed.length} color="green"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Upcoming appointments</h2>
              <Link href="/doctor/appointments" className="text-sm text-brand-600 hover:text-brand-700">View all</Link>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-slate-400">No upcoming appointments.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 6).map(a => (
                  <Link key={a.id} href={`/doctor/appointments/${a.id}`}
                    className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-semibold text-sm">
                        {(a.patient.patientProfile?.name || a.patient.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {a.patient.patientProfile?.name || a.patient.email}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(a.scheduledAt).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`badge-${a.status}`}>{a.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Pending requests</h3>
            {pending.length === 0 ? (
              <p className="text-sm text-slate-400">All caught up!</p>
            ) : pending.slice(0, 5).map(a => (
              <Link key={a.id} href={`/doctor/appointments/${a.id}`}
                className="block py-2 border-b border-slate-50 last:border-0 hover:text-brand-600 transition-colors">
                <p className="text-sm font-medium text-slate-900">
                  {a.patient.patientProfile?.name || a.patient.email}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(a.scheduledAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
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
