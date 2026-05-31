'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import { HiOutlineHome, HiOutlineLightBulb, HiOutlineCalendar, HiOutlineUser } from 'react-icons/hi';

const navItems = [
  { href: '/patient/dashboard',     label: 'Dashboard',         icon: <HiOutlineHome className="text-lg" /> },
  { href: '/patient/symptoms',      label: 'Symptom Analysis',  icon: <HiOutlineLightBulb className="text-lg" /> },
  { href: '/patient/appointments',  label: 'Appointments',      icon: <HiOutlineCalendar className="text-lg" /> },
  { href: '/patient/profile',       label: 'My Profile',        icon: <HiOutlineUser className="text-lg" /> },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    if (u.role !== 'patient') { router.replace('/login'); return; }
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
