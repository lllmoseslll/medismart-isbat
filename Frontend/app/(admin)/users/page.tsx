'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  patientProfile: { name: string } | null;
  doctorProfile: { name: string; specialty: string } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    api.admin.listUsers()
      .then(data => setUsers(data as User[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function deactivate(id: string) {
    if (!confirm('Deactivate this user?')) return;
    await api.admin.deactivateUser(id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'patient' } : u));
  }

  const filtered = users.filter(u => {
    const name = u.patientProfile?.name || u.doctorProfile?.name || u.email;
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-500 mt-1">Manage all registered accounts.</p>
      </div>

      <div className="flex gap-4 mb-6">
        <input type="text" className="input max-w-xs" placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input max-w-[160px]" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All roles</option>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Name</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Email</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Role</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Specialty</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const name = u.patientProfile?.name || u.doctorProfile?.name || '—';
                return (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{name}</td>
                    <td className="px-6 py-3 text-slate-600">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{u.doctorProfile?.specialty || '—'}</td>
                    <td className="px-6 py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-right">
                      {u.role !== 'admin' && (
                        <button onClick={() => deactivate(u.id)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors">
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
