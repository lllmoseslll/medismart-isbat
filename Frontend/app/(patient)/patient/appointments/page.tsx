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
  notes: { diagnosis?: string }[];
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function AppointmentsPage() {
  const params = useSearchParams();
  const specialtyParam = params.get('specialty') || '';
  const sessionIdParam = params.get('sessionId')  || '';

  const [tab, setTab]                     = useState<'upcoming'|'book'>(specialtyParam ? 'book' : 'upcoming');
  const [appointments, setAppointments]   = useState<Appointment[]>([]);
  const [doctors, setDoctors]             = useState<Doctor[]>([]);
  const [specialty, setSpecialty]         = useState(specialtyParam);
  const [selectedDoctor, setSelectedDoc]  = useState<Doctor|null>(null);
  const [selectedDate, setDate]           = useState('');
  const [selectedTime, setTime]           = useState('');
  const [booking, setBooking]             = useState(false);
  const [bookError, setBookError]         = useState('');
  const [bookSuccess, setBookSuccess]     = useState('');
  const [loading, setLoading]             = useState(true);

  useEffect(() => { loadAppointments(); }, []);
  useEffect(() => { loadDoctors(); }, [specialty]);

  async function loadAppointments() {
    try { setAppointments(await api.appointments.list() as Appointment[]); }
    finally { setLoading(false); }
  }
  async function loadDoctors() {
    try { setDoctors(await api.doctors.list(specialty ? { specialty } : undefined) as Doctor[]); }
    catch { setDoctors([]); }
  }

  function getSlots(doctor: Doctor, dateStr: string): string[] {
    if (!dateStr) return [];
    const day = new Date(dateStr).getDay();
    const avail = doctor.availability.find(a => a.dayOfWeek === day);
    if (!avail) return [];
    const slots: string[] = [];
    const [sh, sm] = avail.startTime.split(':').map(Number);
    const [eh, em] = avail.endTime.split(':').map(Number);
    for (let h = sh, m = sm; h * 60 + m < eh * 60 + em;) {
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
      m += 30; if (m >= 60) { h++; m -= 60; }
    }
    return slots;
  }

  async function bookAppointment() {
    if (!selectedDoctor || !selectedDate || !selectedTime) { setBookError('Please select a doctor, date, and time.'); return; }
    setBooking(true); setBookError(''); setBookSuccess('');
    try {
      await api.appointments.create({
        doctorId: selectedDoctor.userId,
        scheduledAt: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        ...(sessionIdParam ? { sessionId: sessionIdParam } : {}),
      });
      setBookSuccess('Appointment booked! Check your email for confirmation.');
      loadAppointments(); setTab('upcoming'); setSelectedDoc(null); setDate(''); setTime('');
    } catch (err: unknown) {
      setBookError(err instanceof Error ? err.message : 'Booking failed');
    } finally { setBooking(false); }
  }

  async function cancel(id: string) {
    if (!confirm('Cancel this appointment?')) return;
    await api.appointments.cancel(id); loadAppointments();
  }

  const upcoming = appointments.filter(a => a.status !== 'cancelled' && new Date(a.scheduledAt) > new Date());
  const past     = appointments.filter(a => a.status === 'completed' || new Date(a.scheduledAt) <= new Date());
  const slots    = selectedDoctor && selectedDate ? getSlots(selectedDoctor, selectedDate) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>Appointments</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage and book your appointments.</p>
        </div>
        <button onClick={() => setTab('book')} className="btn-primary">+ Book appointment</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 w-fit mb-7">
        {(['upcoming','book'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2 text-sm font-semibold transition-all duration-150 ${tab === t ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'book' ? '+ Book new' : 'Upcoming'}
          </button>
        ))}
      </div>

      {/* ── Upcoming tab ─────────────────── */}
      {tab === 'upcoming' && (
        <div className="space-y-5">
          {bookSuccess && (
            <div className="bg-teal-50 border border-teal-200 text-teal-800 text-sm px-4 py-3 flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {bookSuccess}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-slate-100 animate-pulse"/>)}</div>
          ) : upcoming.length === 0 ? (
            <div className="card text-center py-14">
              <div className="h-14 w-14 bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <svg className="h-7 w-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm mb-4">No upcoming appointments</p>
              <button onClick={() => setTab('book')} className="btn-primary">Book now</button>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-slate-600 text-sm uppercase tracking-wide">Upcoming ({upcoming.length})</h2>
              {upcoming.map(a => <ApptCard key={a.id} appt={a} onCancel={cancel} />)}
            </>
          )}

          {past.length > 0 && (
            <>
              <h2 className="font-semibold text-slate-400 text-sm uppercase tracking-wide mt-8">Past appointments</h2>
              {past.map(a => <ApptCard key={a.id} appt={a} onCancel={cancel} past />)}
            </>
          )}
        </div>
      )}

      {/* ── Book tab ─────────────────────── */}
      {tab === 'book' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            {/* Guidance note */}
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
              <span className="mt-0.5">💡</span>
              <span>Pick a specialty, select a doctor, choose a date and time slot, then confirm your booking.</span>
            </div>

            <div className="card">
              <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Find a doctor</h2>
              <div className="mb-5">
                <label className="label">Filter by specialty</label>
                <input type="text" className="input" value={specialty} onChange={e => setSpecialty(e.target.value)}
                  placeholder="e.g. Cardiology, General Practice, Neurology" />
              </div>
              <div className="space-y-3">
                {doctors.length === 0 ? (
                  <p className="text-slate-400 text-sm">No doctors found.</p>
                ) : doctors.map(d => (
                  <button key={d.userId} onClick={() => { setSelectedDoc(d); setDate(''); setTime(''); }}
                    className={`w-full text-left p-4 border transition-all duration-150 ${selectedDoctor?.userId === d.userId ? 'border-teal-400 bg-teal-50 ring-2 ring-teal-200' : 'border-slate-200 hover:border-teal-200 bg-white'}`}>
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
                        {d.name.charAt(3) || 'D'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{d.name}</p>
                        <p className="text-teal-600 text-xs font-medium">{d.specialty}</p>
                        {d.bio && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{d.bio}</p>}
                        <div className="flex gap-1 mt-2">
                          {d.availability.map(a => (
                            <span key={a.dayOfWeek} className="text-xs bg-slate-100 text-slate-500  px-1.5 py-0.5">{DAYS[a.dayOfWeek]}</span>
                          ))}
                        </div>
                      </div>
                      {selectedDoctor?.userId === d.userId && (
                        <span className="text-teal-600 flex-shrink-0"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedDoctor && (
              <div className="card">
                <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Select date & time</h2>
                <div className="mb-4">
                  <label className="label">Date</label>
                  <input type="date" className="input max-w-xs" value={selectedDate}
                    min={new Date().toISOString().slice(0,10)}
                    onChange={e => { setDate(e.target.value); setTime(''); }} />
                </div>
                {selectedDate && (
                  <div>
                    <label className="label">Available slots</label>
                    {slots.length === 0 ? (
                      <p className="text-slate-400 text-sm mt-2">Doctor is not available on this day.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {slots.map(slot => (
                          <button key={slot} onClick={() => setTime(slot)}
                            className={`px-3 py-2 border text-sm font-medium transition-all ${selectedTime === slot ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 text-slate-700 hover:border-teal-300 bg-white'}`}>
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {bookError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{bookError}</div>
            )}

            {selectedDoctor && selectedDate && selectedTime && (
              <button onClick={bookAppointment} className="btn-primary px-8 py-3 text-base" disabled={booking}>
                {booking ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin" />Booking…</span> : `Confirm with ${selectedDoctor.name} →`}
              </button>
            )}
          </div>

          {/* Summary sidebar */}
          <div className="card self-start sticky top-6">
            <h3 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Booking summary</h3>
            {selectedDoctor ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Doctor</span><span className="font-semibold text-slate-800">{selectedDoctor.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Specialty</span><span className="text-slate-700">{selectedDoctor.specialty}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="text-slate-700">{selectedDate || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Time</span><span className="font-semibold text-teal-700">{selectedTime || '—'}</span></div>
                {sessionIdParam && (
                  <div className="bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-700 font-medium mt-2">
                    🧠 AI assessment attached
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Select a doctor to see the booking summary.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ApptCard({ appt: a, onCancel, past }: { appt: Appointment; onCancel: (id: string) => void; past?: boolean }) {
  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
            {a.doctor.name.charAt(4) || 'D'}
          </div>
          <div>
            <p className="font-bold text-slate-900">{a.doctor.name}</p>
            <p className="text-teal-600 text-xs font-medium">{a.doctor.specialty}</p>
            <p className="text-slate-500 text-sm mt-1">
              {new Date(a.scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
            {a.notes?.[0]?.diagnosis && (
              <p className="text-xs text-slate-400 mt-1.5">Diagnosis: {a.notes[0].diagnosis}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`badge-${a.status}`}>{a.status}</span>
          {!past && a.status !== 'cancelled' && (
            <button onClick={() => onCancel(a.id)}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
}
