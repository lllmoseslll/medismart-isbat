export interface AuthUser {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  name: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ms_token');
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ms_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, refreshToken: string, user: AuthUser) {
  localStorage.setItem('ms_token', token);
  localStorage.setItem('ms_refresh', refreshToken);
  localStorage.setItem('ms_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('ms_token');
  localStorage.removeItem('ms_refresh');
  localStorage.removeItem('ms_user');
}

export function getDashboardPath(role: string): string {
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/patient/dashboard';
}
