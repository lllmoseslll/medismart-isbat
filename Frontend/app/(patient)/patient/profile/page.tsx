'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';

interface Profile { name: string; dob: string; gender: string; phone: string; medicalHistory: { allergies?: string[]; conditions?: string[] } | null; }

export default function ProfilePage() {
  const user = getUser();
  const [form, setForm] = useState({ name: '', dob: '', gender: '', phone: '', allergies: '', conditions: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!user) return;
    api.patients.getProfile(user.id).then(data => {
      const p = data as Profile;
      setForm({
        name: p.name || '', dob: p.dob ? p.dob.slice(0, 10) : '',
        gender: p.gender || '', phone: p.phone || '',
        allergies: p.medicalHistory?.allergies?.join(', ') || '',
        conditions: p.medicalHistory?.conditions?.join(', ') || '',
      });
    }).catch(() => {});
  }, [user?.id]);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setSuccess(false); setError('');
    try {
      await api.patients.updateProfile(user.id, {
        name: form.name, dob: form.dob || undefined, gender: form.gender || undefined,
        phone: form.phone || undefined,
        medicalHistory: {
          allergies:  form.allergies.split(',').map(s=>s.trim()).filter(Boolean),
          conditions: form.conditions.split(',').map(s=>s.trim()).filter(Boolean),
        },
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>My Profile</h1>
        <p className="text-slate-400 text-sm mt-0.5">Keep your information up to date for accurate consultations.</p>
      </div>

      {/* Guidance note */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 px-4 py-3 mb-7 text-sm text-blue-800">
        <span className="mt-0.5">💡</span>
        <span>Keep your profile up to date so doctors have accurate information — especially allergies and pre-existing conditions — before your consultation.</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">

            {/* Personal info */}
            <div className="card">
              <h2 className="font-bold text-brand-900 mb-5" style={{ fontFamily: 'Outfit,sans-serif' }}>Personal information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Full name</label>
                  <input type="text" className="input" value={form.name} onChange={set('name')} />
                </div>
                <div>
                  <label className="label">Date of birth</label>
                  <input type="date" className="input" value={form.dob} onChange={set('dob')} />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={form.gender} onChange={set('gender')}>
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="label">Phone number</label>
                  <input type="tel" className="input" value={form.phone} onChange={set('phone')} placeholder="+1-555-000-0000" />
                </div>
                <div>
                  <label className="label">Email (read-only)</label>
                  <input type="email" className="input bg-slate-50 cursor-not-allowed opacity-60" value={user?.email || ''} disabled readOnly />
                </div>
              </div>
            </div>

            {/* Medical history */}
            <div className="card">
              <h2 className="font-bold text-brand-900 mb-2" style={{ fontFamily: 'Outfit,sans-serif' }}>Medical history</h2>
              <p className="text-xs text-slate-400 mb-5">This information helps doctors prepare for your consultation.</p>
              <div className="space-y-4">
                <div>
                  <label className="label">Known allergies</label>
                  <input type="text" className="input" value={form.allergies} onChange={set('allergies')}
                    placeholder="penicillin, peanuts, latex (comma-separated)" />
                  <p className="text-xs text-slate-400 mt-1">Separate multiple allergies with commas</p>
                </div>
                <div>
                  <label className="label">Pre-existing conditions</label>
                  <input type="text" className="input" value={form.conditions} onChange={set('conditions')}
                    placeholder="hypertension, type 2 diabetes (comma-separated)" />
                  <p className="text-xs text-slate-400 mt-1">Separate multiple conditions with commas</p>
                </div>
              </div>
            </div>

            {success && (
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 text-sm px-4 py-3">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Profile updated successfully.
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>
            )}

            <button type="submit" className="btn-primary px-8 py-3" disabled={saving}>
              {saving ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin" />Saving…</span> : 'Save changes'}
            </button>
          </div>

          {/* Profile card */}
          <div className="card self-start sticky top-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="h-20 w-20 flex items-center justify-center text-white text-3xl font-bold mb-3"
                style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
                {form.name.charAt(0).toUpperCase() || '?'}
              </div>
              <p className="font-bold text-brand-900 text-lg" style={{ fontFamily: 'Outfit,sans-serif' }}>{form.name || '—'}</p>
              <p className="text-slate-400 text-xs">{user?.email}</p>
              <span className="badge-confirmed mt-2">Patient</span>
            </div>
            <div className="divide-y divide-slate-50 text-sm">
              {[
                { label: 'Gender', val: form.gender || '—' },
                { label: 'Phone',  val: form.phone  || '—' },
                { label: 'DOB',    val: form.dob    || '—' },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2.5">
                  <span className="text-slate-400 text-xs font-semibold uppercase">{r.label}</span>
                  <span className="text-slate-700 text-xs font-medium">{r.val}</span>
                </div>
              ))}
              {form.allergies && (
                <div className="py-2.5">
                  <span className="text-slate-400 text-xs font-semibold uppercase block mb-1.5">Allergies</span>
                  <div className="flex flex-wrap gap-1">
                    {form.allergies.split(',').filter(Boolean).map(a => (
                      <span key={a} className="text-xs bg-red-50 text-red-700 border border-red-100 px-2 py-0.5">{a.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
