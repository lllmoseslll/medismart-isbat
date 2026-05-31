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

// ─── Booking Modal ────────────────────────────────────────
function BookingModal({
  doctor, sessionId, onClose, onBooked,
}: {
  doctor: Doctor;
  sessionId: string;
  onClose: () => void;
  onBooked: (msg: string) => void;
}) {
  const [date, setDate]       = useState('');
  const [time, setTime]       = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError]     = useState('');
  const slots = date ? getSlots(doctor, date) : [];

  async function confirm() {
    if (!date || !time) { setError('Please select a date and time slot.'); return; }
    setBooking(true); setError('');
    try {
      await api.appointments.create({
        doctorId: doctor.userId,
        scheduledAt: new Date(`${date}T${time}:00`).toISOString(),
        ...(sessionId ? { sessionId } : {}),
      });
      onBooked(`Appointment booked with ${doctor.name}! Check your email for confirmation.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed');
      setBooking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
          style={{ background: 'linear-gradient(135deg,#0c4a6e,#0369a1)' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              {doctor.name.replace('Dr. ','').charAt(0)}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{doctor.name}</p>
              <p className="text-blue-200 text-xs">{doctor.specialty}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Availability days */}
          <div>
            <p className="label mb-2">Available days</p>
            <div className="flex gap-1.5 flex-wrap">
              {doctor.availability.length > 0
                ? doctor.availability.map(a => (
                    <span key={a.dayOfWeek}
                      className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 font-medium">
                      {DAYS[a.dayOfWeek]} {a.startTime}–{a.endTime}
                    </span>
                  ))
                : <span className="text-xs text-slate-400">No availability set</span>
              }
            </div>
          </div>

          {/* Date picker */}
          <div>
            <label className="label">Select date</label>
            <input type="date" className="input"
              min={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={e => { setDate(e.target.value); setTime(''); setError(''); }} />
          </div>

          {/* Time slots */}
          {date && (
            <div>
              <label className="label">Available time slots</label>
              {slots.length === 0 ? (
                <p className="text-sm text-slate-400 mt-1">
                  {doctor.name} is not available on{' '}
                  {new Date(date).toLocaleDateString('en-UG', { weekday: 'long' })}.
                  Please choose another date.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {slots.map(slot => (
                    <button key={slot} type="button" onClick={() => { setTime(slot); setError(''); }}
                      className={`py-2 text-sm font-semibold border transition-all duration-100 ${
                        time === slot
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 bg-white'
                      }`}>
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI session badge */}
          {sessionId && (
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-800 font-medium">
              <span>🧠</span> Your AI symptom assessment will be attached to this appointment.
            </div>
          )}

          {/* Summary */}
          {date && time && (
            <div className="bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-800 mb-1">Booking summary</p>
              <div className="flex justify-between text-slate-600">
                <span>Doctor</span><span className="font-medium text-slate-800">{doctor.name}</span>
              </div>
              <div className="flex justify-between text-slate-600 mt-1">
                <span>Date &amp; time</span>
                <span className="font-medium text-slate-800">
                  {new Date(`${date}T${time}`).toLocaleString('en-UG', {
                    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={confirm} disabled={booking || !date || !time} className="btn-primary flex-1">
            {booking
              ? <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin" />Booking…
                </span>
              : 'Confirm booking →'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────
export default function AppointmentsPage() {
  const params         = useSearchParams();
  const specialtyParam = params.get('specialty') || '';
  const sessionIdParam = params.get('sessionId')  || '';

  const [tab, setTab]           = useState<'upcoming'|'book'>(specialtyParam ? 'book' : 'upcoming');
  const [appointments, setApts] = useState<Appointment[]>([]);
  const [doctors, setDoctors]   = useState<Doctor[]>([]);
  const [specialty, setSpec]    = useState(specialtyParam);
  const [modalDoc, setModalDoc] = useState<Doctor | null>(null);
  const [bookSuccess, setSuccess] = useState('');
  const [loading, setLoading]   = useState(true);
  const [docsLoading, setDL]    = useState(false);

  useEffect(() => { loadAppointments(); }, []);
  useEffect(() => { loadDoctors(); }, [specialty]);

  async function loadAppointments() {
    try { setApts(await api.appointments.list() as Appointment[]); }
    finally { setLoading(false); }
  }

  async function loadDoctors() {
    setDL(true);
    try { setDoctors(await api.doctors.list(specialty ? { specialty } : undefined) as Doctor[]); }
    catch { setDoctors([]); }
    finally { setDL(false); }
  }

  function handleBooked(msg: string) {
    setModalDoc(null);
    setSuccess(msg);
    setTab('upcoming');
    loadAppointments();
  }

  async function cancel(id: string) {
    if (!confirm('Cancel this appointment?')) return;
    await api.appointments.cancel(id);
    loadAppointments();
  }

  const upcoming = appointments.filter(a => a.status !== 'cancelled' && new Date(a.scheduledAt) > new Date());
  const past     = appointments.filter(a => a.status === 'completed' || new Date(a.scheduledAt) <= new Date());

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Booking modal */}
      {modalDoc && (
        <BookingModal
          doctor={modalDoc}
          sessionId={sessionIdParam}
          onClose={() => setModalDoc(null)}
          onBooked={handleBooked}
        />
      )}

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
            className={`px-6 py-2 text-sm font-semibold transition-all duration-150 ${
              tab === t ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t === 'book' ? '+ Book new' : `Upcoming${upcoming.length > 0 ? ` (${upcoming.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── Upcoming ─────────────────────────── */}
      {tab === 'upcoming' && (
        <div className="space-y-4">
          {bookSuccess && (
            <div className="bg-teal-50 border border-teal-200 text-teal-800 text-sm px-4 py-3 flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <p className="text-slate-400 text-sm mb-4">No upcoming appointments</p>
              <button onClick={() => setTab('book')} className="btn-primary">Book now</button>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Upcoming — {upcoming.length}</p>
              {upcoming.map(a => <ApptCard key={a.id} appt={a} onCancel={cancel} />)}
            </>
          )}

          {past.length > 0 && (
            <div className="pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Past appointments — {past.length}</p>
              {past.map(a => <ApptCard key={a.id} appt={a} onCancel={cancel} past />)}
            </div>
          )}
        </div>
      )}

      {/* ── Book new ─────────────────────────── */}
      {tab === 'book' && (
        <div className="space-y-5">
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
            <span>💡</span>
            <span>Filter by specialty, then click a doctor card to open the booking form.</span>
          </div>

          {/* Specialty filter */}
          <div className="flex gap-3 items-center">
            <input type="text" className="input max-w-xs" placeholder="Filter by specialty…"
              value={specialty} onChange={e => setSpec(e.target.value)} />
            {specialty && (
              <button onClick={() => setSpec('')} className="text-xs text-slate-400 hover:text-slate-600">
                Clear ✕
              </button>
            )}
          </div>

          {docsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i=><div key={i} className="h-36 bg-slate-100 animate-pulse"/>)}
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-slate-400 text-sm">No doctors found{specialty ? ` for "${specialty}"` : ''}.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map(d => (
                <button key={d.userId} onClick={() => setModalDoc(d)}
                  className="text-left p-5 bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all duration-150 group">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
                      {d.name.replace('Dr. ','').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{d.name}</p>
                      <p className="text-teal-600 text-xs font-medium mt-0.5">{d.specialty}</p>
                      {d.bio && <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{d.bio}</p>}
                      <div className="flex gap-1 flex-wrap mt-2">
                        {d.availability.map(a => (
                          <span key={a.dayOfWeek} className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5">
                            {DAYS[a.dayOfWeek]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0 text-lg">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Appointment card ─────────────────────────────────────
function ApptCard({ appt: a, onCancel, past }: { appt: Appointment; onCancel: (id: string) => void; past?: boolean }) {
  return (
    <div className="card hover:shadow-md transition-shadow duration-150">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)' }}>
            {a.doctor.name.replace('Dr. ','').charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{a.doctor.name}</p>
            <p className="text-teal-600 text-xs font-medium">{a.doctor.specialty}</p>
            <p className="text-slate-500 text-sm mt-1">
              {new Date(a.scheduledAt).toLocaleString('en-UG', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </p>
            {a.notes?.[0]?.diagnosis && (
              <p className="text-xs text-slate-400 mt-1">Dx: {a.notes[0].diagnosis}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`badge-${a.status}`}>{a.status}</span>
          {!past && a.status !== 'cancelled' && (
            <button onClick={() => onCancel(a.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
