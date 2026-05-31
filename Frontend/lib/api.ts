import { getToken, clearAuth } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function req<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401) {
    const tok = getToken();
    if (!tok?.startsWith('demo-')) {
      clearAuth();
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || 'Request failed');
  }

  return res.json() as Promise<T>;
}

const post = <T>(path: string, data: unknown) =>
  req<T>(path, { method: 'POST', body: JSON.stringify(data) });

const put = <T>(path: string, data: unknown) =>
  req<T>(path, { method: 'PUT', body: JSON.stringify(data) });

const del = <T>(path: string) => req<T>(path, { method: 'DELETE' });

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string; role?: string }) =>
      post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
      post<{ token: string; refreshToken: string; user: { id: string; email: string; role: string; name: string } }>(
        '/auth/login',
        data
      ),
    refresh: (refreshToken: string) => post('/auth/refresh', { refreshToken }),
  },

  patients: {
    getProfile: (id: string) => req(`/patients/${id}/profile`),
    updateProfile: (id: string, data: unknown) => put(`/patients/${id}/profile`, data),
    submitSymptoms: (data: { symptoms: string | string[] }) =>
      post('/patients/symptoms', data),
    listSessions: () => req('/patients/symptoms'),
    getSession: (sessionId: string) => req(`/patients/symptoms/${sessionId}`),
  },

  doctors: {
    list: (params?: { specialty?: string; date?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return req(`/doctors${qs}`);
    },
    getAvailability: (id: string) => req(`/doctors/${id}/availability`),
    myAppointments: () => req('/doctors/me/appointments'),
    addNotes: (
      doctorId: string,
      data: { appointmentId: string; notes: string; diagnosis?: string; treatment?: string }
    ) => post(`/doctors/${doctorId}/notes`, data),
    getNotes: (doctorId: string, apptId: string) =>
      req(`/doctors/${doctorId}/notes/${apptId}`),
  },

  appointments: {
    list: () => req('/appointments'),
    create: (data: { doctorId: string; scheduledAt: string; sessionId?: string }) =>
      post('/appointments', data),
    update: (id: string, data: { status?: string; scheduledAt?: string }) =>
      put(`/appointments/${id}`, data),
    cancel: (id: string) => del(`/appointments/${id}`),
  },

  admin: {
    listUsers: () => req('/admin/users'),
    createUser: (data: unknown) => post('/admin/users', data),
    updateUser: (id: string, data: unknown) => put(`/admin/users/${id}`, data),
    resetPassword: (id: string, password: string) => put(`/admin/users/${id}/reset-password`, { password }),
    deleteUser: (id: string) => del(`/admin/users/${id}`),
    createDoctor: (data: unknown) => post('/admin/doctors', data),
    getReports: () => req('/admin/reports'),
    getKnowledgeBase: () => req('/admin/knowledge-base'),
    addKbEntry: (data: unknown) => post('/admin/knowledge-base', data),
    updateKbEntry: (id: string, data: unknown) => put(`/admin/knowledge-base/${id}`, data),
    deleteKbEntry: (id: string) => del(`/admin/knowledge-base/${id}`),
    updateDoctorAvailability: (id: string, availability: unknown[]) =>
      put(`/admin/doctors/${id}/availability`, { availability }),
    deactivateUser: (id: string) => put(`/admin/users/${id}/deactivate`, {}),
  },

  knowledgeBase: {
    list: () => req('/doctors/knowledge-base'),
    add: (data: unknown) => post('/doctors/knowledge-base', data),
  },

  notifications: {
    list: () => req('/notifications'),
  },
};
