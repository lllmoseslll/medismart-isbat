'use client';
import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

interface KbEntry { id: string; conditionName: string; symptomKeywords: string[]; specialty: string; updatedAt: string; }

const SPECIALTIES = ['General Practice','Cardiology','Neurology','Dermatology','Psychiatry','Orthopedics','Gastroenterology','Pulmonology','Endocrinology','Urology','Rheumatology','Ophthalmology'];

export default function AiSettingsPage() {
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
    return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function startEdit(entry: KbEntry) {
    setEditId(entry.id); setShowAdd(false); setError('');
    setForm({ conditionName: entry.conditionName, symptomKeywords: entry.symptomKeywords.join(', '), specialty: entry.specialty });
  }

  async function saveEntry(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    const payload = { conditionName: form.conditionName, symptomKeywords: form.symptomKeywords.split(',').map(s=>s.trim()).filter(Boolean), specialty: form.specialty };
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

  async function deleteEntry(id: string) {
    if (!confirm('Delete this knowledge base entry?')) return;
    await api.admin.deleteKbEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  const filtered = entries.filter(e => e.conditionName.toLowerCase().includes(search.toLowerCase()) || e.specialty.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>AI Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-0.5">Medical conditions, symptoms, and specialist mappings used by MediSmart AI.</p>
        </div>
        <button onClick={() => { setShowAdd(v=>!v); setEditId(null); setForm({ conditionName:'', symptomKeywords:'', specialty:'General Practice' }); }}
          className="btn-primary">
          {showAdd ? 'Cancel' : '+ Add condition'}
        </button>
      </div>

      {/* Guidance */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
        <span className="mt-0.5">💡</span>
        <span>Edit the medical knowledge base used by MediSmart AI's <strong>fallback mode</strong>. Each entry maps a condition to symptom keywords and a specialist type. The primary AI (Gemini 2.5) uses this as supplementary context.</span>
      </div>

      {(showAdd || editId) && (
        <form onSubmit={saveEntry} className="card mb-6">
          <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>
            {editId ? 'Edit condition' : 'Add new condition'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Condition name</label>
              <input type="text" className="input" required value={form.conditionName} onChange={set('conditionName')} placeholder="e.g. Hypertension" />
            </div>
            <div>
              <label className="label">Specialist</label>
              <select className="input" value={form.specialty} onChange={set('specialty')}>
                {SPECIALTIES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Symptom keywords (comma-separated)</label>
              <textarea className="input resize-none h-20" required value={form.symptomKeywords} onChange={set('symptomKeywords')}
                placeholder="headache, dizziness, chest pain, shortness of breath, nosebleed" />
              <p className="text-xs text-slate-400 mt-1">
                {form.symptomKeywords.split(',').filter(s=>s.trim()).length} keywords
              </p>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : (editId ? 'Update entry' : 'Add entry')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setEditId(null); setShowAdd(false); }}>Cancel</button>
          </div>
        </form>
      )}

      <div className="mb-4">
        <input type="text" className="input max-w-xs" placeholder="Search conditions or specialties…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <span className="ml-3 text-sm text-slate-400">{filtered.length} entries</span>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse"/>)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <div key={entry.id} className={`card transition-all ${editId === entry.id ? 'ring-2 ring-teal-400' : 'hover:shadow-md'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-2">
                    <h3 className="font-bold text-slate-900" style={{ fontFamily: 'Outfit,sans-serif' }}>{entry.conditionName}</h3>
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2.5 py-0.5 font-medium">{entry.specialty}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.symptomKeywords.map(kw => (
                      <span key={kw} className="text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-md px-2 py-0.5">{kw}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Updated {new Date(entry.updatedAt).toLocaleDateString()} · {entry.symptomKeywords.length} keywords
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(entry)} className="btn-secondary text-xs px-3 py-1.5">Edit</button>
                  <button onClick={() => deleteEntry(entry.id)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
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
