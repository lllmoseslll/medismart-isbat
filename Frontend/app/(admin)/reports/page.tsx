'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import StatCard from '@/components/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Report {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  appointmentsByStatus: Record<string, number>;
  recentAppointments: {
    id: string;
    scheduledAt: string;
    status: string;
    patient: { patientProfile: { name: string } | null; email: string };
    doctor: { name: string; specialty: string };
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  completed: '#3b82f6',
  cancelled: '#ef4444',
};

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getReports()
      .then(data => setReport(data as Report))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm">Generating report…</div>;
  if (!report) return <div className="text-red-500 text-sm">Failed to load report.</div>;

  const pieData = Object.entries(report.appointmentsByStatus).map(([name, value]) => ({ name, value }));
  const barData = pieData.map(({ name, value }) => ({ status: name, count: value }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">System-wide statistics and activity.</p>
        </div>
        <span className="text-xs text-slate-400">
          Generated {new Date().toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard title="Total users" value={report.totalUsers} color="blue"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard title="Doctors" value={report.totalDoctors} color="green"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <StatCard title="Patients" value={report.totalPatients} color="purple"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard title="Appointments" value={report.totalAppointments} color="amber"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Appointments by status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData}>
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Status distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-4">Recent activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-medium text-slate-500">Patient</th>
                <th className="text-left py-2 font-medium text-slate-500">Doctor</th>
                <th className="text-left py-2 font-medium text-slate-500">Specialty</th>
                <th className="text-left py-2 font-medium text-slate-500">Date</th>
                <th className="text-left py-2 font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.recentAppointments.map(a => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="py-2.5 font-medium">{a.patient.patientProfile?.name || a.patient.email}</td>
                  <td className="py-2.5 text-slate-600">{a.doctor.name}</td>
                  <td className="py-2.5 text-slate-500">{a.doctor.specialty}</td>
                  <td className="py-2.5 text-slate-400">{new Date(a.scheduledAt).toLocaleDateString()}</td>
                  <td className="py-2.5"><span className={`badge-${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
