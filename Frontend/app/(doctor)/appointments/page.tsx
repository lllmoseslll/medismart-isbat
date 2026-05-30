'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  patient: {
    email: string;
    patientProfile: { name: string; phone?: string } | null;
  };
  session?: {
    symptoms: string[];
    aiResult?: { recommendedSpecialty: string; conditions: { condition: string; confidence: number }[] };
  };
  notes: { diagnosis?: string }[];
}

type Filter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.appointments.list()
      .then(data => setAppointments(data as Appointment[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filters: Filter[] = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  async function updateStatus(id: string, status: string) {
    await api.appointments.update(id, { status });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
        <p className="text-slate-500 mt-1">Review, approve, and manage your patient appointments.</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400">No appointments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(a => {
            const patientName = a.patient.patientProfile?.name || a.patient.email;
            return (
              <div key={a.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 font-bold">
                      {patientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{patientName}</p>
                      <p className="text-xs text-slate-500">{a.patient.email}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {new Date(a.scheduledAt).toLocaleString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                          hour: 'numeric', minute: '2-digit',
                        })}
                      </p>
                      {a.session?.aiResult?.conditions?.[0] && (
                        <p className="text-xs text-brand-600 mt-1">
                          AI: likely {a.session.aiResult.conditions[0].condition}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {a.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(a.id, 'confirmed')}
                          className="btn-primary text-sm px-3 py-1.5">Confirm</button>
                        <button onClick={() => updateStatus(a.id, 'cancelled')}
                          className="btn-danger text-sm px-3 py-1.5">Decline</button>
                      </>
                    )}
                    {a.status === 'confirmed' && (
                      <button onClick={() => updateStatus(a.id, 'cancelled')}
                        className="btn-secondary text-sm px-3 py-1.5">Cancel</button>
                    )}
                    <span className={`badge-${a.status}`}>{a.status}</span>
                    <Link href={`/doctor/appointments/${a.id}`}
                      className="btn-secondary text-sm px-3 py-1.5">View →</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
