'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

interface Doctor {
  userId: string;
  name: string;
  specialty: string;
  bio: string;
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  doctor: { name: string; specialty: string };
  session?: { aiResult?: { recommendedSpecialty: string } };
  notes: { diagnosis?: string; treatment?: string }[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AppointmentsPage() {
  const params = useSearchParams();
  const specialtyParam = params.get('specialty') || '';
  const sessionIdParam = params.get('sessionId') || '';

  const [tab, setTab] = useState<'upcoming' | 'book'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialty, setSpecialty] = useState(specialtyParam);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');
  const [bookSuccess, setBookSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (specialtyParam) setTab('book');
    loadAppointments();
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [specialty]);

  async function loadAppointments() {
    try {
      const data = await api.appointments.list();
      setAppointments(data as Appointment[]);
    } finally {
      setLoading(false);
    }
  }

  async function loadDoctors() {
    try {
      const data = await api.doctors.list(specialty ? { specialty } : undefined);
      setDoctors(data as Doctor[]);
    } catch {
      setDoctors([]);
    }
  }

  function getSlots(doctor: Doctor, dateStr: string): string[] {
    if (!dateStr) return [];
    const day = new Date(dateStr).getDay();
    const avail = doctor.availability.find(a => a.dayOfWeek === day);
    if (!avail) return [];
    const slots: string[] = [];
    const [sh, sm] = avail.startTime.split(':').map(Number);
    const [eh, em] = avail.endTime.split(':').map(Number);
    for (let h = sh, m = sm; h * 60 + m < eh * 60 + em; ) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      m += 30;
      if (m >= 60) { h++; m -= 60; }
    }
    return slots;
  }

  async function bookAppointment() {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setBookError('Please select a doctor, date and time.');
      return;
    }
    setBooking(true);
    setBookError('');
    setBookSuccess('');
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      await api.appointments.create({
        doctorId: selectedDoctor.userId,
        scheduledAt,
        ...(sessionIdParam ? { sessionId: sessionIdParam } : {}),
      });
      setBookSuccess('Appointment booked! Check your email for confirmation.');
      loadAppointments();
      setTab('upcoming');
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedTime('');
    } catch (err: unknown) {
      setBookError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setBooking(false);
    }
  }

  async function cancel(id: string) {
    if (!confirm('Cancel this appointment?')) return;
    await api.appointments.cancel(id);
    loadAppointments();
  }

  const upcoming = appointments.filter(a => a.status !== 'cancelled' && new Date(a.scheduledAt) > new Date());
  const past = appointments.filter(a => a.status === 'completed' || new Date(a.scheduledAt) <= new Date());

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 mt-1">Manage and book your appointments.</p>
        </div>
        <button onClick={() => setTab('book')} className="btn-primary">+ Book appointment</button>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {(['upcoming', 'book'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t === 'book' ? 'Book new' : 'Upcoming'}
          </button>
        ))}
      </div>

      {tab === 'upcoming' && (
        <div className="space-y-5">
          {bookSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              {bookSuccess}
            </div>
          )}

          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : upcoming.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-400 mb-3">No upcoming appointments</p>
              <button onClick={() => setTab('book')} className="btn-primary">Book now</button>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-slate-700">Upcoming ({upcoming.length})</h2>
              {upcoming.map(a => <AppointmentCard key={a.id} appointment={a} onCancel={cancel} />)}
            </>
          )}

          {past.length > 0 && (
            <>
              <h2 className="font-semibold text-slate-700 mt-8">Past appointments</h2>
              {past.map(a => <AppointmentCard key={a.id} appointment={a} onCancel={cancel} past />)}
            </>
          )}
        </div>
      )}

      {tab === 'book' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4">Find a doctor</h2>
              <div className="mb-4">
                <label className="label">Filter by specialty</label>
                <input type="text" className="input" value={specialty} onChange={e => setSpecialty(e.target.value)}
                  placeholder="e.g. Cardiology, General Practice" />
              </div>
              <div className="space-y-3">
                {doctors.length === 0 ? (
                  <p className="text-slate-400 text-sm">No doctors found.</p>
                ) : doctors.map(d => (
                  <button key={d.userId} onClick={() => { setSelectedDoctor(d); setSelectedDate(''); setSelectedTime(''); }}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${
                      selectedDoctor?.userId === d.userId
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-brand-200'
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold">
                        {d.name.charAt(3)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{d.name}</p>
                        <p className="text-sm text-brand-600">{d.specialty}</p>
                        <p className="text-xs text-slate-500 mt-1">{d.bio}</p>
                        <div className="flex gap-1 mt-2">
                          {d.availability.map(a => (
                            <span key={a.dayOfWeek} className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                              {DAYS[a.dayOfWeek]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedDoctor && (
              <div className="card">
                <h2 className="font-semibold text-slate-900 mb-4">Select date & time</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label">Date</label>
                    <input type="date" className="input" value={selectedDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); }} />
                  </div>
                </div>
                {selectedDate && (
                  <div>
                    <label className="label">Available slots</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getSlots(selectedDoctor, selectedDate).length === 0 ? (
                        <p className="text-sm text-slate-400">Doctor not available on this day.</p>
                      ) : getSlots(selectedDoctor, selectedDate).map(slot => (
                        <button key={slot} onClick={() => setSelectedTime(slot)}
                          className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                            selectedTime === slot
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'border-slate-200 text-slate-700 hover:border-brand-300'
                          }`}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {bookError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {bookError}
              </div>
            )}

            {selectedDoctor && selectedDate && selectedTime && (
              <button onClick={bookAppointment} className="btn-primary px-8 py-3" disabled={booking}>
                {booking ? 'Booking…' : `Confirm with ${selectedDoctor.name}`}
              </button>
            )}
          </div>

          <div className="card self-start">
            <h3 className="font-semibold text-slate-900 mb-3">Booking summary</h3>
            {selectedDoctor ? (
              <div className="text-sm space-y-2">
                <p><span className="text-slate-500">Doctor:</span> <span className="font-medium">{selectedDoctor.name}</span></p>
                <p><span className="text-slate-500">Specialty:</span> {selectedDoctor.specialty}</p>
                <p><span className="text-slate-500">Date:</span> {selectedDate || '—'}</p>
                <p><span className="text-slate-500">Time:</span> {selectedTime || '—'}</p>
                {sessionIdParam && <p className="text-xs text-brand-600">Linked to symptom analysis</p>}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Select a doctor to see summary</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment: a, onCancel, past }: {
  appointment: Appointment;
  onCancel: (id: string) => void;
  past?: boolean;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 font-bold text-lg">
            {a.doctor.name.charAt(4)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{a.doctor.name}</p>
            <p className="text-sm text-brand-600">{a.doctor.specialty}</p>
            <p className="text-sm text-slate-500 mt-1">
              {new Date(a.scheduledAt).toLocaleString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </p>
            {a.notes?.[0]?.diagnosis && (
              <p className="text-xs text-slate-500 mt-2">
                <span className="font-medium">Diagnosis:</span> {a.notes[0].diagnosis}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`badge-${a.status}`}>{a.status}</span>
          {!past && a.status !== 'cancelled' && (
            <button onClick={() => onCancel(a.id)}
              className="text-xs text-red-500 hover:text-red-700 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
