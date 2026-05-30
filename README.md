# MediSmart — AI-Powered Healthcare Platform

A full-stack healthcare management system with AI symptom analysis, specialist booking, and role-based portals for patients, doctors, and administrators.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Queue | BullMQ + Redis (optional — degrades gracefully) |
| Auth | JWT (access + refresh tokens) |

---

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or connection string to a hosted DB)
- Redis (optional — notifications degrade to console logs without it)

---

## Setup

### 1. Backend

```bash
cd Backend
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env — set DATABASE_URL at minimum

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# Seed sample data (admin, doctors, AI knowledge base)
npm run db:seed

# Start dev server
npm run dev        # http://localhost:4000
```

### 2. Frontend

```bash
cd Frontend
npm install

# Copy and set API URL
cp .env.local.example .env.local

# Start dev server
npm run dev        # http://localhost:3000
```

---

## Demo accounts (after seeding)

| Role    | Email                      | Password    |
|---------|----------------------------|-------------|
| Patient | patient@medismart.com      | Patient@123 |
| Doctor  | dr.chen@medismart.com      | Doctor@123  |
| Admin   | admin@medismart.com        | Admin@123   |

---

## Feature overview

### Patient portal (`/patient/*`)
- **Dashboard** — upcoming appointments, quick actions
- **Symptom analysis** (`/patient/symptoms`) — select or describe symptoms; AI ranks possible conditions and recommends a specialist
- **Appointments** (`/patient/appointments`) — browse doctors by specialty, pick a slot, book; view/cancel upcoming appointments
- **Profile** (`/patient/profile`) — update personal info, allergies, and medical history

### Doctor portal (`/doctor/*`)
- **Dashboard** — today's schedule, pending requests
- **Appointments** — confirm/decline/cancel patient requests; view AI pre-assessment before each consultation
- **Appointment detail** (`/doctor/appointments/[id]`) — patient info, symptom AI analysis, write consultation notes and diagnosis

### Admin portal (`/admin/*`)
- **Dashboard** — system-wide stats and recent activity
- **Users** — list, search, and deactivate accounts
- **Doctors** — register new doctor accounts with availability
- **Reports** — bar/pie charts of appointment volume and status breakdown
- **AI Settings** — CRUD over the medical knowledge base that powers symptom analysis

---

## API routes

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

GET    /api/patients/:id/profile
PUT    /api/patients/:id/profile
POST   /api/patients/symptoms
GET    /api/patients/symptoms/:sessionId

GET    /api/doctors?specialty=&date=
GET    /api/doctors/:id/availability
POST   /api/doctors/:id/notes
GET    /api/doctors/me/appointments

GET    /api/appointments
POST   /api/appointments
PUT    /api/appointments/:id
DELETE /api/appointments/:id

GET    /api/admin/users
POST   /api/admin/doctors
GET    /api/admin/reports
GET    /api/admin/ai-knowledge-base
POST   /api/admin/ai-knowledge-base
PUT    /api/admin/ai-knowledge-base/:id
DELETE /api/admin/ai-knowledge-base/:id
PUT    /api/admin/doctors/:id/availability
PUT    /api/admin/users/:id/deactivate
```
