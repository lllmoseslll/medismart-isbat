'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

interface Doctor {
  userId: string;
  name: string;
  specialty: string;
  bio?: string;
  licenseNumber: string;
  user: { email: string };
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SPECIALTIES = [
  'General Practice', 'Cardiology', 'Neurology', 'Dermatology',
  'Psychiatry', 'Orthopedics', 'Gastroenterology', 'Pulmonology',
  'Endocrinology', 'Urology', 'Rheumatology', 'Ophthalmology',
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', name: '', specialty: 'General Practice',
    licenseNumber: '', bio: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    try {
      const data = await api.doctors.list() as Doctor[];
      setDoctors(data);
    } finally {
      setLoading(false);
    }
  }

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function createDoctor(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.admin.createDoctor(form);
      await loadDoctors();
      setShowForm(false);
      setForm({ email: '', password: '', name: '', specialty: 'General Practice', licenseNumber: '', bio: '' });
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create doctor');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-slate-500 mt-1">Manage doctor accounts and availability.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add doctor'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createDoctor} className="card mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Register new doctor</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" className="input" required value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" required value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Temporary password</label>
              <input type="password" className="input" required value={form.password} onChange={set('password')}
                placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="label">Specialty</label>
              <select className="input" value={form.specialty} onChange={set('specialty')}>
                {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">License number</label>
              <input type="text" className="input" required value={form.licenseNumber} onChange={set('licenseNumber')} />
            </div>
            <div className="col-span-2">
              <label className="label">Bio</label>
              <textarea className="input resize-none h-16" value={form.bio} onChange={set('bio')}
                placeholder="Brief professional summary…" />
            </div>
          </div>
          {createError && <p className="text-red-600 text-sm mt-3">{createError}</p>}
          <button type="submit" className="btn-primary mt-4" disabled={creating}>
            {creating ? 'Creating…' : 'Create doctor account'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {doctors.map(d => (
            <div key={d.userId} className="card">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-lg">
                  {d.name.charAt(4) || d.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{d.name}</p>
                  <p className="text-sm text-brand-600">{d.specialty}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.user.email}</p>
                  <p className="text-xs text-slate-400">Lic: {d.licenseNumber}</p>
                  {d.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.bio}</p>}
                  <div className="flex gap-1 mt-2">
                    {d.availability.map(a => (
                      <span key={a.dayOfWeek} className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                        {DAYS[a.dayOfWeek]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {doctors.length === 0 && (
            <div className="col-span-2 card text-center py-12 text-slate-400">
              No doctors registered yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
