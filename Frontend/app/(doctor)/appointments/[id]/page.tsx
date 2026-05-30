'use client';
import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  patientId: string;
  doctorId: string;
  patient: {
    id: string;
    email: string;
    patientProfile: {
      name: string;
      phone?: string;
      gender?: string;
      dob?: string;
      medicalHistory?: { allergies?: string[]; conditions?: string[] };
    } | null;
  };
  session?: {
    symptoms: string[];
    aiResult?: {
      recommendedSpecialty: string;
      conditions: { condition: string; confidence: number; matchedSymptoms: string[] }[];
    };
  };
  notes: {
    id: string;
    notes: string;
    diagnosis?: string;
    treatment?: string;
    createdAt: string;
  }[];
}

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = getUser();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteForm, setNoteForm] = useState({ notes: '', diagnosis: '', treatment: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    api.appointments.list().then((data) => {
      const all = data as Appointment[];
      const found = all.find(a => a.id === id);
      setAppointment(found || null);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: string) {
    if (!appointment) return;
    await api.appointments.update(appointment.id, { status });
    setAppointment(a => a ? { ...a, status } : a);
  }

  async function submitNotes(e: FormEvent) {
    e.preventDefault();
    if (!appointment || !user) return;
    setSaving(true);
    setSaveError('');
    try {
      const note = await api.doctors.addNotes(user.id, {
        appointmentId: appointment.id,
        notes: noteForm.notes,
        diagnosis: noteForm.diagnosis || undefined,
        treatment: noteForm.treatment || undefined,
      }) as { id: string; notes: string; diagnosis?: string; treatment?: string; createdAt: string };

      setAppointment(a => a ? { ...a, status: 'completed', notes: [...a.notes, note] } : a);
      setNoteForm({ notes: '', diagnosis: '', treatment: '' });
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  if (!appointment) return <div className="text-slate-400 text-sm">Appointment not found.</div>;

  const profile = appointment.patient.patientProfile;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-secondary text-sm">← Back</button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointment Detail</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date(appointment.scheduledAt).toLocaleString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`ml-auto badge-${appointment.status} text-sm`}>{appointment.status}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          {/* Patient info */}
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4">Patient information</h2>
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xl">
                {(profile?.name || appointment.patient.email).charAt(0).toUpperCase()}
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm flex-1">
                <div><span className="text-slate-500">Name:</span> <span className="font-medium">{profile?.name || '—'}</span></div>
                <div><span className="text-slate-500">Email:</span> {appointment.patient.email}</div>
                <div><span className="text-slate-500">Phone:</span> {profile?.phone || '—'}</div>
                <div><span className="text-slate-500">Gender:</span> {profile?.gender || '—'}</div>
                <div className="col-span-2">
                  <span className="text-slate-500">Allergies:</span>{' '}
                  {profile?.medicalHistory?.allergies?.join(', ') || 'None reported'}
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Conditions:</span>{' '}
                  {profile?.medicalHistory?.conditions?.join(', ') || 'None reported'}
                </div>
              </div>
            </div>
          </div>

          {/* AI pre-assessment */}
          {appointment.session && (
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4">AI Pre-assessment</h2>
              <div className="mb-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Reported symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {appointment.session.symptoms.map((s, i) => (
                    <span key={i} className="bg-slate-100 text-slate-700 text-xs rounded-full px-3 py-1">{s}</span>
                  ))}
                </div>
              </div>
              {appointment.session.aiResult && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">AI conditions</p>
                  {appointment.session.aiResult.conditions.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0" />
                      <span className="font-medium text-slate-900">{c.condition}</span>
                      <span className="text-slate-400">({c.confidence}% match)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Consultation notes */}
          {appointment.notes.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4">Consultation notes</h2>
              {appointment.notes.map(n => (
                <div key={n.id} className="space-y-3 text-sm">
                  <div><span className="font-medium text-slate-700">Notes:</span> <p className="text-slate-600 mt-1">{n.notes}</p></div>
                  {n.diagnosis && <div><span className="font-medium text-slate-700">Diagnosis:</span> <p className="text-slate-600 mt-1">{n.diagnosis}</p></div>}
                  {n.treatment && <div><span className="font-medium text-slate-700">Treatment:</span> <p className="text-slate-600 mt-1">{n.treatment}</p></div>}
                  <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Write notes form */}
          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <form onSubmit={submitNotes} className="card">
              <h2 className="font-semibold text-slate-900 mb-4">Write consultation notes</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Notes *</label>
                  <textarea className="input resize-none h-24" required
                    value={noteForm.notes} onChange={e => setNoteForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Examination findings, observations…" />
                </div>
                <div>
                  <label className="label">Diagnosis</label>
                  <input type="text" className="input"
                    value={noteForm.diagnosis} onChange={e => setNoteForm(f => ({ ...f, diagnosis: e.target.value }))}
                    placeholder="Primary diagnosis" />
                </div>
                <div>
                  <label className="label">Treatment plan</label>
                  <textarea className="input resize-none h-20"
                    value={noteForm.treatment} onChange={e => setNoteForm(f => ({ ...f, treatment: e.target.value }))}
                    placeholder="Medications, referrals, follow-up…" />
                </div>
                {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save & complete appointment'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3">Actions</h3>
            <div className="space-y-2">
              {appointment.status === 'pending' && (
                <>
                  <button onClick={() => updateStatus('confirmed')} className="btn-primary w-full">Confirm appointment</button>
                  <button onClick={() => updateStatus('cancelled')} className="btn-danger w-full">Decline</button>
                </>
              )}
              {appointment.status === 'confirmed' && (
                <button onClick={() => updateStatus('cancelled')} className="btn-secondary w-full">Cancel appointment</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
