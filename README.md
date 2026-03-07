# DealVault

A secure, full-stack deal room platform for managing multi-party commodity transactions. Built for brokers, mandates, and intermediaries who need structured workflows, document verification, and commission tracking across complex deal chains.

## What It Does

DealVault provides private deal rooms where multiple parties collaborate on commodity transactions (gold, diamonds, platinum, and more). Each deal moves through a defined lifecycle — from draft to settlement — with full audit trails, document management, and commission ledger tracking at every stage.

### Key Capabilities

- **Deal Rooms** — Create and manage deals with automatic deal numbering, status state machine enforcement, and multi-party collaboration across buy and sell sides
- **Party Management** — Invite sellers, buyers, mandates, and intermediaries with role-based positioning in the deal chain; accept/reject invitations with company assignment
- **Document Vault** — Upload and verify deal documents (SPA, NCNDA, IMFPA, BCL, POF) with file type validation, magic byte verification, SHA-256 hashing, and visibility controls
- **Commission Ledger** — Track commission splits across the deal chain with pool validation ensuring allocations never exceed the agreed percentage
- **Messaging** — In-deal messaging with three visibility levels: deal-wide, side-only (buy/sell), and private
- **Timeline & Audit** — Every action logged with full audit trail; export as CSV or JSON for compliance
- **Notifications** — In-app notification system with real-time badge updates and email alerts via Resend
- **Two-Factor Auth** — TOTP-based 2FA with QR code setup and replay attack prevention
- **Admin Dashboard** — Platform-wide statistics, user management, and role administration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript, TailwindCSS v4 |
| UI Components | shadcn/ui, Radix UI, Lucide Icons |
| Database | Prisma ORM (SQLite dev / PostgreSQL production) |
| Auth | NextAuth v4 (credentials + JWT + TOTP 2FA) |
| Validation | Zod v4 |
| Email | Resend API |
| Testing | Vitest (unit) + Playwright (E2E) |
| CI/CD | GitHub Actions |
| Deployment | Docker (multi-stage build) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Seed sample data (admin user, deals, companies)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Default Seed Credentials

After seeding, log in with:
- **Admin:** admin@dealvault.com / password123
- **User:** user@dealvault.com / password123

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (requires dev server)
npm run test:e2e
```

## Docker

```bash
# Development (with PostgreSQL)
docker compose up

# Production
docker compose -f docker-compose.prod.yml up -d
```

## Deal Lifecycle

```
draft -> documents_pending -> under_review -> verified -> in_progress -> settled -> closed
  \            \                  \              \            \
   \            \                  \              \            +-> cancelled
    \            \                  \              +-> cancelled
     \            \                  +-> cancelled
      \            +-> cancelled
       +-> cancelled
```

Transitions are enforced server-side via a status state machine. Only valid transitions are permitted.

## Security

- Rate limiting with per-IP buckets (auth, API, upload)
- Input sanitization (HTML stripping, XSS prevention)
- File upload validation (extension whitelist, MIME type, magic bytes)
- Security headers (X-Content-Type-Options, X-Frame-Options, CSP)
- TOTP replay attack prevention
- Role-based access control (user/admin)
- Environment validation with production enforcement

## Project Structure

```
src/
  app/
    (auth)/          Login, register, password reset
    (dashboard)/     Dashboard, deals, companies, profile, admin
    api/             REST API routes (24 endpoints)
    api-docs/        Interactive API documentation
  components/
    layout/          Header, sidebar
    providers/       Session, theme providers
    ui/              shadcn/ui components
  lib/               Auth, DB, storage, validation, logging
  services/          Timeline, notifications, email
  types/             TypeScript types, constants, enums
prisma/              Schema, migrations, seed
e2e/                 Playwright E2E tests
```

## License

Private — All rights reserved.

---

Built by [Nhlanhla Mnyandu](mailto:nhlanhla@isutech.co.za) at ISU Tech.
