'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';

interface Profile {
  name: string;
  dob: string;
  gender: string;
  phone: string;
  medicalHistory: { allergies?: string[]; conditions?: string[] } | null;
}

export default function ProfilePage() {
  const user = getUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: '', dob: '', gender: '', phone: '', allergies: '', conditions: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api.patients.getProfile(user.id).then((data) => {
      const p = data as Profile;
      setProfile(p);
      setForm({
        name: p.name || '',
        dob: p.dob ? p.dob.slice(0, 10) : '',
        gender: p.gender || '',
        phone: p.phone || '',
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
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      await api.patients.updateProfile(user.id, {
        name: form.name,
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        phone: form.phone || undefined,
        medicalHistory: {
          allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean),
          conditions: form.conditions.split(',').map(s => s.trim()).filter(Boolean),
        },
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Keep your personal and medical information up to date.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4">Personal information</h2>
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
                <input type="tel" className="input" value={form.phone} onChange={set('phone')}
                  placeholder="+1-555-000-0000" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input bg-slate-50 cursor-not-allowed" value={user?.email || ''} disabled />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4">Medical history</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Known allergies</label>
                <input type="text" className="input" value={form.allergies} onChange={set('allergies')}
                  placeholder="penicillin, peanuts, latex (comma-separated)" />
              </div>
              <div>
                <label className="label">Pre-existing conditions</label>
                <input type="text" className="input" value={form.conditions} onChange={set('conditions')}
                  placeholder="hypertension, diabetes type 2 (comma-separated)" />
              </div>
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              Profile updated successfully.
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary px-8 py-2.5" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        <div className="card self-start">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center text-2xl font-bold text-brand-700">
              {form.name.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{form.name || '—'}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="badge-confirmed mt-1">Patient</span>
            </div>
          </div>
          <div className="text-sm text-slate-600 space-y-1">
            <p><span className="font-medium">Gender:</span> {form.gender || '—'}</p>
            <p><span className="font-medium">Phone:</span> {form.phone || '—'}</p>
            <p><span className="font-medium">DOB:</span> {form.dob || '—'}</p>
          </div>
        </div>
      </form>
    </div>
  );
}
