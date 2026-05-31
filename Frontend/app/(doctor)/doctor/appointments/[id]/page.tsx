'use client';
import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';

interface Appointment {
  id: string; scheduledAt: string; status: string; patientId: string; doctorId: string;
  patient: {
    id: string; email: string;
    patientProfile: { name: string; phone?: string; gender?: string; dob?: string; medicalHistory?: { allergies?: string[]; conditions?: string[] } } | null;
  };
  session?: {
    symptoms: string[];
    aiResult?: { recommendedSpecialty: string; urgency?: string; summary?: string; conditions: { condition: string; confidence: number; matchedSymptoms: string[]; description?: string }[] };
  };
  notes: { id: string; notes: string; diagnosis?: string; treatment?: string; createdAt: string }[];
}

export default function AppointmentDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const user      = getUser();
  const [appt, setAppt]       = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen]   = useState(true);
  const [noteForm, setNoteForm] = useState({ notes: '', diagnosis: '', treatment: '' });
  const [saving, setSaving]   = useState(false);
  const [saveErr, setSaveErr] = useState('');

  useEffect(() => {
    api.appointments.list().then(data => {
      setAppt((data as Appointment[]).find(a => a.id === id) ?? null);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: string) {
    if (!appt) return;
    await api.appointments.update(appt.id, { status });
    setAppt(a => a ? { ...a, status } : a);
  }

  async function submitNotes(e: FormEvent) {
    e.preventDefault();
    if (!appt || !user) return;
    setSaving(true); setSaveErr('');
    try {
      const note = await api.doctors.addNotes(user.id, {
        appointmentId: appt.id, notes: noteForm.notes,
        diagnosis: noteForm.diagnosis || undefined,
        treatment: noteForm.treatment || undefined,
      }) as { id: string; notes: string; diagnosis?: string; treatment?: string; createdAt: string };
      setAppt(a => a ? { ...a, status: 'completed', notes: [...a.notes, note] } : a);
      setNoteForm({ notes: '', diagnosis: '', treatment: '' });
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">Loading…</div>;
  if (!appt)   return <div className="p-8 text-slate-400 text-sm">Appointment not found.</div>;

  const profile = appt.patient.patientProfile;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="btn-secondary text-sm px-3 py-2">← Back</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>Appointment Detail</h1>
          <p className="text-slate-400 text-sm">
            {new Date(appt.scheduledAt).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <span className={`badge-${appt.status} text-sm px-3 py-1.5`}>{appt.status}</span>
      </div>

      {/* Guidance note */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
        <span className="mt-0.5">💡</span>
        <span>Review the patient's details and MediSmart AI assessment below, then complete your consultation by writing notes in the form at the bottom.</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">

          {/* Patient info */}
          <div className="card">
            <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Patient information</h2>
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
                {(profile?.name || appt.patient.email).charAt(0).toUpperCase()}
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm flex-1">
                <div><span className="text-slate-400 text-xs font-semibold uppercase">Name</span><p className="font-semibold text-slate-900 mt-0.5">{profile?.name || '—'}</p></div>
                <div><span className="text-slate-400 text-xs font-semibold uppercase">Email</span><p className="text-slate-700 mt-0.5">{appt.patient.email}</p></div>
                <div><span className="text-slate-400 text-xs font-semibold uppercase">Phone</span><p className="text-slate-700 mt-0.5">{profile?.phone || '—'}</p></div>
                <div><span className="text-slate-400 text-xs font-semibold uppercase">Gender</span><p className="text-slate-700 mt-0.5 capitalize">{profile?.gender || '—'}</p></div>
                <div className="col-span-2"><span className="text-slate-400 text-xs font-semibold uppercase">Allergies</span><p className="text-slate-700 mt-0.5">{profile?.medicalHistory?.allergies?.join(', ') || 'None reported'}</p></div>
                <div className="col-span-2"><span className="text-slate-400 text-xs font-semibold uppercase">Pre-existing conditions</span><p className="text-slate-700 mt-0.5">{profile?.medicalHistory?.conditions?.join(', ') || 'None reported'}</p></div>
              </div>
            </div>
          </div>

          {/* AI pre-assessment */}
          {appt.session && (
            <div className="card">
              <button className="w-full flex items-center justify-between" onClick={() => setAiOpen(o => !o)}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧠</span>
                  <h2 className="font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>MediSmart AI Pre-assessment</h2>
                </div>
                <svg className={`h-4 w-4 text-slate-400 transition-transform ${aiOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {aiOpen && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  {appt.session.aiResult?.summary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-800">{appt.session.aiResult.summary}</div>
                  )}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Reported symptoms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {appt.session.symptoms.map((s, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2.5 py-1">{s}</span>
                      ))}
                    </div>
                  </div>
                  {appt.session.aiResult && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">AI conditions</p>
                      <div className="space-y-2">
                        {appt.session.aiResult.conditions.slice(0, 3).map((c, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                            <div className="h-2 w-2 rounded-full bg-teal-500 flex-shrink-0" />
                            <span className="text-sm font-semibold text-slate-800">{c.condition}</span>
                            <span className="text-xs text-teal-600 font-medium ml-auto">{c.confidence}% match</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Existing notes */}
          {appt.notes.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Consultation notes</h2>
              {appt.notes.map(n => (
                <div key={n.id} className="space-y-3 text-sm">
                  {n.notes     && <div><p className="text-xs font-semibold text-slate-400 uppercase mb-1">Notes</p><p className="text-slate-700 bg-slate-50 rounded-xl p-3">{n.notes}</p></div>}
                  {n.diagnosis && <div><p className="text-xs font-semibold text-slate-400 uppercase mb-1">Diagnosis</p><p className="text-slate-700 bg-teal-50 rounded-xl p-3 text-teal-900">{n.diagnosis}</p></div>}
                  {n.treatment && <div><p className="text-xs font-semibold text-slate-400 uppercase mb-1">Treatment plan</p><p className="text-slate-700 bg-blue-50 rounded-xl p-3 text-blue-900">{n.treatment}</p></div>}
                  <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Note form */}
          {appt.status !== 'cancelled' && appt.status !== 'completed' && (
            <form onSubmit={submitNotes} className="card">
              <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Write consultation notes</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Consultation notes *</label>
                  <textarea className="input resize-none h-24" required
                    placeholder="Examination findings, observations, clinical notes…"
                    value={noteForm.notes} onChange={e => setNoteForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Diagnosis</label>
                  <input type="text" className="input" placeholder="Primary diagnosis"
                    value={noteForm.diagnosis} onChange={e => setNoteForm(f => ({ ...f, diagnosis: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Treatment plan</label>
                  <textarea className="input resize-none h-20"
                    placeholder="Medications, referrals, follow-up instructions…"
                    value={noteForm.treatment} onChange={e => setNoteForm(f => ({ ...f, treatment: e.target.value }))} />
                </div>
                {saveErr && <p className="text-red-600 text-sm">{saveErr}</p>}
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : 'Save & complete appointment'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Action sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Actions</h3>
            <div className="space-y-2">
              {appt.status === 'pending' && (
                <>
                  <button onClick={() => updateStatus('confirmed')} className="btn-primary w-full">Confirm appointment</button>
                  <button onClick={() => updateStatus('cancelled')} className="btn-danger w-full">Decline</button>
                </>
              )}
              {appt.status === 'confirmed' && (
                <button onClick={() => updateStatus('cancelled')} className="btn-secondary w-full">Cancel appointment</button>
              )}
              {(appt.status === 'completed' || appt.status === 'cancelled') && (
                <p className="text-xs text-slate-400 text-center py-2">No actions available for this appointment.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
