require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── helpers ──────────────────────────────────────────────
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 0, 0, 0);
  return d;
}
function hoursFromNow(h) {
  return new Date(Date.now() + h * 3600 * 1000);
}

// ─── seed ─────────────────────────────────────────────────
async function seed() {
  console.log('🌱  Seeding database…');

  // ── 1. AI Knowledge Base ─────────────────────────────────
  const conditions = [
    { conditionName: 'Common Cold',           symptomKeywords: ['runny nose','sneezing','sore throat','mild fever','congestion','cough'],                                         specialty: 'General Practice' },
    { conditionName: 'Influenza',             symptomKeywords: ['fever','chills','muscle ache','fatigue','headache','cough','body pain'],                                         specialty: 'General Practice' },
    { conditionName: 'Hypertension',          symptomKeywords: ['headache','dizziness','chest pain','shortness of breath','blurred vision','nosebleed'],                          specialty: 'Cardiology' },
    { conditionName: 'Type 2 Diabetes',       symptomKeywords: ['frequent urination','excessive thirst','fatigue','blurred vision','slow healing','tingling'],                    specialty: 'Endocrinology' },
    { conditionName: 'Asthma',                symptomKeywords: ['wheezing','shortness of breath','chest tightness','coughing','difficulty breathing'],                            specialty: 'Pulmonology' },
    { conditionName: 'Migraine',              symptomKeywords: ['severe headache','nausea','vomiting','light sensitivity','sound sensitivity','aura'],                            specialty: 'Neurology' },
    { conditionName: 'Gastroenteritis',       symptomKeywords: ['nausea','vomiting','diarrhea','stomach pain','cramps','bloating','stomach ache'],                               specialty: 'Gastroenterology' },
    { conditionName: 'Anxiety Disorder',      symptomKeywords: ['anxiety','panic','racing heart','sweating','trembling','fear','worry','insomnia'],                              specialty: 'Psychiatry' },
    { conditionName: 'Depression',            symptomKeywords: ['sadness','hopelessness','fatigue','insomnia','loss of appetite','concentration issues','worthlessness'],        specialty: 'Psychiatry' },
    { conditionName: 'Urinary Tract Infection', symptomKeywords: ['burning urination','frequent urination','pelvic pain','cloudy urine','blood in urine'],                      specialty: 'Urology' },
    { conditionName: 'Arthritis',             symptomKeywords: ['joint pain','joint stiffness','swelling','reduced range of motion','joint ache'],                               specialty: 'Rheumatology' },
    { conditionName: 'Pneumonia',             symptomKeywords: ['fever','cough','chest pain','difficulty breathing','chills','phlegm','fatigue'],                                specialty: 'Pulmonology' },
    { conditionName: 'Skin Allergy',          symptomKeywords: ['rash','itching','hives','redness','swelling','skin irritation'],                                                specialty: 'Dermatology' },
    { conditionName: 'Back Pain',             symptomKeywords: ['back pain','lower back pain','spine pain','muscle spasm','stiffness','radiating pain'],                         specialty: 'Orthopedics' },
    { conditionName: 'Conjunctivitis',        symptomKeywords: ['red eye','eye discharge','itchy eyes','watery eyes','eye pain','blurred vision'],                               specialty: 'Ophthalmology' },
    { conditionName: 'Acid Reflux',           symptomKeywords: ['heartburn','chest burning','regurgitation','sour taste','bloating','nausea after eating'],                      specialty: 'Gastroenterology' },
    { conditionName: 'Sinusitis',             symptomKeywords: ['facial pain','nasal congestion','post-nasal drip','headache','reduced smell','pressure around eyes'],           specialty: 'General Practice' },
    { conditionName: 'Eczema',                symptomKeywords: ['dry skin','itchy skin','rash','red patches','skin flaking','skin inflammation'],                                specialty: 'Dermatology' },
    { conditionName: 'Insomnia',              symptomKeywords: ['trouble sleeping','waking at night','fatigue','irritability','difficulty concentrating','daytime sleepiness'],  specialty: 'Psychiatry' },
    { conditionName: 'Anemia',               symptomKeywords: ['fatigue','pale skin','shortness of breath','dizziness','cold hands','chest pain','weakness'],                   specialty: 'General Practice' },
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
    where: { email: 'admin@medismart.com' },
    update: {},
    create: { email: 'admin@medismart.com', passwordHash: adminHash, role: 'admin' },
  });
  console.log('  ✓ Admin user');

  // ── 4. Doctors ───────────────────────────────────────────
  const doctorSeed = [
    { email: 'dr.chen@medismart.com',    name: 'Dr. Sarah Chen',    specialty: 'Cardiology',       bio: 'Board-certified cardiologist with 15 years of experience.',          licenseNumber: 'MD-CARD-001' },
    { email: 'dr.patel@medismart.com',   name: 'Dr. Raj Patel',     specialty: 'General Practice', bio: 'Family medicine physician dedicated to holistic patient care.',       licenseNumber: 'MD-GP-002'   },
    { email: 'dr.johnson@medismart.com', name: 'Dr. Maria Johnson', specialty: 'Neurology',        bio: 'Neurologist specialising in headache disorders and stroke prevention.', licenseNumber: 'MD-NEURO-003'},
    { email: 'dr.kim@medismart.com',     name: 'Dr. James Kim',     specialty: 'Dermatology',      bio: 'Dermatologist with expertise in skin conditions and cosmetic treatments.', licenseNumber: 'MD-DERM-004'},
    { email: 'dr.wilson@medismart.com',  name: 'Dr. Emily Wilson',  specialty: 'Psychiatry',       bio: 'Psychiatrist focused on anxiety, depression, and mood disorders.',     licenseNumber: 'MD-PSYCH-005'},
    { email: 'dr.nguyen@medismart.com',  name: 'Dr. Linh Nguyen',   specialty: 'Pulmonology',      bio: 'Pulmonologist specialising in asthma, COPD, and respiratory infections.', licenseNumber: 'MD-PULM-006'},
    { email: 'dr.okafor@medismart.com',  name: 'Dr. Chidi Okafor',  specialty: 'Orthopedics',      bio: 'Orthopedic surgeon with expertise in sports injuries and joint replacement.', licenseNumber: 'MD-ORTH-007'},
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
              create: [1,2,3,4,5].map(day => ({ dayOfWeek: day, startTime: '09:00', endTime: '17:00' })),
            },
          },
        },
      },
    });
    doctors[d.email] = u.id;
    console.log(`  ✓ Doctor: ${d.email}`);
  }

  // ── 5. Patients ──────────────────────────────────────────
  const patientSeed = [
    { email: 'patient@medismart.com',        name: 'Alex Johnson',      gender: 'male',   phone: '+1-555-0100', dob: '1990-03-15', allergies: ['penicillin'],        conditions: ['hypertension'] },
    { email: 'sarah.mitchell@email.com',     name: 'Sarah Mitchell',    gender: 'female', phone: '+1-555-0201', dob: '1985-07-22', allergies: [],                   conditions: ['migraine'] },
    { email: 'michael.torres@email.com',     name: 'Michael Torres',    gender: 'male',   phone: '+1-555-0302', dob: '1978-11-05', allergies: ['sulfa'],            conditions: ['type 2 diabetes','hypertension'] },
    { email: 'emma.davis@email.com',         name: 'Emma Davis',        gender: 'female', phone: '+1-555-0403', dob: '1995-02-28', allergies: [],                   conditions: [] },
    { email: 'james.wilson@email.com',       name: 'James Wilson',      gender: 'male',   phone: '+1-555-0504', dob: '1972-09-14', allergies: ['aspirin'],          conditions: ['arthritis','back pain'] },
    { email: 'lisa.anderson@email.com',      name: 'Lisa Anderson',     gender: 'female', phone: '+1-555-0605', dob: '1988-06-30', allergies: ['latex'],            conditions: ['asthma'] },
    { email: 'robert.brown@email.com',       name: 'Robert Brown',      gender: 'male',   phone: '+1-555-0706', dob: '1965-12-03', allergies: [],                   conditions: ['hypertension','acid reflux'] },
    { email: 'jennifer.garcia@email.com',    name: 'Jennifer Garcia',   gender: 'female', phone: '+1-555-0807', dob: '1993-04-18', allergies: ['pollen'],           conditions: ['anxiety disorder'] },
    { email: 'david.martinez@email.com',     name: 'David Martinez',    gender: 'male',   phone: '+1-555-0908', dob: '1980-08-25', allergies: [],                   conditions: ['insomnia'] },
    { email: 'olivia.thompson@email.com',    name: 'Olivia Thompson',   gender: 'female', phone: '+1-555-1009', dob: '1998-01-10', allergies: ['ibuprofen'],        conditions: ['eczema'] },
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
  // Only create if none exist yet
  const existingAppts = await prisma.appointment.count();
  if (existingAppts > 0) {
    console.log(`  ↩ Appointments already seeded (${existingAppts} found) — skipping`);
    console.log('\n✅  Seed complete.');
    return;
  }

  // Helper: create an appointment with optional session + notes
  async function makeAppointment({ patEmail, docEmail, daysOffset, hour = 10, status, sessionSymptoms, noteData }) {
    const patId = patients[patEmail];
    const docId = doctors[docEmail];
    if (!patId || !docId) return;

    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + daysOffset);
    scheduledAt.setHours(hour, 0, 0, 0);

    let sessionId = null;
    if (sessionSymptoms) {
      const session = await prisma.symptomSession.create({
        data: {
          patientId: patId,
          symptoms: sessionSymptoms,
          aiResult: {
            conditions: [
              { condition: sessionSymptoms[0] === 'chest pain' ? 'Hypertension' : sessionSymptoms[0] === 'headache' ? 'Migraine' : 'Common Cold', confidence: 72, specialty: docEmail.includes('chen') ? 'Cardiology' : 'General Practice', matchedSymptoms: sessionSymptoms.slice(0, 2) },
            ],
            recommendedSpecialty: docEmail.includes('chen') ? 'Cardiology' : docEmail.includes('johnson') ? 'Neurology' : 'General Practice',
            urgency: status === 'completed' ? 'routine' : 'soon',
            summary: 'Based on reported symptoms, an in-person consultation is recommended.',
            disclaimer: 'This is an AI-generated assessment and not a medical diagnosis.',
            engine: 'MediSmart AI (Keyword Matching)',
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
        data: {
          appointmentId: appt.id,
          doctorId: docId,
          notes:     noteData.notes,
          diagnosis: noteData.diagnosis,
          treatment: noteData.treatment,
        },
      });
    }

    return appt;
  }

  // Past completed appointments
  await makeAppointment({
    patEmail: 'patient@medismart.com', docEmail: 'dr.chen@medismart.com',
    daysOffset: -45, hour: 9, status: 'completed',
    sessionSymptoms: ['chest pain', 'shortness of breath', 'dizziness'],
    noteData: { notes: 'Patient reports intermittent chest tightness over 2 weeks. BP recorded at 148/92. EKG normal.', diagnosis: 'Hypertension Stage 1', treatment: 'Prescribed lisinopril 10mg daily. Advised low-sodium diet and 30 min daily walk. Follow-up in 6 weeks.' },
  });

  await makeAppointment({
    patEmail: 'patient@medismart.com', docEmail: 'dr.patel@medismart.com',
    daysOffset: -20, hour: 11, status: 'completed',
    sessionSymptoms: ['cough', 'fever', 'fatigue'],
    noteData: { notes: 'Patient presents with 5-day history of productive cough, low-grade fever, and fatigue. Lungs clear on auscultation.', diagnosis: 'Acute upper respiratory infection', treatment: 'Rest, fluids, paracetamol 500mg PRN. Return if fever persists beyond 3 days.' },
  });

  await makeAppointment({
    patEmail: 'sarah.mitchell@email.com', docEmail: 'dr.johnson@medismart.com',
    daysOffset: -30, hour: 14, status: 'completed',
    sessionSymptoms: ['severe headache', 'nausea', 'light sensitivity'],
    noteData: { notes: 'Patient reports 3 migraines per month, each lasting 8–12 hours. Aura present in 2 of 3 episodes. No neurological deficits.', diagnosis: 'Migraine with aura', treatment: 'Prescribed sumatriptan 50mg for acute attacks. Started propranolol 40mg daily for prevention. Advised sleep hygiene.' },
  });

  await makeAppointment({
    patEmail: 'michael.torres@email.com', docEmail: 'dr.patel@medismart.com',
    daysOffset: -60, hour: 10, status: 'completed',
    sessionSymptoms: ['frequent urination', 'excessive thirst', 'fatigue', 'blurred vision'],
    noteData: { notes: 'Routine diabetes review. HbA1c at 7.4% (up from 6.9%). Patient admits diet non-compliance and reduced exercise.', diagnosis: 'Type 2 Diabetes — suboptimal control', treatment: 'Increased metformin to 1000mg BD. Referral to dietitian. Lifestyle counselling provided. Retest HbA1c in 3 months.' },
  });

  await makeAppointment({
    patEmail: 'emma.davis@email.com', docEmail: 'dr.kim@medismart.com',
    daysOffset: -10, hour: 15, status: 'completed',
    sessionSymptoms: ['rash', 'itching', 'redness', 'skin irritation'],
    noteData: { notes: 'Erythematous pruritic rash on forearms and neck. Onset 5 days ago after introducing new laundry detergent.', diagnosis: 'Contact dermatitis', treatment: 'Hydrocortisone 1% cream BD for 2 weeks. Antihistamine (cetirizine) 10mg nocte. Advised to switch to fragrance-free products.' },
  });

  await makeAppointment({
    patEmail: 'james.wilson@email.com', docEmail: 'dr.okafor@medismart.com',
    daysOffset: -35, hour: 9, status: 'completed',
    sessionSymptoms: ['back pain', 'lower back pain', 'muscle spasm', 'stiffness'],
    noteData: { notes: 'Chronic lower back pain for 8 months, worsening with prolonged sitting. No radicular symptoms. Straight leg raise negative.', diagnosis: 'Lumbar muscle strain with chronic mechanical back pain', treatment: 'Physiotherapy referral × 8 sessions. Naproxen 500mg BD with meals for 2 weeks. Core strengthening exercises prescribed.' },
  });

  await makeAppointment({
    patEmail: 'lisa.anderson@email.com', docEmail: 'dr.nguyen@medismart.com',
    daysOffset: -50, hour: 11, status: 'completed',
    sessionSymptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'coughing'],
    noteData: { notes: 'Known asthmatic presenting with worsening symptoms over past 2 weeks. Triggered by recent cold weather. PEFR 68% predicted.', diagnosis: 'Asthma — moderate exacerbation', treatment: 'Increased salbutamol inhaler to QID. Added beclomethasone 200mcg BD. Provide written asthma action plan. Review in 4 weeks.' },
  });

  await makeAppointment({
    patEmail: 'jennifer.garcia@email.com', docEmail: 'dr.wilson@medismart.com',
    daysOffset: -15, hour: 13, status: 'completed',
    sessionSymptoms: ['anxiety', 'panic', 'racing heart', 'insomnia'],
    noteData: { notes: 'Patient reports escalating anxiety and 2 panic attacks in past month, associated with work stress. Sleep onset latency >1 hour.', diagnosis: 'Generalised Anxiety Disorder', treatment: 'Started sertraline 50mg daily. CBT referral made. Sleep hygiene advice. Review in 4 weeks with dosage assessment.' },
  });

  await makeAppointment({
    patEmail: 'robert.brown@email.com', docEmail: 'dr.chen@medismart.com',
    daysOffset: -70, hour: 10, status: 'completed',
    sessionSymptoms: ['headache', 'dizziness', 'chest pain', 'blurred vision'],
    noteData: { notes: 'Hypertensive patient for follow-up. BP 138/86 (improved). Medication compliance confirmed. No side effects reported.', diagnosis: 'Hypertension — improving control', treatment: 'Continue amlodipine 5mg. Reinforce dietary modifications. Annual lipid panel ordered. Next review 3 months.' },
  });

  await makeAppointment({
    patEmail: 'david.martinez@email.com', docEmail: 'dr.wilson@medismart.com',
    daysOffset: -25, hour: 16, status: 'completed',
    sessionSymptoms: ['insomnia', 'fatigue', 'irritability', 'difficulty concentrating'],
    noteData: { notes: 'Patient has experienced sleep difficulties for 4 months. Takes 2+ hours to fall asleep. Sleep quality poor. No depression symptoms.', diagnosis: 'Chronic insomnia disorder', treatment: 'Sleep restriction therapy explained. Melatonin 2mg 1 hour before bed. Avoid screens 1h before sleep. CBT-i referral placed.' },
  });

  // Confirmed upcoming appointments
  await makeAppointment({ patEmail: 'patient@medismart.com',     docEmail: 'dr.patel@medismart.com',   daysOffset: 7,  hour: 9,  status: 'confirmed', sessionSymptoms: ['headache', 'fatigue', 'dizziness'] });
  await makeAppointment({ patEmail: 'sarah.mitchell@email.com',  docEmail: 'dr.kim@medismart.com',     daysOffset: 5,  hour: 14, status: 'confirmed' });
  await makeAppointment({ patEmail: 'michael.torres@email.com',  docEmail: 'dr.patel@medismart.com',   daysOffset: 12, hour: 10, status: 'confirmed', sessionSymptoms: ['frequent urination', 'fatigue'] });
  await makeAppointment({ patEmail: 'james.wilson@email.com',    docEmail: 'dr.okafor@medismart.com',  daysOffset: 9,  hour: 11, status: 'confirmed', sessionSymptoms: ['joint pain', 'joint stiffness', 'swelling'] });
  await makeAppointment({ patEmail: 'lisa.anderson@email.com',   docEmail: 'dr.nguyen@medismart.com',  daysOffset: 14, hour: 9,  status: 'confirmed' });
  await makeAppointment({ patEmail: 'olivia.thompson@email.com', docEmail: 'dr.kim@medismart.com',     daysOffset: 6,  hour: 15, status: 'confirmed', sessionSymptoms: ['dry skin', 'itchy skin', 'rash'] });
  await makeAppointment({ patEmail: 'robert.brown@email.com',    docEmail: 'dr.chen@medismart.com',    daysOffset: 21, hour: 10, status: 'confirmed' });

  // Pending appointments
  await makeAppointment({ patEmail: 'patient@medismart.com',     docEmail: 'dr.wilson@medismart.com',  daysOffset: 18, hour: 13, status: 'pending',   sessionSymptoms: ['anxiety', 'insomnia', 'worry'] });
  await makeAppointment({ patEmail: 'emma.davis@email.com',      docEmail: 'dr.patel@medismart.com',   daysOffset: 10, hour: 10, status: 'pending',   sessionSymptoms: ['nausea', 'stomach ache', 'bloating'] });
  await makeAppointment({ patEmail: 'jennifer.garcia@email.com', docEmail: 'dr.wilson@medismart.com',  daysOffset: 15, hour: 14, status: 'pending' });
  await makeAppointment({ patEmail: 'david.martinez@email.com',  docEmail: 'dr.patel@medismart.com',   daysOffset: 20, hour: 9,  status: 'pending',   sessionSymptoms: ['fatigue', 'headache', 'blurred vision'] });
  await makeAppointment({ patEmail: 'olivia.thompson@email.com', docEmail: 'dr.johnson@medismart.com', daysOffset: 11, hour: 11, status: 'pending',   sessionSymptoms: ['severe headache', 'nausea', 'sensitivity to light'] });

  // Cancelled appointments
  await makeAppointment({ patEmail: 'michael.torres@email.com', docEmail: 'dr.chen@medismart.com',   daysOffset: -5, hour: 9,  status: 'cancelled' });
  await makeAppointment({ patEmail: 'emma.davis@email.com',     docEmail: 'dr.johnson@medismart.com', daysOffset: 3,  hour: 15, status: 'cancelled' });

  const apptCount = await prisma.appointment.count();
  console.log(`  ✓ ${apptCount} appointments (with sessions and notes)`);

  console.log('\n✅  Seed complete!');
  console.log('\n  Demo credentials:');
  console.log('    Patient  — patient@medismart.com  / Patient@123');
  console.log('    Doctor   — dr.chen@medismart.com  / Doctor@123');
  console.log('    Admin    — admin@medismart.com     / Admin@123');
}

// ─── run directly ─────────────────────────────────────────
if (require.main === module) {
  seed()
    .catch(err => { console.error(err); process.exit(1); })
    .finally(() => prisma.$disconnect());
}

module.exports = { seed };
