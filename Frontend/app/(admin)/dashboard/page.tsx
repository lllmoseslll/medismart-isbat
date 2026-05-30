'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import StatCard from '@/components/StatCard';

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

export default function AdminDashboard() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getReports()
      .then(data => setReport(data as Report))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm">Loading dashboard…</div>;
  if (!report) return <div className="text-red-500 text-sm">Failed to load dashboard.</div>;

  const { appointmentsByStatus: s } = report;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">System health and activity overview.</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard title="Total users" value={report.totalUsers} color="blue"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard title="Doctors" value={report.totalDoctors} color="green"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <StatCard title="Patients" value={report.totalPatients} color="purple"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard title="Total appointments" value={report.totalAppointments} color="amber"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4">Recent appointments</h2>
            {report.recentAppointments.length === 0 ? (
              <p className="text-slate-400 text-sm">No appointments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 font-medium text-slate-500">Patient</th>
                      <th className="text-left py-2 font-medium text-slate-500">Doctor</th>
                      <th className="text-left py-2 font-medium text-slate-500">Date</th>
                      <th className="text-left py-2 font-medium text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.recentAppointments.map(a => (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2.5 font-medium">
                          {a.patient.patientProfile?.name || a.patient.email}
                        </td>
                        <td className="py-2.5 text-slate-600">{a.doctor.name}</td>
                        <td className="py-2.5 text-slate-500">
                          {new Date(a.scheduledAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5">
                          <span className={`badge-${a.status}`}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Appointment status</h3>
            <div className="space-y-3">
              {[
                { key: 'pending', label: 'Pending', color: 'bg-amber-500' },
                { key: 'confirmed', label: 'Confirmed', color: 'bg-green-500' },
                { key: 'completed', label: 'Completed', color: 'bg-blue-500' },
                { key: 'cancelled', label: 'Cancelled', color: 'bg-red-400' },
              ].map(({ key, label, color }) => {
                const count = s[key] || 0;
                const pct = report.totalAppointments > 0
                  ? Math.round((count / report.totalAppointments) * 100)
                  : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-medium">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
