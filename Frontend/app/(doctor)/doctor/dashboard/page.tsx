'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import StatCard from '@/components/StatCard';
import { HiOutlineCheck, HiOutlineX, HiOutlineArrowRight, HiOutlineChevronRight } from 'react-icons/hi';

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  patient: { email: string; patientProfile: { name: string; phone?: string } | null };
  session?: { symptoms: string[]; aiResult?: { conditions: { condition: string; confidence: number }[]; urgency?: string } };
}

function timeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

const URGENCY_COLOR: Record<string, string> = {
  emergency: 'bg-red-100 text-red-700 border-red-200',
  urgent:    'bg-orange-100 text-orange-700 border-orange-200',
  soon:      'bg-amber-100 text-amber-700 border-amber-200',
  routine:   'bg-green-100 text-green-700 border-green-200',
};

export default function DoctorDashboard() {
  const user = getUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.appointments.list()
      .then(d => setAppointments(d as Appointment[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    await api.appointments.update(id, { status });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  const now = new Date();
  const upcoming  = appointments.filter(a => a.status !== 'cancelled' && new Date(a.scheduledAt) > now);
  const pending   = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed' && new Date(a.scheduledAt) > now);
  const completed = appointments.filter(a => a.status === 'completed');
  const today     = upcoming.filter(a => new Date(a.scheduledAt).toDateString() === now.toDateString());

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>
          Good {timeOfDay()}, {user?.name?.split(' ').slice(0, 2).join(' ') ?? 'Doctor'}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {today.length > 0
            ? `You have ${today.length} appointment${today.length > 1 ? 's' : ''} today.`
            : 'No appointments scheduled for today.'}
          {pending.length > 0 && ` ${pending.length} request${pending.length > 1 ? 's' : ''} need${pending.length === 1 ? 's' : ''} your response.`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Today" value={today.length} color="teal"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Confirmed upcoming" value={confirmed.length} color="blue"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Pending requests" value={pending.length} color="amber"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Completed" value={completed.length} color="green"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Pending requests — action required */}
        <div className="col-span-1">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>
                Pending requests
                {pending.length > 0 && (
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5  font-semibold">{pending.length}</span>
                )}
              </h2>
            </div>

            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-10 w-10 bg-teal-50 border border-teal-200  flex items-center justify-center mb-3">
                  <HiOutlineCheck className="text-teal-600 text-xl" />
                </div>
                <p className="text-slate-500 text-sm font-medium">All caught up</p>
                <p className="text-slate-400 text-xs mt-1">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map(a => {
                  const name = a.patient.patientProfile?.name || a.patient.email;
                  const aiTop = a.session?.aiResult?.conditions?.[0];
                  const urgency = a.session?.aiResult?.urgency;
                  return (
                    <div key={a.id} className="border border-slate-200  p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="h-8 w-8  flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(a.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                            at {new Date(a.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {aiTop && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xs">AI:</span>
                          <span className="text-xs text-teal-700 font-medium">{aiTop.condition}</span>
                          {urgency && urgency !== 'routine' && (
                            <span className={`text-xs px-1.5 py-0.5  border font-medium ${URGENCY_COLOR[urgency] ?? ''}`}>{urgency}</span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(a.id, 'confirmed')}
                          className="flex-1 flex items-center justify-center gap-1 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold py-1.5  transition-colors">
                          <HiOutlineCheck className="text-sm" /> Confirm
                        </button>
                        <button onClick={() => updateStatus(a.id, 'cancelled')}
                          className="flex-1 flex items-center justify-center gap-1 text-xs bg-white hover:bg-red-50 text-red-700 font-semibold py-1.5  border border-red-200 transition-colors">
                          <HiOutlineX className="text-sm" /> Decline
                        </button>
                      </div>
                      <Link href={`/doctor/appointments/${a.id}`}
                        className="mt-2 flex items-center justify-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                        View details <HiOutlineArrowRight className="text-sm" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming schedule */}
        <div className="col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>Upcoming schedule</h2>
              <Link href="/doctor/appointments" className="text-sm text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1">
                View all <HiOutlineChevronRight className="text-base" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-slate-100 animate-pulse "/>)}</div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 8).map(a => {
                  const name = a.patient.patientProfile?.name || a.patient.email;
                  const aiTop = a.session?.aiResult?.conditions?.[0];
                  const isToday = new Date(a.scheduledAt).toDateString() === now.toDateString();
                  return (
                    <Link key={a.id} href={`/doctor/appointments/${a.id}`}
                      className="flex items-center gap-3 p-3 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30  transition-all duration-150 group">
                      {/* Time column */}
                      <div className="w-16 flex-shrink-0 text-center">
                        <p className={`text-sm font-bold ${isToday ? 'text-teal-700' : 'text-slate-700'}`}>
                          {new Date(a.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-slate-400">
                          {isToday ? 'Today' : new Date(a.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      {/* Divider */}
                      <div className={`w-0.5 h-10 flex-shrink-0 ${isToday ? 'bg-teal-400' : 'bg-slate-200'}`} />

                      {/* Patient info */}
                      <div className="h-9 w-9  flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{name}</p>
                        {aiTop ? (
                          <p className="text-xs text-slate-500">
                            AI: {aiTop.condition} <span className="text-teal-600">({aiTop.confidence}%)</span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">No AI assessment</p>
                        )}
                      </div>

                      <span className={`badge-${a.status} flex-shrink-0`}>{a.status}</span>
                      <HiOutlineChevronRight className="text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
