require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱  Seeding database…');

  // ── 1. AI Knowledge Base ─────────────────────────────────
  const conditions = [
    { conditionName: 'Malaria',              symptomKeywords: ['fever','chills','headache','sweating','vomiting','muscle ache','fatigue','shivering'],                            specialty: 'General Practice' },
    { conditionName: 'Typhoid Fever',        symptomKeywords: ['high fever','abdominal pain','weakness','loss of appetite','diarrhea','rash','headache'],                         specialty: 'General Practice' },
    { conditionName: 'Common Cold',          symptomKeywords: ['runny nose','sneezing','sore throat','mild fever','congestion','cough'],                                           specialty: 'General Practice' },
    { conditionName: 'Influenza',            symptomKeywords: ['fever','chills','muscle ache','fatigue','headache','cough','body pain'],                                           specialty: 'General Practice' },
    { conditionName: 'Hypertension',         symptomKeywords: ['headache','dizziness','chest pain','shortness of breath','blurred vision','nosebleed'],                            specialty: 'Cardiology' },
    { conditionName: 'Type 2 Diabetes',      symptomKeywords: ['frequent urination','excessive thirst','fatigue','blurred vision','slow healing','tingling'],                      specialty: 'Endocrinology' },
    { conditionName: 'Asthma',               symptomKeywords: ['wheezing','shortness of breath','chest tightness','coughing','difficulty breathing'],                              specialty: 'Pulmonology' },
    { conditionName: 'Migraine',             symptomKeywords: ['severe headache','nausea','vomiting','light sensitivity','sound sensitivity','aura'],                              specialty: 'Neurology' },
    { conditionName: 'Gastroenteritis',      symptomKeywords: ['nausea','vomiting','diarrhea','stomach pain','cramps','bloating','stomach ache'],                                 specialty: 'Gastroenterology' },
    { conditionName: 'Anxiety Disorder',     symptomKeywords: ['anxiety','panic','racing heart','sweating','trembling','fear','worry','insomnia'],                                specialty: 'Psychiatry' },
    { conditionName: 'Depression',           symptomKeywords: ['sadness','hopelessness','fatigue','insomnia','loss of appetite','concentration issues','worthlessness'],          specialty: 'Psychiatry' },
    { conditionName: 'Urinary Tract Infection', symptomKeywords: ['burning urination','frequent urination','pelvic pain','cloudy urine','blood in urine'],                       specialty: 'Urology' },
    { conditionName: 'Arthritis',            symptomKeywords: ['joint pain','joint stiffness','swelling','reduced range of motion','joint ache'],                                 specialty: 'Rheumatology' },
    { conditionName: 'Pneumonia',            symptomKeywords: ['fever','cough','chest pain','difficulty breathing','chills','phlegm','fatigue'],                                  specialty: 'Pulmonology' },
    { conditionName: 'Skin Allergy',         symptomKeywords: ['rash','itching','hives','redness','swelling','skin irritation'],                                                  specialty: 'Dermatology' },
    { conditionName: 'Back Pain',            symptomKeywords: ['back pain','lower back pain','spine pain','muscle spasm','stiffness','radiating pain'],                           specialty: 'Orthopedics' },
    { conditionName: 'Conjunctivitis',       symptomKeywords: ['red eye','eye discharge','itchy eyes','watery eyes','eye pain','blurred vision'],                                 specialty: 'Ophthalmology' },
    { conditionName: 'Acid Reflux',          symptomKeywords: ['heartburn','chest burning','regurgitation','sour taste','bloating','nausea after eating'],                        specialty: 'Gastroenterology' },
    { conditionName: 'Anaemia',              symptomKeywords: ['fatigue','pale skin','shortness of breath','dizziness','cold hands','chest pain','weakness'],                     specialty: 'General Practice' },
    { conditionName: 'Sickle Cell Crisis',   symptomKeywords: ['severe pain','joint pain','chest pain','fatigue','jaundice','swollen hands','fever'],                             specialty: 'Haematology' },
  ];

  await prisma.aiKnowledgeBase.deleteMany();
  await prisma.aiKnowledgeBase.createMany({ data: conditions });
  console.log(`  ✓ ${conditions.length} knowledge-base entries`);

  // ── 2. Passwords ─────────────────────────────────────────
  const [adminHash, docHash, patHash] = await Promise.all([
    bcrypt.hash('Admin@123',   12),
    bcrypt.hash('Doctor@123',  12),
    bcrypt.hash('Patient@123', 12),
  ]);

  // ── 3. Admin ─────────────────────────────────────────────
  await prisma.user.upsert({
    where:  { email: 'admin@medismart.com' },
    update: {},
    create: { email: 'admin@medismart.com', passwordHash: adminHash, role: 'admin' },
  });
  console.log('  ✓ Admin user');

  // ── 4. Doctors (Ugandan names) ───────────────────────────
  const doctorSeed = [
    { email: 'dr.chen@medismart.com',       name: 'Dr. Nalwanga Sarah',    specialty: 'Cardiology',       bio: 'Board-certified cardiologist with 15 years of experience at Mulago Hospital.',          licenseNumber: 'MD-CARD-001' },
    { email: 'dr.patel@medismart.com',       name: 'Dr. Mugisha Robert',   specialty: 'General Practice', bio: 'Family medicine physician at Kampala Medical Centre, dedicated to holistic care.',     licenseNumber: 'MD-GP-002'   },
    { email: 'dr.johnson@medismart.com',     name: 'Dr. Ochieng James',    specialty: 'Neurology',        bio: 'Neurologist specialising in headache disorders and stroke prevention.',                 licenseNumber: 'MD-NEURO-003'},
    { email: 'dr.kim@medismart.com',         name: 'Dr. Ssemakula Grace',  specialty: 'Dermatology',      bio: 'Dermatologist with expertise in tropical skin conditions and cosmetic treatments.',     licenseNumber: 'MD-DERM-004' },
    { email: 'dr.wilson@medismart.com',      name: 'Dr. Atim Florence',    specialty: 'Psychiatry',       bio: 'Psychiatrist focused on anxiety, depression, and stress-related disorders in Uganda.',  licenseNumber: 'MD-PSYCH-005'},
    { email: 'dr.nguyen@medismart.com',      name: 'Dr. Byaruhanga Peter', specialty: 'Pulmonology',      bio: 'Pulmonologist specialising in asthma, tuberculosis, and respiratory infections.',       licenseNumber: 'MD-PULM-006' },
    { email: 'dr.okafor@medismart.com',      name: 'Dr. Kayiwa Martha',    specialty: 'Orthopedics',      bio: 'Orthopedic surgeon with expertise in sports injuries and joint conditions.',             licenseNumber: 'MD-ORTH-007' },
  ];

  const doctors = {};
  for (const d of doctorSeed) {
    const u = await prisma.user.upsert({
      where:  { email: d.email },
      update: {},
      create: {
        email: d.email, passwordHash: docHash, role: 'doctor',
        doctorProfile: {
          create: {
            name: d.name, specialty: d.specialty, bio: d.bio, licenseNumber: d.licenseNumber,
            availability: {
              create: [1,2,3,4,5].map(day => ({ dayOfWeek: day, startTime: '08:00', endTime: '17:00' })),
            },
          },
        },
      },
    });
    doctors[d.email] = u.id;
  }
  console.log(`  ✓ ${doctorSeed.length} doctors`);

  // ── 5. Patients (Ugandan names) ──────────────────────────
  const patientSeed = [
    { email: 'patient@medismart.com',       name: 'Mukasa John',       gender: 'male',   phone: '+256-772-100001', dob: '1990-03-15', allergies: ['penicillin'],       conditions: ['hypertension'] },
    { email: 'nakato.sarah@gmail.com',       name: 'Nakato Sarah',      gender: 'female', phone: '+256-701-200002', dob: '1985-07-22', allergies: [],                  conditions: ['migraine'] },
    { email: 'tumwine.michael@gmail.com',    name: 'Tumwine Michael',   gender: 'male',   phone: '+256-782-300003', dob: '1978-11-05', allergies: ['sulfa'],           conditions: ['type 2 diabetes','hypertension'] },
    { email: 'auma.emma@gmail.com',          name: 'Auma Emma',         gender: 'female', phone: '+256-756-400004', dob: '1995-02-28', allergies: [],                  conditions: [] },
    { email: 'ssali.james@gmail.com',        name: 'Ssali James',       gender: 'male',   phone: '+256-777-500005', dob: '1972-09-14', allergies: ['aspirin'],         conditions: ['arthritis','back pain'] },
    { email: 'kyeyune.lisa@gmail.com',       name: 'Kyeyune Lisa',      gender: 'female', phone: '+256-703-600006', dob: '1988-06-30', allergies: ['latex'],           conditions: ['asthma'] },
    { email: 'ochieng.robert@gmail.com',     name: 'Ochieng Robert',    gender: 'male',   phone: '+256-785-700007', dob: '1965-12-03', allergies: [],                  conditions: ['hypertension','acid reflux'] },
    { email: 'nantongo.jennifer@gmail.com',  name: 'Nantongo Jennifer', gender: 'female', phone: '+256-759-800008', dob: '1993-04-18', allergies: ['pollen'],          conditions: ['anxiety disorder'] },
    { email: 'kiggundu.david@gmail.com',     name: 'Kiggundu David',    gender: 'male',   phone: '+256-774-900009', dob: '1980-08-25', allergies: [],                  conditions: ['insomnia'] },
    { email: 'namukasa.olivia@gmail.com',    name: 'Namukasa Olivia',   gender: 'female', phone: '+256-700-100010', dob: '1998-01-10', allergies: ['ibuprofen'],       conditions: ['skin allergy'] },
  ];

  const patients = {};
  for (const p of patientSeed) {
    const u = await prisma.user.upsert({
      where:  { email: p.email },
      update: {},
      create: {
        email: p.email, passwordHash: patHash, role: 'patient',
        patientProfile: {
          create: {
            name: p.name, gender: p.gender, phone: p.phone,
            dob: new Date(p.dob),
            medicalHistory: { allergies: p.allergies, conditions: p.conditions },
          },
        },
      },
    });
    patients[p.email] = u.id;
  }
  console.log(`  ✓ ${patientSeed.length} patients`);

  // ── 6. Appointments + Sessions + Notes ───────────────────
  const existingAppts = await prisma.appointment.count();
  if (existingAppts > 0) {
    console.log(`  ↩  Appointments already seeded (${existingAppts} found) — skipping`);
    console.log('\n✅  Seed complete.');
    return;
  }

  async function makeAppointment({ patEmail, docEmail, daysOffset, hour = 10, status, sessionSymptoms, noteData }) {
    const patId = patients[patEmail];
    const docId = doctors[docEmail];
    if (!patId || !docId) return;

    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + daysOffset);
    scheduledAt.setHours(hour, 0, 0, 0);

    let sessionId = null;
    if (sessionSymptoms) {
      const urgencyMap = { completed: 'routine', confirmed: 'soon', pending: 'soon', cancelled: 'routine' };
      const session = await prisma.symptomSession.create({
        data: {
          patientId: patId,
          symptoms:  sessionSymptoms,
          aiResult:  {
            conditions: [{ condition: sessionSymptoms[0] || 'General illness', confidence: 72, specialty: 'General Practice', matchedSymptoms: sessionSymptoms.slice(0, 2) }],
            recommendedSpecialty: 'General Practice',
            urgency:  urgencyMap[status] || 'routine',
            summary:  'Based on reported symptoms, an in-person consultation is recommended.',
            disclaimer: 'AI-generated assessment — not a medical diagnosis.',
            engine:   'MediSmart AI (Keyword Matching)',
          },
        },
      });
      sessionId = session.id;
    }

    const appt = await prisma.appointment.create({
      data: { patientId: patId, doctorId: docId, scheduledAt, status, sessionId },
    });

    if (noteData && status === 'completed') {
      await prisma.consultationNote.create({
        data: { appointmentId: appt.id, doctorId: docId, notes: noteData.notes, diagnosis: noteData.diagnosis, treatment: noteData.treatment },
      });
    }
    return appt;
  }

  // Past completed (with notes)
  await makeAppointment({ patEmail: 'patient@medismart.com',      docEmail: 'dr.chen@medismart.com',     daysOffset: -45, hour: 9,  status: 'completed', sessionSymptoms: ['chest pain','shortness of breath','dizziness'],              noteData: { notes: 'Patient presents with intermittent chest tightness for 2 weeks. BP 148/92. EKG normal.', diagnosis: 'Hypertension Stage 1', treatment: 'Prescribed amlodipine 5mg daily. Low-sodium diet. Review in 6 weeks.' } });
  await makeAppointment({ patEmail: 'patient@medismart.com',      docEmail: 'dr.patel@medismart.com',    daysOffset: -20, hour: 11, status: 'completed', sessionSymptoms: ['cough','fever','fatigue'],                                    noteData: { notes: '5-day history of productive cough and low-grade fever. Lungs clear.', diagnosis: 'Acute upper respiratory infection', treatment: 'Rest, fluids, paracetamol PRN. Return if fever persists >3 days.' } });
  await makeAppointment({ patEmail: 'nakato.sarah@gmail.com',     docEmail: 'dr.johnson@medismart.com',  daysOffset: -30, hour: 14, status: 'completed', sessionSymptoms: ['severe headache','nausea','light sensitivity'],               noteData: { notes: '3 migraines per month, each 8–12 hours. Aura present. No neurological deficits.', diagnosis: 'Migraine with aura', treatment: 'Sumatriptan 50mg for acute attacks. Propranolol 40mg daily for prevention.' } });
  await makeAppointment({ patEmail: 'tumwine.michael@gmail.com',  docEmail: 'dr.patel@medismart.com',    daysOffset: -60, hour: 10, status: 'completed', sessionSymptoms: ['frequent urination','excessive thirst','fatigue'],            noteData: { notes: 'Routine diabetes review. HbA1c 7.4%. Patient admits dietary non-compliance.', diagnosis: 'Type 2 Diabetes — suboptimal control', treatment: 'Increased metformin to 1000mg BD. Dietitian referral. Retest HbA1c in 3 months.' } });
  await makeAppointment({ patEmail: 'auma.emma@gmail.com',        docEmail: 'dr.kim@medismart.com',      daysOffset: -10, hour: 15, status: 'completed', sessionSymptoms: ['rash','itching','redness'],                                   noteData: { notes: 'Erythematous pruritic rash on forearms. Onset 5 days ago after new detergent.', diagnosis: 'Contact dermatitis', treatment: 'Hydrocortisone 1% cream BD × 2 weeks. Cetirizine 10mg nocte. Fragrance-free products.' } });
  await makeAppointment({ patEmail: 'ssali.james@gmail.com',      docEmail: 'dr.okafor@medismart.com',   daysOffset: -35, hour: 9,  status: 'completed', sessionSymptoms: ['back pain','lower back pain','muscle spasm'],                 noteData: { notes: 'Chronic lower back pain 8 months, worse with sitting. No radicular symptoms. SLR negative.', diagnosis: 'Lumbar muscle strain', treatment: 'Physiotherapy × 8 sessions. Naproxen 500mg BD × 2 weeks. Core strengthening exercises.' } });
  await makeAppointment({ patEmail: 'kyeyune.lisa@gmail.com',     docEmail: 'dr.nguyen@medismart.com',   daysOffset: -50, hour: 11, status: 'completed', sessionSymptoms: ['wheezing','shortness of breath','chest tightness'],          noteData: { notes: 'Known asthmatic, worsening over 2 weeks triggered by dust. PEFR 68% predicted.', diagnosis: 'Asthma — moderate exacerbation', treatment: 'Salbutamol inhaler QID. Beclomethasone 200mcg BD. Written action plan. Review 4 weeks.' } });
  await makeAppointment({ patEmail: 'nantongo.jennifer@gmail.com',docEmail: 'dr.wilson@medismart.com',   daysOffset: -15, hour: 13, status: 'completed', sessionSymptoms: ['anxiety','panic','racing heart','insomnia'],                 noteData: { notes: 'Escalating anxiety, 2 panic attacks in past month. Sleep onset latency >1 hour.', diagnosis: 'Generalised Anxiety Disorder', treatment: 'Sertraline 50mg daily. CBT referral. Sleep hygiene counselling. Review in 4 weeks.' } });
  await makeAppointment({ patEmail: 'ochieng.robert@gmail.com',   docEmail: 'dr.chen@medismart.com',     daysOffset: -70, hour: 10, status: 'completed', sessionSymptoms: ['headache','dizziness','chest pain'],                         noteData: { notes: 'Hypertensive follow-up. BP 138/86 (improved). Medication compliance confirmed.', diagnosis: 'Hypertension — improving control', treatment: 'Continue amlodipine 5mg. Annual lipid panel. Next review 3 months.' } });
  await makeAppointment({ patEmail: 'kiggundu.david@gmail.com',   docEmail: 'dr.wilson@medismart.com',   daysOffset: -25, hour: 16, status: 'completed', sessionSymptoms: ['insomnia','fatigue','irritability'],                         noteData: { notes: 'Sleep difficulties 4 months. Takes 2+ hours to sleep. No depression.', diagnosis: 'Chronic insomnia disorder', treatment: 'Sleep restriction therapy. Melatonin 2mg 1h before bed. Avoid screens. CBT-i referral.' } });

  // Upcoming confirmed
  await makeAppointment({ patEmail: 'patient@medismart.com',      docEmail: 'dr.patel@medismart.com',    daysOffset: 7,  hour: 9,  status: 'confirmed', sessionSymptoms: ['fever','headache','fatigue'] });
  await makeAppointment({ patEmail: 'nakato.sarah@gmail.com',     docEmail: 'dr.kim@medismart.com',      daysOffset: 5,  hour: 14, status: 'confirmed' });
  await makeAppointment({ patEmail: 'tumwine.michael@gmail.com',  docEmail: 'dr.patel@medismart.com',    daysOffset: 12, hour: 10, status: 'confirmed', sessionSymptoms: ['frequent urination','fatigue','blurred vision'] });
  await makeAppointment({ patEmail: 'ssali.james@gmail.com',      docEmail: 'dr.okafor@medismart.com',   daysOffset: 9,  hour: 11, status: 'confirmed', sessionSymptoms: ['joint pain','joint stiffness','swelling'] });
  await makeAppointment({ patEmail: 'kyeyune.lisa@gmail.com',     docEmail: 'dr.nguyen@medismart.com',   daysOffset: 14, hour: 9,  status: 'confirmed' });
  await makeAppointment({ patEmail: 'namukasa.olivia@gmail.com',  docEmail: 'dr.kim@medismart.com',      daysOffset: 6,  hour: 15, status: 'confirmed', sessionSymptoms: ['rash','itchy skin','redness'] });
  await makeAppointment({ patEmail: 'ochieng.robert@gmail.com',   docEmail: 'dr.chen@medismart.com',     daysOffset: 21, hour: 10, status: 'confirmed' });

  // Pending
  await makeAppointment({ patEmail: 'patient@medismart.com',      docEmail: 'dr.wilson@medismart.com',   daysOffset: 18, hour: 13, status: 'pending', sessionSymptoms: ['anxiety','insomnia','worry'] });
  await makeAppointment({ patEmail: 'auma.emma@gmail.com',        docEmail: 'dr.patel@medismart.com',    daysOffset: 10, hour: 10, status: 'pending', sessionSymptoms: ['nausea','stomach ache','bloating'] });
  await makeAppointment({ patEmail: 'nantongo.jennifer@gmail.com',docEmail: 'dr.wilson@medismart.com',   daysOffset: 15, hour: 14, status: 'pending' });
  await makeAppointment({ patEmail: 'kiggundu.david@gmail.com',   docEmail: 'dr.patel@medismart.com',    daysOffset: 20, hour: 9,  status: 'pending', sessionSymptoms: ['fatigue','headache','blurred vision'] });
  await makeAppointment({ patEmail: 'namukasa.olivia@gmail.com',  docEmail: 'dr.johnson@medismart.com',  daysOffset: 11, hour: 11, status: 'pending', sessionSymptoms: ['severe headache','nausea','light sensitivity'] });

  // Cancelled
  await makeAppointment({ patEmail: 'tumwine.michael@gmail.com',  docEmail: 'dr.chen@medismart.com',     daysOffset: -5, hour: 9,  status: 'cancelled' });
  await makeAppointment({ patEmail: 'auma.emma@gmail.com',        docEmail: 'dr.johnson@medismart.com',  daysOffset: 3,  hour: 15, status: 'cancelled' });

  const apptCount = await prisma.appointment.count();
  console.log(`  ✓ ${apptCount} appointments (with sessions and notes)`);

  console.log('\n✅  Seed complete!');
  console.log('\n  Demo credentials:');
  console.log('    Patient  — patient@medismart.com   / Patient@123');
  console.log('    Doctor   — dr.chen@medismart.com   / Doctor@123');
  console.log('    Admin    — admin@medismart.com      / Admin@123');
}

// ─── run directly ─────────────────────────────────────────
if (require.main === module) {
  seed()
    .catch(err => { console.error(err); process.exit(1); })
    .finally(() => prisma.$disconnect());
}

module.exports = { seed };
