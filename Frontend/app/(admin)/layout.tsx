'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import { HiOutlineHome, HiOutlineUsers, HiOutlineUserGroup, HiOutlineChartBar, HiOutlineBookOpen } from 'react-icons/hi';

const navItems = [
  { href: '/admin/dashboard',      label: 'Dashboard',      icon: <HiOutlineHome className="text-lg" /> },
  { href: '/admin/users',          label: 'Users',          icon: <HiOutlineUsers className="text-lg" /> },
  { href: '/admin/doctors',        label: 'Doctors',        icon: <HiOutlineUserGroup className="text-lg" /> },
  { href: '/admin/reports',        label: 'Reports',        icon: <HiOutlineChartBar className="text-lg" /> },
  { href: '/admin/knowledge-base', label: 'Knowledge Base', icon: <HiOutlineBookOpen className="text-lg" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    if (u.role !== 'admin') { router.replace('/login'); return; }
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
