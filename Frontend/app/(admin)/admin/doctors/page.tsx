'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { HiOutlinePlus, HiOutlineUsers, HiOutlineBriefcase } from 'react-icons/hi';

interface Doctor {
  userId: string; name: string; specialty: string; bio?: string; licenseNumber: string;
  user: { email: string };
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
  patientCount?: number;
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const SPECIALTIES = ['General Practice','Cardiology','Neurology','Dermatology','Psychiatry','Orthopedics','Gastroenterology','Pulmonology','Endocrinology','Urology','Rheumatology','Ophthalmology'];

export default function DoctorsPage() {
  const [doctors, setDoctors]   = useState<Doctor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email:'',password:'',name:'',specialty:'General Practice',licenseNumber:'',bio:'' });
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try { setDoctors(await api.doctors.list() as Doctor[]); } finally { setLoading(false); }
  }

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function create(e: FormEvent) {
    e.preventDefault(); setCreating(true); setError('');
    try {
      await api.admin.createDoctor(form);
      await load(); setShowForm(false);
      setForm({ email:'',password:'',name:'',specialty:'General Practice',licenseNumber:'',bio:'' });
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setCreating(false); }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>Doctors</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage doctor accounts, specializations, and patient loads.</p>
        </div>
        <button onClick={() => { setShowForm(v=>!v); setError(''); }} className="btn-primary">
          <HiOutlinePlus className="text-base" /> {showForm ? 'Cancel' : 'Add doctor'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 px-4 py-3 mb-6 text-sm text-blue-800 flex items-start gap-2">
        <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Each doctor card shows their specialization and how many patients they have on record. New doctors get Mon to Fri 9 to 5 availability by default.</span>
      </div>

      {showForm && (
        <form onSubmit={create} className="card mb-6">
          <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Register new doctor</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full name</label><input type="text" className="input" required value={form.name} onChange={set('name')} /></div>
            <div><label className="label">Email</label><input type="email" className="input" required value={form.email} onChange={set('email')} /></div>
            <div><label className="label">Temporary password</label><input type="password" className="input" required placeholder="Min 8 chars" value={form.password} onChange={set('password')} /></div>
            <div><label className="label">Specialty</label><select className="input" value={form.specialty} onChange={set('specialty')}>{SPECIALTIES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="label">License number</label><input type="text" className="input" required value={form.licenseNumber} onChange={set('licenseNumber')} /></div>
            <div><label className="label">Bio</label><input type="text" className="input" placeholder="Brief professional summary" value={form.bio} onChange={set('bio')} /></div>
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <button type="submit" className="btn-primary mt-4" disabled={creating}>
            {creating ? 'Creating...' : 'Create doctor account'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-44 bg-slate-100 animate-pulse "/>)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {doctors.map(d => (
            <div key={d.userId} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12  flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
                  {d.name.charAt(4) || d.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{d.name}</p>
                  <p className="text-xs text-slate-400 mb-2">{d.user.email}</p>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 ">
                      <HiOutlineBriefcase className="text-sm flex-shrink-0" />
                      {d.specialty}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 ">
                      <HiOutlineUsers className="text-sm flex-shrink-0" />
                      {d.patientCount ?? 0} patient{d.patientCount !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-2">Lic: {d.licenseNumber}</p>
                  {d.bio && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{d.bio}</p>}

                  <div className="flex gap-1 flex-wrap">
                    {d.availability.map(a => (
                      <span key={a.dayOfWeek} className="text-xs bg-slate-100 text-slate-500 border border-slate-200  px-1.5 py-0.5">{DAYS[a.dayOfWeek]}</span>
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
