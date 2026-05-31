'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

interface Doctor { userId: string; name: string; specialty: string; bio?: string; licenseNumber: string; user: { email: string }; availability: { dayOfWeek: number; startTime: string; endTime: string }[]; }

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const SPECIALTIES = ['General Practice','Cardiology','Neurology','Dermatology','Psychiatry','Orthopedics','Gastroenterology','Pulmonology','Endocrinology','Urology','Rheumatology','Ophthalmology'];

export default function DoctorsPage() {
  const [doctors, setDoctors]   = useState<Doctor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email:'',password:'',name:'',specialty:'General Practice',licenseNumber:'',bio:'' });
  const [creating, setCreating] = useState(false);
  const [createErr, setErr]     = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try { setDoctors(await api.doctors.list() as Doctor[]); } finally { setLoading(false); }
  }

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function createDoctor(e: FormEvent) {
    e.preventDefault(); setCreating(true); setErr('');
    try {
      await api.admin.createDoctor(form);
      await load();
      setShowForm(false);
      setForm({ email:'',password:'',name:'',specialty:'General Practice',licenseNumber:'',bio:'' });
    } catch (err: unknown) { setErr(err instanceof Error ? err.message : 'Failed to create doctor'); }
    finally { setCreating(false); }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>Doctors</h1>
          <p className="text-slate-400 text-sm mt-0.5">Register and manage doctor accounts.</p>
        </div>
        <button onClick={() => { setShowForm(v=>!v); setErr(''); }} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add doctor'}
        </button>
      </div>

      {/* Guidance */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
        <span className="mt-0.5">💡</span>
        <span>Register new doctor accounts here. Each doctor receives <strong>Mon–Fri 9–5 availability by default</strong>. You can adjust this in the database or extend this form.</span>
      </div>

      {showForm && (
        <form onSubmit={createDoctor} className="card mb-7">
          <h2 className="font-bold text-brand-900 mb-5" style={{ fontFamily: 'Outfit,sans-serif' }}>Register new doctor</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full name</label><input type="text" className="input" required value={form.name} onChange={set('name')} /></div>
            <div><label className="label">Email</label><input type="email" className="input" required value={form.email} onChange={set('email')} /></div>
            <div><label className="label">Temporary password</label><input type="password" className="input" required placeholder="Min. 8 chars" value={form.password} onChange={set('password')} /></div>
            <div><label className="label">Specialty</label><select className="input" value={form.specialty} onChange={set('specialty')}>{SPECIALTIES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="label">License number</label><input type="text" className="input" required value={form.licenseNumber} onChange={set('licenseNumber')} /></div>
            <div><label className="label">Bio (optional)</label><input type="text" className="input" placeholder="Brief professional summary" value={form.bio} onChange={set('bio')} /></div>
          </div>
          {createErr && <p className="text-red-600 text-sm mt-3">{createErr}</p>}
          <button type="submit" className="btn-primary mt-5" disabled={creating}>
            {creating ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</span> : 'Create doctor account'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse"/>)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {doctors.map(d => (
            <div key={d.userId} className="card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
                  {d.name.charAt(4) || d.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{d.name}</p>
                  <p className="text-teal-600 text-xs font-medium">{d.specialty}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{d.user.email}</p>
                  <p className="text-xs text-slate-400">Lic: {d.licenseNumber}</p>
                  {d.bio && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{d.bio}</p>}
                  <div className="flex gap-1 mt-2.5 flex-wrap">
                    {d.availability.map(a => (
                      <span key={a.dayOfWeek} className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-md px-1.5 py-0.5">{DAYS[a.dayOfWeek]}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {doctors.length === 0 && (
            <div className="col-span-2 card text-center py-14 text-slate-400">No doctors registered yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
