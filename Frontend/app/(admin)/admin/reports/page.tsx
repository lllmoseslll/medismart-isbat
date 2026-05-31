'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import StatCard from '@/components/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Report {
  totalUsers: number; totalDoctors: number; totalPatients: number; totalAppointments: number;
  appointmentsByStatus: Record<string, number>;
  recentAppointments: { id: string; scheduledAt: string; status: string; patient: { patientProfile: { name: string } | null; email: string }; doctor: { name: string; specialty: string } }[];
}

const STATUS_COLORS: Record<string, string> = { pending: '#f59e0b', confirmed: '#0d9488', completed: '#3b82f6', cancelled: '#ef4444' };

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getReports().then(d => setReport(d as Report)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-400 text-sm">Generating report…</div>;
  if (!report) return <div className="p-8 text-red-500 text-sm">Failed to load report.</div>;

  const pieData = Object.entries(report.appointmentsByStatus).map(([name, value]) => ({ name, value }));
  const barData = pieData.map(({ name, value }) => ({ status: name, count: value }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>Reports & Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">System-wide statistics and activity breakdown.</p>
        </div>
        <span className="text-xs text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
          Generated {new Date().toLocaleString()}
        </span>
      </div>

      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-7 text-sm text-blue-800">
        <span className="mt-0.5">💡</span>
        <span>Live statistics across all appointments and users. Charts and tables <strong>refresh on page load</strong>.</span>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard title="Total users"       value={report.totalUsers}        color="blue"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <StatCard title="Doctors"           value={report.totalDoctors}      color="teal"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <StatCard title="Patients"          value={report.totalPatients}     color="purple"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
        <StatCard title="Appointments"      value={report.totalAppointments} color="amber"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Appointments by status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={30}>
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {barData.map(e => <Cell key={e.status} fill={STATUS_COLORS[e.status] || '#94a3b8'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Status distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                {pieData.map(e => <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#94a3b8'} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-brand-900 mb-5" style={{ fontFamily: 'Outfit,sans-serif' }}>Recent activity</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Patient','Doctor','Specialty','Date','Status'].map(h => (
                <th key={h} className="text-left py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.recentAppointments.map(a => (
              <tr key={a.id} className="border-b border-slate-50">
                <td className="py-3 pr-4 font-semibold text-slate-900">{a.patient.patientProfile?.name || a.patient.email}</td>
                <td className="py-3 pr-4 text-slate-600">{a.doctor.name}</td>
                <td className="py-3 pr-4 text-slate-500 text-xs">{a.doctor.specialty}</td>
                <td className="py-3 pr-4 text-slate-400 text-xs">{new Date(a.scheduledAt).toLocaleDateString()}</td>
                <td className="py-3"><span className={`badge-${a.status}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
