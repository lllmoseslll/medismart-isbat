'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuth } from '@/lib/auth';
import clsx from 'clsx';

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

export default function Sidebar({ items, userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearAuth();
    document.cookie = 'ms_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-brand-900 flex flex-col">
      <div className="p-6 border-b border-brand-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-brand-500/30 rounded-xl flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg">MediSmart</span>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-brand-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-brand-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-brand-300 text-xs capitalize">{userRole}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-brand-700 text-white'
                : 'text-brand-200 hover:bg-brand-800 hover:text-white'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-brand-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-brand-200 hover:bg-brand-800 hover:text-white transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
