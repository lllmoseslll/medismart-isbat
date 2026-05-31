'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineKey, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

interface User {
  id: string; email: string; role: string; createdAt: string;
  patientProfile: { name: string; phone?: string } | null;
  doctorProfile:  { name: string; specialty: string; licenseNumber: string } | null;
}

type Modal = 'create' | 'edit' | 'reset' | 'delete' | null;

const ROLES = ['patient', 'doctor', 'admin'] as const;
const SPECIALTIES = ['General Practice','Cardiology','Neurology','Dermatology','Psychiatry','Orthopedics',
  'Gastroenterology','Pulmonology','Endocrinology','Urology','Rheumatology','Ophthalmology','Haematology'];

const roleStyle: Record<string, string> = {
  admin:   'bg-violet-100 text-violet-800 border-violet-200',
  doctor:  'bg-sky-100 text-sky-800 border-sky-200',
  patient: 'bg-slate-100 text-slate-600 border-slate-200',
};

function displayName(u: User) {
  return u.patientProfile?.name || u.doctorProfile?.name || u.email;
}

export default function UsersPage() {
  const me = getUser();
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('all');
  const [modal, setModal]       = useState<Modal>(null);
  const [target, setTarget]     = useState<User | null>(null);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'patient', specialty: 'General Practice', licenseNumber: '', bio: '',
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setUsers(await api.admin.listUsers() as User[]); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm({ name: '', email: '', password: '', confirmPassword: '', role: 'patient', specialty: 'General Practice', licenseNumber: '', bio: '' });
    setError(''); setModal('create');
  }
  function openEdit(u: User) {
    setForm({ name: displayName(u), email: u.email, password: '', confirmPassword: '',
      role: u.role, specialty: u.doctorProfile?.specialty || 'General Practice',
      licenseNumber: u.doctorProfile?.licenseNumber || '', bio: '' });
    setTarget(u); setError(''); setModal('edit');
  }
  function openReset(u: User)  { setTarget(u); setNewPassword(''); setError(''); setModal('reset'); }
  function openDelete(u: User) { setTarget(u); setModal('delete'); }
  function close() { setModal(null); setTarget(null); setError(''); }

  function setF(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setSaving(true); setError('');
    try {
      await api.admin.createUser(form);
      await load(); close();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to create user'); }
    finally { setSaving(false); }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!target) return;
    setSaving(true); setError('');
    try {
      await api.admin.updateUser(target.id, { name: form.name, email: form.email, role: form.role });
      await load(); close();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to update user'); }
    finally { setSaving(false); }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    if (!target || newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSaving(true); setError('');
    try {
      await api.admin.resetPassword(target.id, newPassword);
      close();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to reset password'); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    try {
      await api.admin.deleteUser(target.id);
      setUsers(prev => prev.filter(x => x.id !== target.id));
      close();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to delete user'); }
    finally { setDeleting(false); }
  }

  const filtered = users.filter(u => {
    const name = displayName(u);
    const matchText = name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchText && matchRole;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>User Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Create, edit, reset passwords, and delete accounts.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <HiOutlinePlus className="text-base" /> Create user
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 px-4 py-3 mb-6 text-sm text-blue-800 flex items-start gap-2">
        <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>Create any account type including Admin. Deleting a user permanently removes all their appointments, notes, and data. You cannot delete your own account.</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input type="text" className="input pl-9 max-w-xs" placeholder="Search by name or email"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[160px]" value={roleFilter} onChange={e => setRole(e.target.value)}>
          <option value="all">All roles</option>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i=><div key={i} className="h-14 bg-slate-100 animate-pulse"/>)}</div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Name','Email','Role','Specialty','Joined','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const name = displayName(u);
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {name}{isMe && <span className="ml-1.5 text-xs text-slate-400 font-normal">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold border capitalize ${roleStyle[u.role] ?? roleStyle.patient}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{u.doctorProfile?.specialty || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-UG')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} title="Edit"
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                          <HiOutlinePencil className="text-base" />
                        </button>
                        <button onClick={() => openReset(u)} title="Reset password"
                          className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors">
                          <HiOutlineKey className="text-base" />
                        </button>
                        {!isMe && (
                          <button onClick={() => openDelete(u)} title="Delete user"
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors">
                            <HiOutlineTrash className="text-base" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────── */}
      {modal && modal !== 'delete' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>
                {modal === 'create' ? 'Create user' : modal === 'edit' ? 'Edit user' : 'Reset password'}
              </h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-600">
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            <div className="px-6 py-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-4">{error}</div>
              )}

              {/* ── Create ── */}
              {modal === 'create' && (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="label">Full name</label>
                    <input type="text" className="input" required placeholder="Full name" value={form.name} onChange={setF('name')} />
                  </div>
                  <div>
                    <label className="label">Email address</label>
                    <input type="email" className="input" required placeholder="email@example.com" value={form.email} onChange={setF('email')} />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select className="input" value={form.role} onChange={setF('role')}>
                      {ROLES.map(r => (
                        <option key={r} value={r}>
                          {r === 'admin' ? '🛡️ Admin — Full system access' : r === 'doctor' ? '👩‍⚕️ Doctor — Manage appointments' : '🧑‍💼 Patient — Book appointments'}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.role === 'doctor' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Specialty</label>
                        <select className="input" value={form.specialty} onChange={setF('specialty')}>
                          {SPECIALTIES.map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">License no.</label>
                        <input type="text" className="input" value={form.licenseNumber} onChange={setF('licenseNumber')} placeholder="MD-0001" />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Password</label>
                      <input type="password" className="input" required minLength={8} value={form.password} onChange={setF('password')} placeholder="Min 8 chars" />
                    </div>
                    <div>
                      <label className="label">Confirm</label>
                      <input type="password" className="input" required value={form.confirmPassword} onChange={setF('confirmPassword')} placeholder="Repeat" />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={saving}>
                    {saving ? 'Creating…' : `Create ${form.role} account`}
                  </button>
                </form>
              )}

              {/* ── Edit ── */}
              {modal === 'edit' && target && (
                <form onSubmit={handleEdit} className="space-y-4">
                  {target.role !== 'admin' && (
                    <div>
                      <label className="label">Full name</label>
                      <input type="text" className="input" value={form.name} onChange={setF('name')} placeholder="Full name" />
                    </div>
                  )}
                  <div>
                    <label className="label">Email address</label>
                    <input type="email" className="input" value={form.email} onChange={setF('email')} />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select className="input" value={form.role} onChange={setF('role')} disabled={target.id === me?.id}>
                      {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                    {target.id === me?.id && <p className="text-xs text-slate-400 mt-1">You cannot change your own role.</p>}
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </form>
              )}

              {/* ── Reset password ── */}
              {modal === 'reset' && target && (
                <form onSubmit={handleReset} className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Reset password for <strong>{displayName(target)}</strong>.
                  </p>
                  <div>
                    <label className="label">New password</label>
                    <input type="password" className="input" required minLength={8} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" />
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={saving}>
                    {saving ? 'Resetting…' : 'Reset password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {modal === 'delete' && target && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-xl w-full max-w-sm">
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-red-100 flex items-center justify-center flex-shrink-0">
                  <HiOutlineTrash className="text-red-600 text-xl" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Delete account</h2>
                  <p className="text-xs text-slate-400">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-2">
                You are about to permanently delete:
              </p>
              <div className="bg-slate-50 border border-slate-200 px-4 py-3 mb-4">
                <p className="font-semibold text-slate-900 text-sm">{displayName(target)}</p>
                <p className="text-xs text-slate-500">{target.email}</p>
                <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 text-xs font-semibold border capitalize ${roleStyle[target.role]}`}>
                  {target.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                All their appointments, consultation notes, symptom sessions, and data will be permanently removed.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-4">{error}</div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={close} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
