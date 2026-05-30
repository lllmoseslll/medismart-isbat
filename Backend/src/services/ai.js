const prisma = require('../prisma');

async function analyzeSymptoms(symptomsInput) {
  const text = Array.isArray(symptomsInput)
    ? symptomsInput.join(' ').toLowerCase()
    : String(symptomsInput).toLowerCase();

  const knowledgeBase = await prisma.aiKnowledgeBase.findMany();

  const scored = knowledgeBase
    .map(entry => {
      const matched = entry.symptomKeywords.filter(kw =>
        text.includes(kw.toLowerCase())
      );
      return {
        condition: entry.conditionName,
        specialty: entry.specialty,
        confidence: matched.length === 0
          ? 0
          : Math.round((matched.length / entry.symptomKeywords.length) * 100),
        matchedSymptoms: matched,
      };
    })
    .filter(r => r.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  const recommendedSpecialty =
    scored.length > 0 ? scored[0].specialty : 'General Practice';

  return {
    conditions: scored,
    recommendedSpecialty,
    analysisDate: new Date().toISOString(),
    disclaimer: 'This AI analysis is for informational purposes only and is not a substitute for professional medical advice.',
  };
}

module.exports = { analyzeSymptoms };
