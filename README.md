# CityCare Hospital Management System

A full-stack hospital-operations portfolio application demonstrating patient administration, appointment workflows, clinical-support modules, billing, inventory and staff operations.

> **Important:** This is a software portfolio/demo project, not a certified clinical system or a production hospital information system. Do not enter real patient records, protected health information or live clinical data.

## Overview

CityCare brings multiple hospital workflows into role-oriented workspaces. The current feature set includes patient registration, doctor scheduling, appointments, ward and bed management, pharmacy, laboratory, billing, insurance, staff operations and administrative reporting.

## Roles and workspaces

| Role | Example workflows |
|---|---|
| Admin | Staff administration, departments, payroll, recruitment and analytics |
| Doctor | Appointments, OPD queue, prescriptions, lab review and discharge workflows |
| Nurse | Ward/bed operations, vitals, medication notes and duty roster |
| Receptionist | Patient registration, appointments, billing and insurance |
| Patient | Appointment requests, prescriptions, lab reports and bills |

## Functional areas

- **Patient care:** patient records, appointments, OPD queue, prescriptions, vitals, lab reports and discharge.
- **Emergency operations:** ambulance dispatch and fleet information.
- **Facilities:** wards, beds, OT scheduling and visitor passes.
- **Finance and supply:** billing, insurance claims, pharmacy, inventory and purchase orders.
- **Workforce:** staff hierarchy, payroll, attendance, roster, recruitment and appraisals.
- **Administration:** notices, feedback, analytics and compliance-oriented workflows.

Feature availability should be verified against the current application and configured services; a listed module is not a certification of clinical completeness.

## Technology

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs, email OTP |
| Security libraries | Helmet, express-rate-limit, express-validator |
| Realtime | Socket.IO |
| Documents | PDFKit, Cloudinary / Multer |
| API documentation | Swagger UI |

## Repository structure

```text
client/
  src/
    components/
    context/
    i18n/
    pages/
server/
  routes/
  models/
  seed/
  server.js
  swagger.js
```

## Local setup

### Requirements

- Node.js and npm
- MongoDB
- Email account/app password for OTP flows
- Cloudinary credentials if the configured upload flows are used

### 1. Configure the backend

```bash
cd server
npm install
```

Create `server/.env`:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/citycare_hospital
JWT_SECRET=replace-with-a-long-random-secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
CLIENT_URL=http://localhost:5173
PORT=5000
```

Before the first login, provision exactly one administrator from the server environment. Set
`BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL` and a unique
`BOOTSTRAP_ADMIN_PASSWORD` (16-72 bytes), then run:

```bash
npm run bootstrap:admin
```

The command refuses to run once an Admin account exists. Remove the
`BOOTSTRAP_ADMIN_*` values from the environment after successful setup.
Public OTP registration creates Patient accounts only; staff roles must be
created by an authenticated administrator.

Start the API:

```bash
npm start
```

### 2. Start the frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Use the frontend's configured API base URL to point to the local API.

## Security, privacy and production limitations

The active server now applies an explicit Express CORS allowlist and matching Socket.IO origin allowlist using the comma-separated `CLIENT_URL` setting, Helmet, a 1 MB JSON body limit, and authentication-route rate limiting. It also requires `MONGO_URI` instead of silently falling back to a local database. These are baseline controls, not a complete security boundary. Verify authentication and role authorization on every sensitive route and realtime event, and harden upload handling and file access before deployment.

Before any real deployment, the project requires:

- A documented threat model and independent security review.
- Strong tenant/role isolation and authorization tests.
- Private file storage with access-controlled downloads and retention rules.
- Audit coverage for sensitive clinical and financial operations.
- Encrypted transport, backups, monitoring and incident-response procedures.
- Privacy, regulatory and clinical workflow review by qualified professionals.

Use synthetic demo data only. No claim of HIPAA, GDPR, Indian healthcare regulatory or clinical certification is made.

## Tests and verification

The backend package provides a Jest test command:

```bash
cd server
npm test
```

Run the frontend production build using the client package's build script. A successful build alone does not establish clinical safety or production readiness.

## Maintainer

**Matiur Rahaman** · [GitHub](https://github.com/matiur25580)

## Live Demo

**Frontend:** [Open Live Demo](https://hospital-management-system-drab-one.vercel.app)

> This link points to the deployed frontend. Features that depend on the API, database, email, file storage, or other external services may require the corresponding backend services and environment variables to be configured. Use test data only; this demo is not a production service.
