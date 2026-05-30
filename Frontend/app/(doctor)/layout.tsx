'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

const navItems = [
  {
    href: '/doctor/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/doctor/appointments',
    label: 'Appointments',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    if (u.role !== 'doctor') { router.replace('/login'); return; }
    setUser(u);
  }, [router]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} userName={user.name} userRole={user.role} />
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
