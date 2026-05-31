'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import { HiOutlineHome, HiOutlineCalendar, HiOutlineBookOpen } from 'react-icons/hi';

const navItems = [
  { href: '/doctor/dashboard',      label: 'Dashboard',       icon: <HiOutlineHome className="text-lg" /> },
  { href: '/doctor/appointments',   label: 'Appointments',    icon: <HiOutlineCalendar className="text-lg" /> },
  { href: '/doctor/knowledge-base', label: 'Knowledge Base',  icon: <HiOutlineBookOpen className="text-lg" /> },
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
    <div className="flex min-h-screen" style={{ backgroundColor: '#f0f9ff' }}>
      <Sidebar items={navItems} userName={user.name} userRole={user.role} />
      <main className="ml-64 flex-1 min-h-screen">{children}</main>
    </div>
  );
}
