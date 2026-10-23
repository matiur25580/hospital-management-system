# 🏥 CityCare Hospital — Enterprise Hospital Management & Patient Care System

> A full-stack, enterprise-grade Hospital Management System (HMS) with role-based dashboards, real OTP authentication, and 30+ operational modules.

## 📌 Overview

CityCare Hospital is a **production-ready, enterprise-grade** hospital management platform built with the **MERN stack**: patient registration, doctor scheduling, ward/bed management, ambulance tracking, pharmacy, lab, billing, insurance, HR & payroll, and compliance — with **role-based access control** and **real email OTP authentication**.

| Stack | Technology |
|---|---|
| **Frontend** | React 19 + Vite, CSS variables |
| **Backend** | Node.js + Express |
| **Database** | MongoDB + Mongoose (one Atlas cluster, separate DB per project) |
| **Auth** | JWT + bcrypt + real Gmail SMTP OTP (6-digit, 5-min expiry) |
| **i18n** | English + Hindi (auto-detect, localStorage) |
| **Theming** | Dark / Light mode (persisted) |
| **Deploy** | Vercel (frontend) + Render (backend) |

## 🔐 Authentication & Security

- **Real DB authentication** — no hardcoded demo logins
- **Account Role dropdown** (Admin / Doctor / Nurse / Receptionist / Patient) above "Email or Unique ID" box
- **Registration**: full name, email, contact number, DOB (DDMMYYYY), role popup, password + confirm
- **Real email OTP** via Gmail App Password: 6-digit, MongoDB `otps` collection, 5-min validity, countdown timer, resend at 0s, never shown in UI
- **Password reset** rejects same-as-current password
- **Unique ID** format `RNSDDMMYYYY` shown after registration
- `.env` never committed (`.gitignore` + `.env.example`)

## 👥 Roles & Dashboards

| Role | Capabilities |
|---|---|
| **Admin** | Staff & hierarchy, payroll, job posting, hiring, notice board, analytics |
| **Doctor** | OPD queue, appointments, e-prescriptions, teleconsult, OT, lab review, discharge |
| **Nurse** | Ward/bed, vitals, duty roster, medication notes |
| **Receptionist** | Patient registration, appointments, gate passes, billing, insurance claims |
| **Patient** | Book appointments, prescriptions, lab reports, bills, feedback |

## 🧩 Modules (30+)

### Clinical & Patient Care
- Patient Management — registration, unique ID, admission/discharge
- Doctor Directory — departments, OPD days, timings, room numbers
- Appointments & OPD Queue — booking, token system, live queue
- Telemedicine (Video OPD) — book consult (Rs.300), doctor confirm, e-prescription
- Pharmacy / e-Prescription — prescribe, dispense, stock deduction
- Lab Management — test catalog, orders, sample collection, results
- OT Booking — surgeries with surgeon, anesthetist, nurses
- Ward & Bed Management — availability, allocation, transfers
- Discharge Summary — diagnosis, treatment, medicines, follow-up
- Vitals & Nursing Notes

### Emergency & Logistics
- Ambulance Dispatch — intake, vehicle assignment, live tracking (15s refresh)
- Ambulance Fleet — vehicle registry, driver details, availability
- Visitor / Gate Pass — issue passes, check-in/check-out, print pass

### Billing, Insurance & Stock
- Billing & Invoices — itemized bills, payment tracking
- Insurance Claims — filing, pending to approved to settled, documents
- Inventory & Expiry — batch no, expiry alerts, reorder levels
- Purchase Orders — supplier POs, send/receive flow

### HR, Payroll & Compliance
- Staff & Hierarchy — org chart, designations, reporting lines
- Payroll — monthly salary, pay slips, paid/pending tracking
- Attendance — check-in/out, monthly summary, leave approvals
- Duty Roster — shift planning, auto-generate
- Recruitment — job postings, applicant pipeline, one-click hire
- Performance Appraisal — ratings, goals, draft/submit/acknowledge
- ID Cards — generator with photo, blood group, print-ready
- PPE Compliance — mask & gloves checks, zone-wise tracking
- Cleaning Schedule — zone-wise tasks, weekly roster

### Engagement & Admin
- Notice Board — by category & priority with validity dates
- Patient Feedback — cleanliness, staff, doctor care, waiting time
- Analytics — revenue, occupancy, OPD footfall, claims

## Project Structure

    hospital-management-system/
    ├── client/src/
    │   ├── components/   # AuthHeader, DashTopBar, ThemeSwitcher, Toast
    │   ├── context/      # AuthContext, ThemeContext, LanguageContext
    │   ├── i18n/         # translations.js (en + hi)
    │   ├── pages/        # Login, Register, dashboards
    │   └── App.jsx
    ├── server/
    │   ├── routes/       # otpAuth.js + 30+ route files
    │   ├── models/       # User, Otp, Ward, Bed, Department
    │   ├── seed/         # hospitalMaster.js (16 departments)
    │   └── index.js      # port 5000
    └── README.md

## Environment Variables (server/.env)

    MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/hospitalDB
    JWT_SECRET=<long-random-secret>
    EMAIL_USER=yourgmail@gmail.com
    EMAIL_PASS=xxxxxxxxxxxxxxxx
    CLIENT_URL=http://localhost:5173
    PORT=5000

App trims EMAIL_USER and strips whitespace from EMAIL_PASS, with fallback so signup never blocks.

## Getting Started

    cd server && npm install && node index.js   # http://localhost:5000
    cd client && npm install && npm run dev     # http://localhost:5173
    cd client && npm run build                  # production build -> dist

## Deployment

- Frontend: Vercel — Root: client, Build: npm run build, Output: dist
- Backend: Render — Root: server, Start: npm start
- Auto-deploy on push to main; Render CLIENT_URL must match Vercel URL (CORS)

## Key Technical Decisions

1. No demo logins — every login hits MongoDB
2. Role-first login — Account Role dropdown above Email/Unique ID field
3. OTP in DB, not memory — survives restarts; 5-min TTL server-side
4. One Atlas cluster, many DBs — change DB name per project, free-tier friendly
5. Mobile-first development — built entirely on Android (Termux + Codespaces)
6. Lightweight i18n — context-based, English fallback

## Departments Seeded (16)

Skin, Blood, Ear, Hair, Eye, Kidney, Liver, Nerve, Maternity, Anesthesia, Pediatrics + 5 more in server/seed/hospitalMaster.js

## Author

Rubel Ali — MERN Full-Stack Developer, Newtown Kolkata, West Bengal, India
Email: rahamannatur397@gmail.com
