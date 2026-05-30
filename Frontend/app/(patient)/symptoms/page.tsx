'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface AiCondition {
  condition: string;
  specialty: string;
  confidence: number;
  matchedSymptoms: string[];
}

interface AiResult {
  conditions: AiCondition[];
  recommendedSpecialty: string;
  disclaimer: string;
}

interface Session {
  id: string;
  aiResult: AiResult;
}

type Step = 'input' | 'loading' | 'results';

const COMMON_SYMPTOMS = [
  'fever', 'headache', 'cough', 'fatigue', 'nausea', 'chest pain',
  'shortness of breath', 'dizziness', 'joint pain', 'back pain',
  'sore throat', 'stomach ache', 'anxiety', 'insomnia',
];

export default function SymptomsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');

  function toggleSymptom(s: string) {
    setSelected(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  async function analyse() {
    const symptoms = [...selected, ...(text.trim() ? [text.trim()] : [])];
    if (symptoms.length === 0) {
      setError('Please describe at least one symptom.');
      return;
    }
    setError('');
    setStep('loading');

    try {
      const res = await api.patients.submitSymptoms({ symptoms }) as { session: Session; aiResult: AiResult };
      setSession({ id: res.session.id, aiResult: res.aiResult });
      setStep('results');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('input');
    }
  }

  function confidenceColor(c: number) {
    if (c >= 60) return 'text-red-600 bg-red-50 border-red-200';
    if (c >= 30) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  }

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-16 w-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Analysing your symptoms…</p>
        <p className="text-slate-400 text-sm mt-1">Checking against our medical knowledge base</p>
      </div>
    );
  }

  if (step === 'results' && session) {
    const { conditions, recommendedSpecialty, disclaimer } = session.aiResult;
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Analysis Results</h1>
          <p className="text-slate-500 mt-1">Based on your reported symptoms</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="card border-l-4 border-brand-500">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">Recommended specialist</p>
              <p className="text-xl font-bold text-slate-900">{recommendedSpecialty}</p>
            </div>

            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4">Possible conditions</h2>
              {conditions.length === 0 ? (
                <p className="text-slate-500 text-sm">No specific conditions matched. We recommend seeing a General Practitioner.</p>
              ) : (
                <div className="space-y-3">
                  {conditions.map((c, i) => (
                    <div key={i} className={`border rounded-xl p-4 ${confidenceColor(c.confidence)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{c.condition}</p>
                        <span className="text-xs font-bold">{c.confidence}% match</span>
                      </div>
                      <p className="text-xs opacity-75">Specialty: {c.specialty}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.matchedSymptoms.map(s => (
                          <span key={s} className="text-xs bg-white/60 rounded-full px-2 py-0.5 border">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 italic">{disclaimer}</p>
          </div>

          <div className="space-y-4">
            <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
              <h3 className="font-semibold mb-2">Book with a {recommendedSpecialty} specialist</h3>
              <p className="text-brand-100 text-sm mb-4">
                Use this analysis when booking so your doctor can prepare.
              </p>
              <button
                onClick={() => router.push(`/patient/appointments?specialty=${encodeURIComponent(recommendedSpecialty)}&sessionId=${session.id}`)}
                className="block w-full text-center bg-white text-brand-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-brand-50 transition-colors"
              >
                Book appointment
              </button>
            </div>

            <button
              onClick={() => { setStep('input'); setSelected([]); setText(''); setSession(null); }}
              className="btn-secondary w-full"
            >
              Start new analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Symptom Analysis</h1>
        <p className="text-slate-500 mt-1">Describe your symptoms and our AI will suggest possible conditions.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4">Select common symptoms</h2>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selected.includes(s)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-3">Describe in your own words</h2>
            <textarea
              className="input resize-none h-28"
              placeholder="E.g. I've had a splitting headache for two days with nausea and light sensitivity…"
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button onClick={analyse} className="btn-primary px-8 py-3 text-base">
            Analyse symptoms
          </button>
        </div>

        <div className="card self-start">
          <h3 className="font-semibold text-slate-900 mb-3">How it works</h3>
          <ol className="space-y-3 text-sm text-slate-600">
            {[
              'Select or describe your symptoms',
              'Our AI matches them against our medical knowledge base',
              'You receive a ranked list of possible conditions',
              'We recommend the right specialist for you',
              'Book directly from the results page',
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="h-5 w-5 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
