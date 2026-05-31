# MediSmart — AI-Powered Healthcare Platform

MediSmart is a full-stack healthcare management system built for the Ugandan healthcare context. It connects patients, doctors, and administrators on a single platform powered by AI symptom analysis, real-time appointment management, and automated email notifications.

---

## Table of Contents

1. [What the App Does](#what-the-app-does)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Clone and Run Locally](#clone-and-run-locally)
5. [Environment Variables](#environment-variables)
6. [All Dummy Accounts](#all-dummy-accounts)
7. [User Stories](#user-stories)
8. [User Journeys](#user-journeys)
9. [API Reference](#api-reference)
10. [Database Schema](#database-schema)
11. [Email Notifications](#email-notifications)
12. [Project Structure](#project-structure)

---

## What the App Does

MediSmart solves three problems:

- **Patients** do not know which specialist to see. The AI symptom analyser takes their described symptoms, matches them against a medical knowledge base, and recommends the right specialist — then lets them book directly.
- **Doctors** spend time chasing appointment confirmations. MediSmart gives them a dashboard to see today's schedule, pending requests, and patient AI pre-assessments before every consultation.
- **Administrators** have no central view of system activity. MediSmart gives them full control: create/edit/delete any account, register new doctors, view live reports, and manage the AI knowledge base.

### Core features

| Feature | Description |
|---|---|
| AI Symptom Analysis | Patient selects or describes symptoms; AI ranks possible conditions with confidence scores and recommends a specialist |
| Appointment Booking | Browse doctors by specialty, pick an available date/time slot, book in one click |
| Doctor Dashboard | See today's schedule, pending requests, and patient AI assessment before each visit |
| Consultation Notes | Doctor writes diagnosis and treatment plan; linked to the appointment and visible to the patient |
| Admin Control Panel | Full CRUD over users, doctors, reports, and the AI knowledge base |
| Email Notifications | Automated emails on booking, confirmation, cancellation, completion, and 24 h reminders |
| Role-based Access | Patient, Doctor, and Admin portals with separate routes, layouts, and permissions |
| Demo Mode | All three demo accounts work without a backend — for offline preview |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide React |
| Backend | Node.js 18, Express.js, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT (access token 7 days + refresh token 7 days) |
| Email | Nodemailer (Gmail SMTP or any SMTP provider) |
| AI Engine | Keyword-matching against `AiKnowledgeBase` table (Gemini API optional) |

---

## Prerequisites

Install these before running the project:

- **Node.js 18+** — https://nodejs.org
- **PostgreSQL 14+** — running locally or a hosted connection string
- **npm** — comes with Node.js
- **Git** — to clone the repo

Optional:
- A **Gmail account** with an App Password for email notifications (the app runs without it — emails are logged to console instead)

---

## Clone and Run Locally

### Step 1 — Clone the repository

```bash
git clone <repo-url>
cd isbat_mediSmart
```

### Step 2 — Set up the Backend

```bash
cd Backend
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Open `Backend/.env` and set at minimum:

```
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/smartDB"
```

Everything else has working defaults. See [Environment Variables](#environment-variables) for the full list.

Run database migrations:

```bash
npm run db:generate
npm run db:migrate
```

Seed the database with all demo accounts, doctors, patients, and appointments:

```bash
npm run db:seed
```

Start the backend:

```bash
npm run dev
# API running at http://localhost:4000
```

> **Auto-seed:** If you skip `npm run db:seed`, the server detects an empty database on first start and seeds it automatically.

### Step 3 — Set up the Frontend

Open a new terminal:

```bash
cd Frontend
npm install
cp .env.local.example .env.local
npm run dev
# App running at http://localhost:3000
```

### Step 4 — Open the app

Navigate to **http://localhost:3000** and log in with any of the [demo accounts](#all-dummy-accounts) below.

---

## Environment Variables

### Backend — `Backend/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | `medismart-jwt-secret-key-2024` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | `medismart-refresh-secret-key-2024` | Secret for signing refresh tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime |
| `PORT` | No | `4000` | Port the API listens on |
| `FRONTEND_URL` | No | `http://localhost:3000` | Allowed CORS origin |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | — | SMTP username / Gmail address |
| `SMTP_PASS` | No | — | SMTP password / Gmail App Password |
| `EMAIL_FROM` | No | SMTP_USER value | The "from" address shown in emails |
| `GEMINI_API_KEY` | No | — | Google Gemini key (enhances AI analysis) |

> If `SMTP_USER` is not set, emails are skipped and logged to console — the app still works fully.

### Frontend — `Frontend/.env.local`

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000/api` | Backend API base URL |

---

## All Dummy Accounts

All accounts use the same password as their role: `Patient@123`, `Doctor@123`, or `Admin@123`.

### Admin

| Name | Email | Password |
|---|---|---|
| Administrator | admin@medismart.com | Admin@123 |

### Doctors

| Name | Specialty | Email | Password |
|---|---|---|---|
| Dr. Nalwanga Sarah | Cardiology | dr.chen@medismart.com | Doctor@123 |
| Dr. Mugisha Robert | General Practice | dr.patel@medismart.com | Doctor@123 |
| Dr. Ochieng James | Neurology | dr.johnson@medismart.com | Doctor@123 |
| Dr. Ssemakula Grace | Dermatology | dr.kim@medismart.com | Doctor@123 |
| Dr. Atim Florence | Psychiatry | dr.wilson@medismart.com | Doctor@123 |
| Dr. Byaruhanga Peter | Pulmonology | dr.nguyen@medismart.com | Doctor@123 |
| Dr. Kayiwa Martha | Orthopedics | dr.okafor@medismart.com | Doctor@123 |

All doctors are available Monday to Friday, 08:00–17:00.

### Patients

| Name | Email | Password | Medical Notes |
|---|---|---|---|
| Mukasa John | patient@medismart.com | Patient@123 | Hypertension; allergic to penicillin |
| Nakato Sarah | nakato.sarah@gmail.com | Patient@123 | Migraine history |
| Tumwine Michael | tumwine.michael@gmail.com | Patient@123 | Type 2 Diabetes + Hypertension; allergic to sulfa |
| Auma Emma | auma.emma@gmail.com | Patient@123 | No known conditions |
| Ssali James | ssali.james@gmail.com | Patient@123 | Arthritis + chronic back pain; allergic to aspirin |
| Kyeyune Lisa | kyeyune.lisa@gmail.com | Patient@123 | Asthma; allergic to latex |
| Ochieng Robert | ochieng.robert@gmail.com | Patient@123 | Hypertension + acid reflux |
| Nantongo Jennifer | nantongo.jennifer@gmail.com | Patient@123 | Anxiety disorder; allergic to pollen |
| Kiggundu David | kiggundu.david@gmail.com | Patient@123 | Chronic insomnia |
| Namukasa Olivia | namukasa.olivia@gmail.com | Patient@123 | Skin allergy; allergic to ibuprofen |

### Seeded appointment data

The database is pre-loaded with 24 appointments:

- **10 completed** — each has a consultation note with diagnosis and treatment plan
- **7 confirmed** — upcoming appointments the doctor has accepted
- **5 pending** — awaiting doctor response
- **2 cancelled**

---

## User Stories

### Patient stories

**Account and profile**
- As a patient, I want to create an account so that I can access the platform.
- As a patient, I want to log in securely so that my health data stays private.
- As a patient, I want to update my name, phone number, date of birth, and gender so that my profile is accurate.
- As a patient, I want to record my allergies and pre-existing conditions so that my doctor can see them before the appointment.

**Symptom analysis**
- As a patient, I want to select my symptoms from a common list so that I can quickly describe how I am feeling.
- As a patient, I want to describe my symptoms in my own words so that I can include details not on the list.
- As a patient, I want the AI to rank possible conditions with confidence scores so that I understand what might be wrong.
- As a patient, I want to see how urgent my condition is (routine, soon, urgent, emergency) so that I know whether to act immediately.
- As a patient, I want the AI to recommend a specialist so that I book the right doctor.
- As a patient, I want my AI assessment to be attached to my appointment so that the doctor can review it before seeing me.

**Appointments**
- As a patient, I want to browse doctors by specialty so that I can find the right expert.
- As a patient, I want to see a doctor's available time slots so that I can pick a convenient time.
- As a patient, I want to book an appointment in one step so that the process is fast.
- As a patient, I want to receive a confirmation email when I book so that I have a record.
- As a patient, I want to receive a reminder email 24 hours before my appointment so that I do not forget.
- As a patient, I want to receive an email when the doctor confirms or cancels so that I stay informed.
- As a patient, I want to view all my upcoming and past appointments on one screen so that I can track my health history.
- As a patient, I want to cancel an appointment so that the slot is freed for someone else.

**Dashboard**
- As a patient, I want to see my next upcoming appointment on the dashboard so that I always know what is coming.
- As a patient, I want to see a count of upcoming, completed, and total appointments so that I can track my health activity.
- As a patient, I want quick-action buttons for symptom analysis, booking, and profile so that I can navigate fast.

---

### Doctor stories

**Dashboard and schedule**
- As a doctor, I want to see today's appointments at a glance so that I can plan my day.
- As a doctor, I want to see how many appointments are pending, confirmed, and completed so that I know my workload.
- As a doctor, I want to see pending appointment requests that need my response so that nothing is missed.

**Appointment management**
- As a doctor, I want to receive an email when a patient books with me so that I am immediately notified.
- As a doctor, I want to confirm or decline a pending appointment from the dashboard so that I can manage my schedule.
- As a doctor, I want to view the patient's AI pre-assessment before the consultation so that I can prepare.
- As a doctor, I want to see the patient's reported symptoms, medical history, and allergies in one place so that I have full context.
- As a doctor, I want to write consultation notes, a diagnosis, and a treatment plan after the appointment so that there is a record.
- As a doctor, I want saving notes to automatically mark the appointment as completed so that the status is always accurate.

**Knowledge base**
- As a doctor, I want to view the AI medical knowledge base so that I understand what conditions the AI can identify.
- As a doctor, I want to add new conditions and symptoms to the knowledge base so that the AI improves over time.

---

### Admin stories

**User management**
- As an admin, I want to view all users in the system so that I have a full picture of who has accounts.
- As an admin, I want to search and filter users by name, email, and role so that I can find anyone quickly.
- As an admin, I want to create any type of account (patient, doctor, admin) so that I can onboard new staff.
- As an admin, I want to edit a user's name, email, and role so that I can correct mistakes.
- As an admin, I want to reset a user's password so that I can help users who are locked out.
- As an admin, I want to delete a user account so that I can remove inactive or duplicate accounts.
- As an admin, I cannot delete my own account so that the system always has at least one administrator.

**Doctor management**
- As an admin, I want to register new doctor accounts with their specialty, bio, and licence number so that doctors can start accepting appointments immediately.
- As an admin, I want doctors to have default Mon–Fri availability set automatically so that patients can book without waiting.
- As an admin, I want to update a doctor's availability schedule so that it matches their actual working hours.

**Reports and analytics**
- As an admin, I want to see total counts for users, doctors, patients, and appointments so that I can monitor platform growth.
- As an admin, I want to see a breakdown of appointments by status (pending, confirmed, completed, cancelled) so that I can identify bottlenecks.
- As an admin, I want to see the 10 most recent appointments with patient and doctor details so that I can review recent activity.

**AI knowledge base**
- As an admin, I want to view all conditions in the AI knowledge base so that I know what the system can diagnose.
- As an admin, I want to add new conditions with symptom keywords and a specialty so that the AI covers more illnesses.
- As an admin, I want to edit existing conditions so that I can correct or improve them.
- As an admin, I want to delete outdated conditions so that the knowledge base stays accurate.

---

## User Journeys

### Journey 1 — Patient uses AI to find the right specialist and books

> Mukasa John has had chest tightness and dizziness for three days and does not know which doctor to see.

1. Mukasa opens MediSmart and logs in at `/login`.
2. He is taken to his **Patient Dashboard** where he sees a welcome banner and a "Start AI analysis" button.
3. He clicks **Symptom Analysis** in the sidebar.
4. On the symptoms page he selects `chest pain`, `dizziness`, and `shortness of breath` from the common symptoms list.
5. He clicks **Analyse with MediSmart AI**.
6. The AI returns: *Hypertension (72% match)* as the top condition, urgency level **Soon — see a doctor within a few days**, and recommends a **Cardiologist**.
7. He clicks **Book appointment →** which takes him to the Appointments page pre-filtered to Cardiology.
8. He selects **Dr. Nalwanga Sarah**, picks next Monday at 09:00, and clicks **Confirm**.
9. He receives a **confirmation email** immediately.
10. The appointment appears on his dashboard as `pending`.
11. Dr. Nalwanga confirms the appointment that afternoon.
12. Mukasa receives a **confirmation email** from the doctor.
13. The night before the appointment he receives a **24-hour reminder email**.
14. After the consultation Dr. Nalwanga writes notes: *Diagnosis: Hypertension Stage 1. Treatment: Amlodipine 5 mg daily.*
15. The appointment status changes to `completed` and Mukasa receives a **consultation completed email**.

---

### Journey 2 — Doctor manages their day

> Dr. Nalwanga Sarah arrives at work and needs to review the day's schedule and respond to new requests.

1. She logs in at `/login` with `dr.chen@medismart.com`.
2. She lands on the **Doctor Dashboard** showing: today's appointments, 2 pending requests, and 5 confirmed upcoming.
3. She reviews the pending request from Mukasa John: the card shows his AI assessment — *Hypertension 72%, symptoms: chest pain, dizziness*.
4. She clicks **Confirm** — Mukasa receives an email instantly.
5. She clicks **View details** on a confirmed appointment to see the full **Appointment Detail** page.
6. She reads the patient's full profile (allergies: penicillin), their reported symptoms, and the AI pre-assessment.
7. After the consultation she fills in the **Consultation Notes** form: notes, diagnosis, and treatment plan.
8. She clicks **Save & complete appointment** — the appointment is marked `completed` and the patient is notified by email.

---

### Journey 3 — Admin onboards a new doctor and monitors the platform

> A new doctor, Dr. Tumusiime Grace, has joined the clinic and needs an account.

1. Admin logs in at `/login` with `admin@medismart.com`.
2. She goes to **Admin → Doctors** and clicks **Add doctor**.
3. She fills in: name, email, specialty (Endocrinology), licence number, and a temporary password.
4. She clicks **Create doctor account**. The doctor is created with default Mon–Fri 08:00–17:00 availability.
5. She then goes to **Admin → Reports** and sees the system now has 19 total users, 8 doctors, 10 patients, and 24 appointments.
6. The bar chart shows 10 completed, 7 confirmed, 5 pending, and 2 cancelled.
7. She goes to **Admin → Users**, searches for `Auma`, finds Auma Emma, and clicks **Edit** to update her phone number.
8. She goes to **Admin → AI Settings**, finds the "Malaria" condition, and adds `shivering` to its symptom keywords.

---

### Journey 4 — Patient updates profile and reviews history

> Nakato Sarah wants to add her allergy information before her upcoming appointment.

1. She logs in and goes to **My Profile** in the sidebar.
2. She sees her existing details: name, gender, phone, date of birth.
3. She updates her **allergies** field to add `codeine` and her **conditions** to add `migraine`.
4. She clicks Save.
5. She navigates to **Appointments** and sees her upcoming confirmed appointment with Dr. Ssemakula Grace (Dermatology) in 5 days.
6. She scrolls down to **Past appointments** and sees her completed consultation with Dr. Ochieng James, including the diagnosis: *Migraine with aura*.

---

### Journey 5 — Patient cancels an appointment

> Ssali James can no longer make his upcoming appointment and needs to cancel.

1. He logs in and goes to **Appointments**.
2. He sees his confirmed appointment with Dr. Kayiwa Martha in 9 days under **Upcoming**.
3. He clicks **Cancel** on the appointment card.
4. The appointment status changes to `cancelled`.
5. The doctor is notified and the time slot is freed for other patients.

---

### Journey 6 — New user registers and books their first appointment

> A new patient, Acen Grace, is using MediSmart for the first time.

1. She opens `http://localhost:3000` and clicks **Create one free →** on the login page.
2. On the Register page she fills in: name, email, account type (Patient), password, and confirm password.
3. She clicks **Create account** — her account is created and she is taken to her patient dashboard.
4. The dashboard shows a welcome banner explaining how to use symptom analysis.
5. She clicks **Analyse symptoms**, selects `fever`, `headache`, and `fatigue`.
6. The AI returns: *Malaria (72% match)*, urgency **Urgent — see a doctor today**, recommends **General Practice**.
7. She clicks **Book appointment**, selects Dr. Mugisha Robert, picks today's earliest slot, and confirms.
8. She receives a booking confirmation email and her dashboard now shows 1 upcoming appointment.

---

## API Reference

All API routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>` in the request header.

### Authentication

```
POST   /api/auth/register       — create a new account
POST   /api/auth/login          — log in, receive access + refresh tokens
POST   /api/auth/refresh        — exchange refresh token for new access token
GET    /api/health              — server health check
```

### Patients

```
GET    /api/patients/:id/profile       — get patient profile (patient, doctor, admin)
PUT    /api/patients/:id/profile       — update profile (patient, admin)
POST   /api/patients/symptoms          — submit symptoms for AI analysis (patient)
GET    /api/patients/symptoms          — list own symptom sessions (patient)
GET    /api/patients/symptoms/:id      — get a specific symptom session
```

### Doctors

```
GET    /api/doctors                    — list all doctors, optionally filter by specialty/date
GET    /api/doctors/:id/availability   — get a doctor's available slots
POST   /api/doctors/:id/notes          — write consultation notes (doctor)
GET    /api/doctors/:id/notes/:apptId  — get notes for an appointment
GET    /api/doctors/me/appointments    — doctor's own appointments
GET    /api/doctors/knowledge-base     — view AI knowledge base (doctor, admin)
POST   /api/doctors/knowledge-base     — add a knowledge base entry (doctor, admin)
```

### Appointments

```
GET    /api/appointments               — list appointments (scoped by role)
POST   /api/appointments               — book a new appointment (patient)
PUT    /api/appointments/:id           — update status or reschedule (doctor, patient, admin)
DELETE /api/appointments/:id           — cancel appointment (patient, admin)
```

### Admin

```
GET    /api/admin/users                        — list all users
POST   /api/admin/users                        — create any user type
PUT    /api/admin/users/:id                    — edit user details
PUT    /api/admin/users/:id/reset-password     — reset a user's password
DELETE /api/admin/users/:id                    — delete a user
POST   /api/admin/doctors                      — register a new doctor
PUT    /api/admin/doctors/:id/availability     — update doctor's availability
GET    /api/admin/reports                      — system-wide stats and recent appointments
GET    /api/admin/knowledge-base               — list AI knowledge base entries
POST   /api/admin/knowledge-base               — create a knowledge base entry
PUT    /api/admin/knowledge-base/:id           — update a knowledge base entry
DELETE /api/admin/knowledge-base/:id           — delete a knowledge base entry
```

---

## Database Schema

```
User
  id, email, passwordHash, role (patient|doctor|admin), createdAt

PatientProfile
  userId, name, dob, gender, phone, medicalHistory (JSON: allergies[], conditions[])

DoctorProfile
  userId, name, specialty, bio, licenseNumber

Availability
  id, doctorId, dayOfWeek (0–6), startTime, endTime

SymptomSession
  id, patientId, symptoms (JSON), aiResult (JSON), createdAt

Appointment
  id, patientId, doctorId, sessionId?, scheduledAt, status, createdAt

ConsultationNote
  id, appointmentId, doctorId, notes, diagnosis?, treatment?, createdAt

Notification
  id, userId, type, message, channel, read, sentAt

AiKnowledgeBase
  id, conditionName, symptomKeywords[], specialty, updatedAt
```

---

## Email Notifications

Emails are sent automatically for every key event. If `SMTP_USER` is not configured, events are logged to the console instead — the app still works fully.

| Event | Recipient | Subject |
|---|---|---|
| Patient books appointment | Patient | `Appointment Confirmed — Dr. X` |
| Patient books appointment | Doctor | `New Appointment Request — Patient Name` |
| Doctor confirms appointment | Patient | `Appointment Confirmed — MediSmart` |
| Doctor or admin cancels | Patient | `Appointment Cancelled — MediSmart` |
| Consultation completed | Patient | `Consultation Completed — MediSmart` |
| 24 hours before appointment | Patient | `Appointment Reminder — Tomorrow with Dr. X` |

The 24-hour reminder scheduler runs every hour. It finds all confirmed/pending appointments in the 23–25 hour window and sends a reminder, deduplicating so reminders are never sent twice even across server restarts.

---

## Project Structure

```
isbat_mediSmart/
├── README.md
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma         — database models
│   │   ├── seed.js               — full dummy data seed
│   │   └── migrations/           — migration history
│   ├── src/
│   │   ├── index.js              — Express entry point + auto-seed + reminder scheduler
│   │   ├── prisma.js             — Prisma client singleton
│   │   ├── middleware/
│   │   │   └── auth.js           — JWT requireAuth middleware
│   │   ├── routes/
│   │   │   ├── auth.js           — register, login, refresh
│   │   │   ├── patients.js       — profile, symptom sessions
│   │   │   ├── appointments.js   — CRUD + status updates
│   │   │   ├── doctors.js        — list, availability, notes, knowledge base
│   │   │   └── admin.js          — user management, reports, knowledge base CRUD
│   │   └── services/
│   │       ├── ai.js             — symptom keyword matching engine
│   │       ├── email.js          — HTML email templates + nodemailer sender
│   │       └── queue.js          — notification dispatcher + 24h reminder scheduler
│   ├── .env.example
│   └── package.json
└── Frontend/
    ├── app/
    │   ├── (auth)/               — login and register pages + shared layout
    │   ├── (patient)/            — dashboard, symptoms, appointments, profile
    │   ├── (doctor)/             — dashboard, appointments list, appointment detail
    │   └── (admin)/              — dashboard, users, doctors, reports, AI settings
    ├── components/
    │   ├── Sidebar.tsx           — role-aware navigation sidebar
    │   └── StatCard.tsx          — reusable metric card
    ├── lib/
    │   ├── api.ts                — typed fetch wrapper for all API calls
    │   └── auth.ts               — localStorage helpers, token management
    ├── middleware.ts             — cookie-based route protection
    ├── .env.local.example
    └── package.json
```
