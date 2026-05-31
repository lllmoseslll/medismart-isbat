# MediSmart — AI-Powered Healthcare Platform

A full-stack healthcare management system with AI symptom analysis, specialist booking, and role-based portals for patients, doctors, and administrators.

## Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend  | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Auth     | JWT (access + refresh tokens) |

---

## Quick start (after cloning)

### 1. Backend

```bash
cd Backend
npm install

# Copy env file and set DATABASE_URL (PostgreSQL connection string)
cp .env.example .env

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# Start the dev server
# The database is seeded automatically on first run when empty
npm run dev        # → http://localhost:4000
```

> **Seed is automatic.** On the first `npm run dev` after a fresh migration, the server detects an empty database and seeds it with demo users, doctors, patients, appointments, and the AI knowledge base. You can also seed manually at any time with `npm run db:seed`.

### 2. Frontend

```bash
cd Frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL if needed
npm run dev        # → http://localhost:3000
```

---

## Demo accounts

The demo accounts work **without a running backend** — clicking them on the login page fills the form and logs in locally using cached data.

| Role    | Email                   | Password    |
|---------|-------------------------|-------------|
| Patient | patient@medismart.com   | Patient@123 |
| Doctor  | dr.chen@medismart.com   | Doctor@123  |
| Admin   | admin@medismart.com     | Admin@123   |

Additional seeded patients, doctors (7), and 25+ appointments across all statuses (pending / confirmed / completed / cancelled) are available once the backend is running.

---

## Seeded data

| Entity | Count |
|--------|-------|
| AI knowledge-base entries | 20 |
| Doctors | 7 (Cardiology, GP, Neurology, Dermatology, Psychiatry, Pulmonology, Orthopedics) |
| Patients | 10 (with medical history, allergies, DOB) |
| Appointments | 25+ (past completed with notes, upcoming confirmed, pending, cancelled) |
| Consultation notes | 10 (linked to completed appointments) |
| Symptom sessions | Linked to most appointments with AI results |

---

## Feature overview

### Patient portal (`/patient/*`)
- **Dashboard** — upcoming appointments, stat cards, quick actions
- **Symptom analysis** — select or describe symptoms; AI ranks possible conditions and recommends a specialist
- **Appointments** — browse doctors by specialty, pick a date/time slot, book; view and cancel upcoming
- **Profile** — update personal info, allergies, and medical history

### Doctor portal (`/doctor/*`)
- **Dashboard** — today's schedule, pending requests with AI pre-assessment
- **Appointments** — confirm / decline / cancel requests; view patient AI session data
- **Appointment detail** — patient info, symptom AI analysis, write consultation notes and diagnosis

### Admin portal (`/admin/*`)
- **Dashboard** — system-wide stats and recent activity table
- **Users** — create, edit, reset passwords, delete any account
- **Doctors** — register new doctors with auto availability
- **Reports** — appointment volume and status breakdown charts
- **AI Settings / Knowledge Base** — CRUD over the medical conditions that power symptom analysis

---

## API routes

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

GET    /api/patients/:id/profile
PUT    /api/patients/:id/profile
POST   /api/patients/symptoms
GET    /api/patients/symptoms
GET    /api/patients/symptoms/:sessionId

GET    /api/doctors?specialty=&date=
GET    /api/doctors/:id/availability
POST   /api/doctors/:id/notes
GET    /api/doctors/me/appointments
GET    /api/doctors/knowledge-base
POST   /api/doctors/knowledge-base

GET    /api/appointments
POST   /api/appointments
PUT    /api/appointments/:id
DELETE /api/appointments/:id

GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
PUT    /api/admin/users/:id/reset-password
DELETE /api/admin/users/:id
POST   /api/admin/doctors
GET    /api/admin/reports
GET    /api/admin/knowledge-base
POST   /api/admin/knowledge-base
PUT    /api/admin/knowledge-base/:id
DELETE /api/admin/knowledge-base/:id
PUT    /api/admin/doctors/:id/availability

GET    /api/health
```
