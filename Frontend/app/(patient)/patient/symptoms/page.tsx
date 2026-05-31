'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface AiCondition {
  condition: string;
  specialty: string;
  confidence: number;
  matchedSymptoms: string[];
  description?: string;
}

interface AiResult {
  conditions: AiCondition[];
  recommendedSpecialty: string;
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  summary?: string;
  disclaimer: string;
  engine?: string;
}

interface Session { id: string; aiResult: AiResult; }

type Step = 'input' | 'loading' | 'results';

const COMMON_SYMPTOMS = [
  'fever','headache','cough','fatigue','nausea','chest pain',
  'shortness of breath','dizziness','joint pain','back pain',
  'sore throat','stomach ache','anxiety','insomnia','rash',
  'vomiting','blurred vision','frequent urination','muscle ache',
];

const URGENCY_CONFIG = {
  routine:   { label: 'Routine — book at your convenience',           bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  dot: 'bg-green-500',  icon: '🟢' },
  soon:      { label: 'See a doctor within a few days',               bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  dot: 'bg-amber-500',  icon: '🟡' },
  urgent:    { label: 'See a doctor today',                           bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', dot: 'bg-orange-500', icon: '🟠' },
  emergency: { label: 'Call 911 or go to the emergency room now',     bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    dot: 'bg-red-500',    icon: '🚨' },
};

function confidenceClass(c: number) {
  if (c >= 65) return { wrap: 'border-red-200 bg-red-50',    bar: 'bg-red-500',    text: 'text-red-700' };
  if (c >= 35) return { wrap: 'border-amber-200 bg-amber-50', bar: 'bg-amber-500', text: 'text-amber-700' };
  return             { wrap: 'border-blue-200 bg-blue-50',   bar: 'bg-blue-500',   text: 'text-blue-700' };
}

const STEPS = ['Select symptoms', 'AI analysis', 'Book specialist'];

export default function SymptomsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');

  function toggleSymptom(s: string) {
    setSelected(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  }

  async function analyse() {
    const symptoms = [...selected, ...(text.trim() ? [text.trim()] : [])];
    if (!symptoms.length) { setError('Please select or describe at least one symptom.'); return; }
    setError(''); setStep('loading');
    try {
      const res = await api.patients.submitSymptoms({ symptoms }) as { session: Session; aiResult: AiResult };
      setSession({ id: res.session.id, aiResult: res.aiResult });
      setStep('results');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('input');
    }
  }

  /* ── Loading ─────────────────────────────── */
  if (step === 'loading') return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="relative mb-6">
        <div className="h-20 w-20 border-4 border-teal-100 border-t-teal-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">🧠</div>
      </div>
      <h2 className="text-xl font-bold text-brand-900 mb-1" style={{ fontFamily: 'Outfit,sans-serif' }}>MediSmart AI is analysing…</h2>
      <p className="text-slate-400 text-sm">Evaluating symptoms against medical knowledge</p>
    </div>
  );

  /* ── Results ─────────────────────────────── */
  if (step === 'results' && session) {
    const { conditions, recommendedSpecialty, urgency, summary, disclaimer, engine } = session.aiResult;
    const urg = URGENCY_CONFIG[urgency] ?? URGENCY_CONFIG.routine;
    return (
      <div className="p-8 max-w-6xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-6 w-6 flex items-center justify-center text-xs font-bold ${i <= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{i + 1}</div>
              <span className={`text-xs font-medium ${i <= 1 ? 'text-teal-700' : 'text-slate-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < 1 ? 'bg-teal-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>MediSmart AI Results</h1>
            <p className="text-slate-400 text-xs mt-0.5">{engine ?? 'MediSmart AI'}</p>
          </div>
          <button onClick={() => { setStep('input'); setSelected([]); setText(''); setSession(null); }}
            className="btn-secondary text-sm">New analysis</button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {/* Urgency */}
            <div className={`border px-5 py-4 ${urg.bg} ${urg.border}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{urg.icon}</span>
                <div>
                  <p className={`font-bold text-sm ${urg.text}`}>{urg.label}</p>
                  {summary && <p className={`text-sm mt-1 ${urg.text} opacity-80`}>{summary}</p>}
                </div>
              </div>
            </div>

            {/* Recommended specialty */}
            <div className="card border-l-4 border-teal-500">
              <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Recommended specialist</p>
              <p className="text-xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>{recommendedSpecialty}</p>
            </div>

            {/* Conditions */}
            <div className="card">
              <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Possible conditions</h2>
              {conditions.length === 0 ? (
                <p className="text-slate-400 text-sm">No specific conditions identified. We recommend seeing a General Practitioner for evaluation.</p>
              ) : (
                <div className="space-y-3">
                  {conditions.map((c, i) => {
                    const cls = confidenceClass(c.confidence);
                    return (
                      <div key={i} className={`border p-4 ${cls.wrap}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className={`font-bold text-sm ${cls.text}`}>{c.condition}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{c.specialty}</p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`text-sm font-bold ${cls.text}`}>{c.confidence}%</span>
                            <div className="h-1.5 w-20 bg-slate-200 mt-1 overflow-hidden">
                              <div className={`h-full ${cls.bar}`} style={{ width: `${c.confidence}%` }} />
                            </div>
                          </div>
                        </div>
                        {c.description && <p className="text-xs text-slate-600 mb-2">{c.description}</p>}
                        {c.matchedSymptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {c.matchedSymptoms.map(s => (
                              <span key={s} className="text-xs bg-white/70 border border-slate-200 px-2 py-0.5 text-slate-600">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 italic">{disclaimer}</p>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {urgency === 'emergency' && (
              <div className="bg-red-50 border-2 border-red-300 p-4">
                <p className="text-red-800 font-bold text-sm mb-1">⚠️ Emergency signs detected</p>
                <p className="text-red-700 text-xs leading-relaxed">Call 911 or go to your nearest emergency room immediately. Do not wait for an appointment.</p>
              </div>
            )}
            <div className="-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
              <h3 className="font-bold mb-1" style={{ fontFamily: 'Outfit,sans-serif' }}>Book a {recommendedSpecialty} specialist</h3>
              <p className="text-teal-100 text-xs mb-4 leading-relaxed">
                Your AI assessment will be attached so your doctor can prepare before the consultation.
              </p>
              <button onClick={() => router.push(`/patient/appointments?specialty=${encodeURIComponent(recommendedSpecialty)}&sessionId=${session.id}`)}
                className="block w-full text-center bg-white text-teal-700 font-bold px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors">
                Book appointment →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Input ───────────────────────────────── */
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-6 w-6 flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{i + 1}</div>
            <span className={`text-xs font-medium ${i === 0 ? 'text-teal-700' : 'text-slate-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>Symptom Analysis</h1>
        <p className="text-slate-500 text-sm mt-1">
          💡 Describe your symptoms below — MediSmart AI will analyse them and recommend which specialist to see.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          <div className="card">
            <h2 className="font-bold text-brand-900 mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Common symptoms</h2>
            <p className="text-xs text-slate-400 mb-3">Click to select any that apply to you:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map(s => (
                <button key={s} onClick={() => toggleSymptom(s)}
                  className={`px-3 py-1.5 text-sm border font-medium transition-all duration-150 ${
                    selected.includes(s)
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            {selected.length > 0 && (
              <p className="text-xs text-teal-600 font-semibold mt-3">{selected.length} symptom{selected.length > 1 ? 's' : ''} selected</p>
            )}
          </div>

          <div className="card">
            <h2 className="font-bold text-brand-900 mb-2" style={{ fontFamily: 'Outfit,sans-serif' }}>Describe in your own words</h2>
            <p className="text-xs text-slate-400 mb-3">Add any details not covered above:</p>
            <textarea className="input resize-none h-28"
              placeholder="E.g. I've had a splitting headache for two days with nausea and sensitivity to light…"
              value={text} onChange={e => setText(e.target.value)} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>
          )}

          <button onClick={analyse} className="btn-primary px-8 py-3 text-base gap-2">
            <span>🧠</span> Analyse with MediSmart AI
          </button>
        </div>

        {/* Info sidebar */}
        <div className="card self-start">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🧠</span>
            <h3 className="font-bold text-brand-900" style={{ fontFamily: 'Outfit,sans-serif' }}>MediSmart AI</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Powered by Gemini 2.5 — analyses your symptoms against a medical knowledge base and returns ranked possible conditions with specialist recommendations.
          </p>
          <ol className="space-y-3">
            {[
              'Select or describe your symptoms',
              'MediSmart AI evaluates them',
              'Get ranked conditions with confidence scores',
              'See urgency level & specialist recommendation',
              'Book directly using the AI assessment',
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="h-5 w-5 bg-teal-100 text-teal-700 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                <span className="text-xs text-slate-600">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
