require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // AI Knowledge Base
  const conditions = [
    { conditionName: 'Common Cold', symptomKeywords: ['runny nose', 'sneezing', 'sore throat', 'mild fever', 'congestion', 'cough'], specialty: 'General Practice' },
    { conditionName: 'Influenza', symptomKeywords: ['fever', 'chills', 'muscle ache', 'fatigue', 'headache', 'cough', 'body pain'], specialty: 'General Practice' },
    { conditionName: 'Hypertension', symptomKeywords: ['headache', 'dizziness', 'chest pain', 'shortness of breath', 'blurred vision', 'nosebleed'], specialty: 'Cardiology' },
    { conditionName: 'Type 2 Diabetes', symptomKeywords: ['frequent urination', 'excessive thirst', 'fatigue', 'blurred vision', 'slow healing', 'tingling'], specialty: 'Endocrinology' },
    { conditionName: 'Asthma', symptomKeywords: ['wheezing', 'shortness of breath', 'chest tightness', 'coughing', 'difficulty breathing'], specialty: 'Pulmonology' },
    { conditionName: 'Migraine', symptomKeywords: ['severe headache', 'nausea', 'vomiting', 'light sensitivity', 'sound sensitivity', 'aura'], specialty: 'Neurology' },
    { conditionName: 'Gastroenteritis', symptomKeywords: ['nausea', 'vomiting', 'diarrhea', 'stomach pain', 'cramps', 'bloating', 'stomach ache'], specialty: 'Gastroenterology' },
    { conditionName: 'Anxiety Disorder', symptomKeywords: ['anxiety', 'panic', 'racing heart', 'sweating', 'trembling', 'fear', 'worry', 'insomnia'], specialty: 'Psychiatry' },
    { conditionName: 'Depression', symptomKeywords: ['sadness', 'hopelessness', 'fatigue', 'insomnia', 'loss of appetite', 'concentration issues', 'worthlessness'], specialty: 'Psychiatry' },
    { conditionName: 'Urinary Tract Infection', symptomKeywords: ['burning urination', 'frequent urination', 'pelvic pain', 'cloudy urine', 'blood in urine'], specialty: 'Urology' },
    { conditionName: 'Arthritis', symptomKeywords: ['joint pain', 'joint stiffness', 'swelling', 'reduced range of motion', 'joint ache'], specialty: 'Rheumatology' },
    { conditionName: 'Pneumonia', symptomKeywords: ['fever', 'cough', 'chest pain', 'difficulty breathing', 'chills', 'phlegm', 'fatigue'], specialty: 'Pulmonology' },
    { conditionName: 'Skin Allergy', symptomKeywords: ['rash', 'itching', 'hives', 'redness', 'swelling', 'skin irritation'], specialty: 'Dermatology' },
    { conditionName: 'Back Pain', symptomKeywords: ['back pain', 'lower back pain', 'spine pain', 'muscle spasm', 'stiffness', 'radiating pain'], specialty: 'Orthopedics' },
    { conditionName: 'Conjunctivitis', symptomKeywords: ['red eye', 'eye discharge', 'itchy eyes', 'watery eyes', 'eye pain', 'blurred vision'], specialty: 'Ophthalmology' },
  ];

  await prisma.aiKnowledgeBase.deleteMany();
  await prisma.aiKnowledgeBase.createMany({ data: conditions });
  console.log(`Seeded ${conditions.length} knowledge base entries`);

  // Admin user
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@medismart.com' },
    update: {},
    create: {
      email: 'admin@medismart.com',
      passwordHash: adminHash,
      role: 'admin',
    },
  });
  console.log('Admin user:', admin.email);

  // Sample doctors
  const doctorData = [
    { email: 'dr.chen@medismart.com', name: 'Dr. Sarah Chen', specialty: 'Cardiology', bio: 'Board-certified cardiologist with 15 years of experience.', licenseNumber: 'MD-CARD-001' },
    { email: 'dr.patel@medismart.com', name: 'Dr. Raj Patel', specialty: 'General Practice', bio: 'Family medicine physician dedicated to holistic patient care.', licenseNumber: 'MD-GP-002' },
    { email: 'dr.johnson@medismart.com', name: 'Dr. Maria Johnson', specialty: 'Neurology', bio: 'Neurologist specializing in headache disorders and stroke prevention.', licenseNumber: 'MD-NEURO-003' },
    { email: 'dr.kim@medismart.com', name: 'Dr. James Kim', specialty: 'Dermatology', bio: 'Dermatologist with expertise in skin conditions and cosmetic treatments.', licenseNumber: 'MD-DERM-004' },
    { email: 'dr.wilson@medismart.com', name: 'Dr. Emily Wilson', specialty: 'Psychiatry', bio: 'Psychiatrist focused on anxiety, depression, and mood disorders.', licenseNumber: 'MD-PSYCH-005' },
  ];

  const docHash = await bcrypt.hash('Doctor@123', 12);
  const days = [1, 2, 3, 4, 5]; // Mon-Fri

  for (const d of doctorData) {
    const docUser = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        passwordHash: docHash,
        role: 'doctor',
        doctorProfile: {
          create: {
            name: d.name,
            specialty: d.specialty,
            bio: d.bio,
            licenseNumber: d.licenseNumber,
            availability: {
              create: days.map(day => ({
                dayOfWeek: day,
                startTime: '09:00',
                endTime: '17:00',
              })),
            },
          },
        },
      },
    });
    console.log('Doctor:', docUser.email);
  }

  // Sample patient
  const patHash = await bcrypt.hash('Patient@123', 12);
  await prisma.user.upsert({
    where: { email: 'patient@medismart.com' },
    update: {},
    create: {
      email: 'patient@medismart.com',
      passwordHash: patHash,
      role: 'patient',
      patientProfile: {
        create: {
          name: 'John Patient',
          gender: 'male',
          phone: '+1-555-0100',
          medicalHistory: { allergies: ['penicillin'], conditions: ['hypertension'] },
        },
      },
    },
  });
  console.log('Sample patient created');

  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
