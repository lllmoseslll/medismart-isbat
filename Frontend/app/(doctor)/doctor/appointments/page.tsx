'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  patient: { email: string; patientProfile: { name: string; phone?: string } | null };
  session?: { aiResult?: { conditions: { condition: string; confidence: number }[] } };
  notes: { diagnosis?: string }[];
}

type Filter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter]             = useState<Filter>('all');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    api.appointments.list().then(d => setAppointments(d as Appointment[])).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    await api.appointments.update(id, { status });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  const filters: Filter[] = ['all','pending','confirmed','completed','cancelled'];
  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);
  const sorted   = [...filtered].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>My Appointments</h1>
        <p className="text-slate-400 text-sm mt-0.5">Review, approve, and manage patient appointments.</p>
      </div>

      {/* Guidance note */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 px-4 py-3 mb-6 text-sm text-blue-800">
        <span className="mt-0.5">💡</span>
        <span>Click <strong>View →</strong> to open an appointment, review the patient's MediSmart AI symptom report, and write your consultation notes.</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 w-fit mb-6">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-semibold transition-all capitalize ${filter === f ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-slate-100 animate-pulse"/>)}</div>
      ) : sorted.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-slate-400">No appointments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(a => {
            const name = a.patient.patientProfile?.name || a.patient.email;
            const aiHint = a.session?.aiResult?.conditions?.[0];
            return (
              <div key={a.id} className="card hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-400">{a.patient.email}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {new Date(a.scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                      {aiHint && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-xs">🧠</span>
                          <span className="text-xs text-teal-700 font-medium">AI: {aiHint.condition} ({aiHint.confidence}% match)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(a.id, 'confirmed')}
                          className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3 py-1.5 transition-colors">Confirm</button>
                        <button onClick={() => updateStatus(a.id, 'cancelled')}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-3 py-1.5 border border-red-200 transition-colors">Decline</button>
                      </>
                    )}
                    <span className={`badge-${a.status}`}>{a.status}</span>
                    <Link href={`/doctor/appointments/${a.id}`}
                      className="text-xs btn-secondary px-3 py-1.5">View →</Link>
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
