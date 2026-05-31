'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuth } from '@/lib/auth';
import clsx from 'clsx';
import { HiOutlineLogout } from 'react-icons/hi';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: NavItem[];
  userName: string;
  userRole: string;
}

const roleMeta: Record<string, { label: string; pill: string }> = {
  patient: { label: 'Patient',       pill: 'bg-teal-500/20 text-teal-200 border border-teal-500/30' },
  doctor:  { label: 'Doctor',        pill: 'bg-sky-500/20 text-sky-200 border border-sky-500/30' },
  admin:   { label: 'Administrator', pill: 'bg-violet-500/20 text-violet-200 border border-violet-500/30' },
};

export default function Sidebar({ items, userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const meta     = roleMeta[userRole] ?? roleMeta.patient;

  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase();

  function logout() {
    clearAuth();
    document.cookie = 'ms_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 flex flex-col z-40" style={{ backgroundColor: '#0c4a6e' }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0284c7)' }}>
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'Outfit,sans-serif' }}>
            MediSmart
          </span>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate leading-tight">{userName}</p>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 ${meta.pill}`}>
              {meta.label}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {items.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 group',
                active ? 'bg-teal-600 text-white' : 'text-blue-100/60 hover:bg-white/10 hover:text-white'
              )}>
              <span className={clsx('flex-shrink-0 text-lg transition-colors', active ? 'text-teal-100' : 'text-blue-200/50 group-hover:text-blue-100')}>
                {item.icon}
              </span>
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 bg-teal-200" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 pt-3 border-t border-white/10">
        <button onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-blue-100/50 hover:bg-white/10 hover:text-white transition-all duration-150">
          <HiOutlineLogout className="text-lg flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
