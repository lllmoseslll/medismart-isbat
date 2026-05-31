'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineBookOpen } from 'react-icons/hi';

interface KbEntry { id: string; conditionName: string; symptomKeywords: string[]; specialty: string; updatedAt: string; }

const SPECIALTIES = ['General Practice','Cardiology','Neurology','Dermatology','Psychiatry','Orthopedics','Gastroenterology','Pulmonology','Endocrinology','Urology','Rheumatology','Ophthalmology'];

export default function DoctorKnowledgeBasePage() {
  const user = getUser();
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ conditionName:'', symptomKeywords:'', specialty:'General Practice' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch]  = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try { setEntries(await api.knowledgeBase.list() as KbEntry[]); } finally { setLoading(false); }
  }

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const created = await api.knowledgeBase.add({
        conditionName: form.conditionName,
        symptomKeywords: form.symptomKeywords.split(',').map(s=>s.trim()).filter(Boolean),
        specialty: form.specialty,
      }) as KbEntry;
      setEntries(prev => [...prev, created]);
      setForm({ conditionName:'', symptomKeywords:'', specialty:'General Practice' });
      setShowForm(false);
      setSuccess(`"${created.conditionName}" was added to the knowledge base successfully.`);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to add entry'); }
    finally { setSaving(false); }
  }

  const filtered = entries.filter(e =>
    e.conditionName.toLowerCase().includes(search.toLowerCase()) ||
    e.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-0.5">Contribute medical knowledge that improves MediSmart AI predictions.</p>
        </div>
        <button onClick={() => { setShowForm(v=>!v); setError(''); }}
          className="btn-primary">
          <HiOutlinePlus className="text-base" /> {showForm ? 'Cancel' : 'Add entry'}
        </button>
      </div>

      <div className="bg-teal-50 border border-teal-200 px-4 py-4 mb-6 text-sm text-teal-800 flex items-start gap-3">
        <HiOutlineBookOpen className="text-xl flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">How this works</p>
          <p>As a doctor, you can submit conditions, associated symptoms, and the appropriate specialist type. MediSmart AI uses this knowledge base when analysing patient symptoms. Your clinical expertise directly improves prediction accuracy.</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 border-teal-200">
          <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Submit a condition entry</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Condition name</label>
              <input type="text" className="input" required value={form.conditionName} onChange={set('conditionName')}
                placeholder="e.g. Tension Headache" />
            </div>
            <div>
              <label className="label">Specialist type</label>
              <select className="input" value={form.specialty} onChange={set('specialty')}>
                {SPECIALTIES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Symptom keywords (comma separated)</label>
              <textarea className="input resize-none h-24" required value={form.symptomKeywords} onChange={set('symptomKeywords')}
                placeholder="throbbing headache, pressure, neck stiffness, stress, fatigue, sensitivity to light" />
              <p className="text-xs text-slate-400 mt-1">
                Be specific. Include all symptoms that typically present with this condition.
                {form.symptomKeywords.split(',').filter(s=>s.trim()).length > 0 &&
                  <span className="font-medium text-teal-700"> {form.symptomKeywords.split(',').filter(s=>s.trim()).length} keywords</span>}
              </p>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit to knowledge base'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {success && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 text-sm px-4 py-3 mb-5  flex items-center gap-2">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {success}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input type="text" className="input pl-9 max-w-xs" placeholder="Search conditions"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="text-sm text-slate-400">{filtered.length} entries in database</span>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-slate-100 animate-pulse "/>)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <div key={entry.id} className="card hover:shadow-md transition-shadow duration-150">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-slate-900">{entry.conditionName}</h3>
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5  font-medium">{entry.specialty}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.symptomKeywords.map(kw => (
                      <span key={kw} className="text-xs bg-slate-100 text-slate-600 border border-slate-200  px-2 py-0.5">{kw}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{entry.symptomKeywords.length} keywords</p>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="card text-center py-10 text-slate-400">No entries found.</div>}
        </div>
      )}
    </div>
  );
}
