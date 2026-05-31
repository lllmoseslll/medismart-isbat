'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';

interface KbEntry { id: string; conditionName: string; symptomKeywords: string[]; specialty: string; updatedAt: string; }

const SPECIALTIES = ['General Practice','Cardiology','Neurology','Dermatology','Psychiatry','Orthopedics','Gastroenterology','Pulmonology','Endocrinology','Urology','Rheumatology','Ophthalmology'];

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId]   = useState<string|null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ conditionName:'', symptomKeywords:'', specialty:'General Practice' });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try { setEntries(await api.admin.getKnowledgeBase() as KbEntry[]); } finally { setLoading(false); }
  }

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function startEdit(e: KbEntry) {
    setEditId(e.id); setShowAdd(false); setError('');
    setForm({ conditionName: e.conditionName, symptomKeywords: e.symptomKeywords.join(', '), specialty: e.specialty });
  }

  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    const payload = {
      conditionName: form.conditionName,
      symptomKeywords: form.symptomKeywords.split(',').map(s=>s.trim()).filter(Boolean),
      specialty: form.specialty,
    };
    try {
      if (editId) {
        const updated = await api.admin.updateKbEntry(editId, payload) as KbEntry;
        setEntries(prev => prev.map(e => e.id === editId ? updated : e));
        setEditId(null);
      } else {
        const created = await api.admin.addKbEntry(payload) as KbEntry;
        setEntries(prev => [...prev, created]);
        setShowAdd(false);
      }
      setForm({ conditionName:'', symptomKeywords:'', specialty:'General Practice' });
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this entry from the knowledge base?')) return;
    await api.admin.deleteKbEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  const filtered = entries.filter(e =>
    e.conditionName.toLowerCase().includes(search.toLowerCase()) ||
    e.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-0.5">Medical conditions, symptoms, and specialist mappings that power MediSmart AI.</p>
        </div>
        <button onClick={() => { setShowAdd(v=>!v); setEditId(null); setForm({ conditionName:'', symptomKeywords:'', specialty:'General Practice' }); }}
          className="btn-primary">
          <HiOutlinePlus className="text-base" /> {showAdd ? 'Cancel' : 'Add condition'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 px-4 py-3 mb-6 text-sm text-blue-800 flex items-start gap-2">
        <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        <span>Each entry maps a medical condition to symptom keywords and a specialist type. Doctors can also add entries from their Knowledge Base page. The AI uses this as its medical reference for symptom matching and specialist recommendations.</span>
      </div>

      {(showAdd || editId) && (
        <form onSubmit={save} className="card mb-6 border-teal-200">
          <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>
            {editId ? 'Edit condition' : 'Add new condition'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Condition name</label>
              <input type="text" className="input" required value={form.conditionName} onChange={set('conditionName')} placeholder="e.g. Hypertension" />
            </div>
            <div>
              <label className="label">Specialist type</label>
              <select className="input" value={form.specialty} onChange={set('specialty')}>
                {SPECIALTIES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Symptom keywords (comma separated)</label>
              <textarea className="input resize-none h-20" required value={form.symptomKeywords} onChange={set('symptomKeywords')}
                placeholder="headache, dizziness, chest pain, shortness of breath, nosebleed" />
              <p className="text-xs text-slate-400 mt-1">
                {form.symptomKeywords.split(',').filter(s=>s.trim()).length} keywords entered
              </p>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update entry' : 'Add entry'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setEditId(null); setShowAdd(false); }}>Cancel</button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input type="text" className="input pl-9 max-w-xs" placeholder="Search conditions or specialties"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="text-sm text-slate-400">{filtered.length} entries</span>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-slate-100 animate-pulse "/>)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <div key={entry.id} className={`card transition-shadow hover:shadow-md ${editId === entry.id ? 'ring-2 ring-teal-400' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-slate-900">{entry.conditionName}</h3>
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5  font-medium">{entry.specialty}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {entry.symptomKeywords.map(kw => (
                      <span key={kw} className="text-xs bg-slate-100 text-slate-600 border border-slate-200  px-2 py-0.5">{kw}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Updated {new Date(entry.updatedAt).toLocaleDateString()} · {entry.symptomKeywords.length} keywords
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(entry)}
                    className="p-1.5 text-slate-400 hover:text-brand-700 hover:bg-blue-50  transition-colors">
                    <HiOutlinePencil className="text-base" />
                  </button>
                  <button onClick={() => del(entry.id)}
                    className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50  transition-colors">
                    <HiOutlineTrash className="text-base" />
                  </button>
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
