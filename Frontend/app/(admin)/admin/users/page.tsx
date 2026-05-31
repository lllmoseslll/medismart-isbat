'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string; email: string; role: string; createdAt: string;
  patientProfile: { name: string } | null;
  doctorProfile:  { name: string; specialty: string } | null;
}

export default function UsersPage() {
  const [users, setUsers]         = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRole]     = useState('all');

  useEffect(() => {
    api.admin.listUsers().then(d => setUsers(d as User[])).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function deactivate(id: string) {
    if (!confirm('Deactivate this user?')) return;
    await api.admin.deactivateUser(id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'patient' } : u));
  }

  const filtered = users.filter(u => {
    const name = u.patientProfile?.name || u.doctorProfile?.name || u.email;
    return (name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
      && (roleFilter === 'all' || u.role === roleFilter);
  });

  const roleStyle: Record<string, string> = {
    admin:   'bg-violet-100 text-violet-800 border-violet-200',
    doctor:  'bg-sky-100 text-sky-800 border-sky-200',
    patient: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>Users</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage all registered accounts across the platform.</p>
      </div>

      {/* Guidance */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
        <span className="mt-0.5">💡</span>
        <span>Search and filter all registered accounts. Use <strong>Deactivate</strong> to revoke a user's role (sets them to patient). Admin accounts cannot be deactivated here.</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input type="text" className="input max-w-xs" placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input max-w-[170px]" value={roleFilter} onChange={e => setRole(e.target.value)}>
          <option value="all">All roles</option>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i=><div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse"/>)}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Name','Email','Role','Specialty','Joined',''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const name = u.patientProfile?.name || u.doctorProfile?.name || '—';
                return (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{name}</td>
                    <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${roleStyle[u.role] ?? roleStyle.patient}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{u.doctorProfile?.specialty || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      {u.role !== 'admin' && (
                        <button onClick={() => deactivate(u.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">Deactivate</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
