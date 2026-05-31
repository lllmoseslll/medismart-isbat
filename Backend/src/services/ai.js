const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../prisma');

const VALID_SPECIALTIES = [
  'General Practice', 'Cardiology', 'Neurology', 'Dermatology',
  'Psychiatry', 'Orthopedics', 'Gastroenterology', 'Pulmonology',
  'Endocrinology', 'Urology', 'Rheumatology', 'Ophthalmology',
  'Emergency Medicine',
];

const SYSTEM_PROMPT = `You are MediSmart AI, an advanced medical symptom analysis assistant built into the MediSmart healthcare platform. Analyze the patient's reported symptoms and respond ONLY with valid JSON — no markdown, no explanation, just the JSON object.

Required format:
{
  "conditions": [
    {
      "condition": "Condition Name",
      "specialty": "Specialty Name",
      "confidence": 72,
      "matchedSymptoms": ["symptom a", "symptom b"],
      "description": "One sentence describing why this condition fits."
    }
  ],
  "recommendedSpecialty": "Primary Specialty",
  "urgency": "routine",
  "summary": "2-3 sentence plain-English summary for the patient.",
  "disclaimer": "This AI analysis is for informational purposes only and is not a substitute for professional medical advice. Always consult a qualified healthcare provider."
}

Rules:
- Return 1-5 conditions ranked by confidence (highest first).
- confidence is an integer 0-100. Only use 80+ when symptoms are highly specific.
- urgency must be exactly one of: routine | soon | urgent | emergency
  - routine: book an appointment in the coming weeks
  - soon: see a doctor within a few days
  - urgent: see a doctor today
  - emergency: call emergency services or go to ER immediately
- specialty must be one of: ${VALID_SPECIALTIES.join(', ')}
- matchedSymptoms lists which patient-reported symptoms are relevant to that condition.
- Do NOT diagnose definitively. Use language like "may indicate", "consistent with", "possible".
- Output ONLY the JSON object — no markdown fences, no extra text.`;

async function analyzeSymptoms(symptomsInput) {
  const symptomsText = Array.isArray(symptomsInput)
    ? symptomsInput.join(', ')
    : String(symptomsInput);

  if (!process.env.GEMINI_API_KEY) {
    console.warn('[MediSmart AI] No GEMINI_API_KEY — using fallback analysis');
    return fallbackAnalysis(symptomsText);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(
      `${SYSTEM_PROMPT}\n\nPatient symptoms: ${symptomsText}`
    );

    const raw = result.response.text().trim();
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found in Gemini response');
      parsed = JSON.parse(match[0]);
    }

    // Normalise fields so downstream code is safe
    if (!Array.isArray(parsed.conditions)) parsed.conditions = [];
    if (!parsed.recommendedSpecialty) {
      parsed.recommendedSpecialty = parsed.conditions[0]?.specialty || 'General Practice';
    }
    if (!parsed.urgency) parsed.urgency = 'routine';
    if (!parsed.disclaimer) {
      parsed.disclaimer = 'This AI analysis is for informational purposes only and is not a substitute for professional medical advice.';
    }

    return {
      ...parsed,
      analysisDate: new Date().toISOString(),
      engine: 'MediSmart AI',
    };
  } catch (err) {
    console.error('[MediSmart AI] Gemini error:', err.message);
    return fallbackAnalysis(symptomsText);
  }
}

async function fallbackAnalysis(text) {
  const lower = text.toLowerCase();
  let knowledgeBase = [];
  try {
    knowledgeBase = await prisma.aiKnowledgeBase.findMany();
  } catch { /* DB not available */ }

  const scored = knowledgeBase
    .map(entry => {
      const matched = entry.symptomKeywords.filter(kw => lower.includes(kw.toLowerCase()));
      return {
        condition: entry.conditionName,
        specialty: entry.specialty,
        confidence: matched.length === 0
          ? 0
          : Math.round((matched.length / entry.symptomKeywords.length) * 100),
        matchedSymptoms: matched,
        description: `Possible ${entry.conditionName} based on reported symptoms.`,
      };
    })
    .filter(r => r.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  return {
    conditions: scored,
    recommendedSpecialty: scored[0]?.specialty || 'General Practice',
    urgency: 'routine',
    summary: 'Based on your symptoms, we recommend consulting a healthcare provider for a thorough evaluation.',
    disclaimer: 'This AI analysis is for informational purposes only and is not a substitute for professional medical advice.',
    analysisDate: new Date().toISOString(),
    engine: 'MediSmart AI (offline mode)',
  };
}

module.exports = { analyzeSymptoms };
