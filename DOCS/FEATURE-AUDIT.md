# DealVault — Feature Coverage Audit Report

**Date:** 2026-03-08
**Auditor:** Automated code + documentation analysis
**Scope:** Full codebase, landing page, documentation, schema, and API routes

---

## 1. Executive Summary

DealVault has **86 of 88 planned tasks complete** across 13 development phases. The core platform is fully implemented with all features wired end-to-end (UI + API + DB). This audit uncovered **7 gaps** between what the landing page promises users and what actually exists in code, plus several dead code paths and schema stubs that need resolution.

---

## 2. Fully Implemented Features

All features below have **frontend UI + backend API + database models** fully connected and functional:

### Authentication & Security
- Credentials login with NextAuth v4 (JWT sessions)
- User registration with email validation
- Password reset via email (1-hour token expiry)
- TOTP two-factor authentication (setup, verify, disable, QR code)
- 2FA enforcement for high-value deals (>= $1M USD)
- TOTP replay attack prevention via `UsedTotpCode` table
- Input sanitization on all API routes
- Rate limiting on auth endpoints
- File upload magic byte validation
- SHA-256 document integrity hashing

### Deal Room Management
- Deal creation with auto-incrementing deal numbers (DV-YYYY-NNNN)
- 3 quick-start templates (Gold, Diamond, Platinum)
- 8-state deal status lifecycle with validated transitions
- Deal settlement with commission auto-calculation
- Audit trail export (CSV and JSON)
- Search, filter, paginate across deals

### Multi-Party Coordination
- 6 party roles: seller, buyer, seller_mandate, buyer_mandate, seller_intermediary, buyer_intermediary
- Side-based confidentiality (sell/buy sides)
- Invite by email, accept/reject workflow
- Party-scoped document and message visibility

### Document Management
- Upload with 25MB limit, extension whitelist, magic byte validation
- SHA-256 integrity hashing per document
- Inline preview for images and PDFs
- Visibility tiers: deal-wide, side-only, private
- Download with `X-Content-Type-Options: nosniff`

### In-Deal Messaging
- Deal, side, and private visibility levels
- Real-time delivery via SSE

### Commission Ledger
- Pool-based commission with percentage validation
- Per-party commission allocation
- Auto-settlement on deal close

### Escrow Workflow (6-Phase State Machine)
- Phases: listing → documentation → buyer_review → testing → fund_blocking → fund_release → completed
- Gate conditions required before phase advancement
- Role-based approval system per phase
- TOCTOU-safe database transactions
- Verification record management (inspector, assay results)
- Escrow record state machine (pending → blocked → confirmed → released/refunded)

### Chain of Custody
- 5 checkpoints: sealed_at_refinery, in_vault (optional), transferred_to_logistics, arrived_at_delivery, received_by_buyer
- GPS geolocation capture via browser
- Photo upload with SHA-256 hashing
- Weight tracking with 0.01% variance detection
- Dual-party confirmation (seller + buyer must both confirm)
- Fund release blocked until all mandatory checkpoints confirmed

### AI Integration (5 Features)
- Deal Room Assistant (Claude Sonnet — conversational)
- Deal Risk Scoring (0-100 score with factors and recommendation)
- Anomaly Detection (weight variance, velocity, commission, new accounts)
- Smart Notification Generation (Claude Haiku — contextual summaries)
- Document Field Extraction (metadata inference — see Gap 2 below)

### Real-Time & Notifications
- Server-Sent Events (SSE) for deal room updates
- In-app notification bell with unread count
- Email notifications via Resend API (party invites, status changes, document uploads)

### Reporting & Analytics
- 5 interactive recharts charts (volume/value trend, commodity distribution, deal pipeline, cumulative commissions, deal size histogram)
- Date range filtering (30d, 90d, 6m, 12m, all)
- Reports page with summary stat cards

### Multi-Currency
- 10 currencies: USD, EUR, GBP, ZAR, CHF, AED, CNY, JPY, AUD, CAD
- Live exchange rates from frankfurter.app (1-hour cache)
- CurrencySelector component on deal creation
- CurrencyConverter widget on deal detail

### Platform Features
- Admin dashboard with platform stats, user management, role toggle
- Company profiles (CRUD with registration/tax numbers)
- User profile management (name, phone, password, 2FA)
- Dark mode with full theme support
- Mobile responsive design (sidebar overlay, card views)
- PWA (service worker, manifest, install prompt, offline fallback)
- User onboarding tour (driver.js, 7 steps)
- OpenAPI 3.0.3 documentation at `/api-docs`

### Infrastructure
- CI/CD via GitHub Actions (lint, test, build, seed)
- Docker multi-stage build with docker-compose (dev + prod)
- 46 unit tests across 7 suites (Vitest)
- PostgreSQL with Prisma ORM

---

## 3. Gaps Identified

### Gap 1: No Subscription/Billing System [CRITICAL]

**Landing page promises:** 4 pricing tiers (Prospect/Reef/Sovereign/Vault) with deal limits, seat limits, storage quotas, transaction fees, and a "7-Day Free Trial."

**Reality:** Zero enforcement exists in the codebase. No `Subscription` model in Prisma schema, no Stripe or payment processor integration, no tier middleware, no trial logic. Every registered user gets unlimited access to all features.

**Impact:** Users clicking "Start 7-Day Free Trial" encounter no trial system. Pricing promises are entirely fictional.

**Files affected:** `src/app/page.tsx` (landing page only)

### Gap 2: Document Intelligence is Metadata-Only [HIGH]

**Landing page promises:** "AI automatically extracts key fields from uploaded contracts and certificates."

**Reality:** `extractDocumentFields()` in `src/services/ai.service.ts` receives only the filename, document type, deal commodity, deal title, and party names. It asks Claude to *infer* what fields a document "probably contains" based on its name. No actual file content is read — no OCR, no PDF text extraction.

**Impact:** The feature produces guesses, not actual extraction. A document named "Gold_Assay_Report.pdf" would return inferred fields like "purity" and "weight" without reading the actual values.

**Fix:** Integrate Google Cloud Vision API for OCR, extract text from PDFs/images, then feed actual content to Claude for structured field extraction.

### Gap 3: Compliance Claims are Marketing-Only [HIGH]

**Landing page promises:** "Built for SADPMR, FICA/AML, Kimberley Process, and LBMA chain of integrity requirements."

**Reality:** No compliance enforcement, regulatory reporting, KYC validation, or certificate checking exists in the codebase. The platform creates audit trails and chain of custody records that *could support* compliance processes, but has no enforcement logic for any specific regulatory framework.

**Impact:** Users in regulated industries may expect automated compliance checking that doesn't exist.

### Gap 4: Local File Storage Doesn't Scale [HIGH]

**Current implementation:** Files are saved to local filesystem via `src/lib/storage.ts` with SHA-256 naming to `uploads/` directory.

**Problems:**
- Files don't survive Docker container restarts (unless volume-mounted)
- Cannot scale horizontally across multiple servers
- No CDN delivery for large documents
- 25MB per-file limit with no aggregate storage management

**Fix:** Migrate to Cloudflare R2 object storage with S3-compatible API.

### Gap 5: Schema Stubs Without Implementation [MEDIUM]

| Field | Issue |
|-------|-------|
| `Company.verified` / `Company.verifiedAt` | UI shows "Unverified" badge but no mechanism exists to verify companies (no admin workflow, no KYC flow) |
| `DealParty.verifiedAt` | Field exists in schema but is never set by any API route |
| `CustodyCheckpoint.videoPath` / `videoHash` | Schema supports video but upload route and UI only handle photos |

### Gap 6: Dead Code / Unwired Functions [MEDIUM]

| Function | Location | Issue |
|----------|----------|-------|
| `computeIntegrityChain()` | `src/services/custody.service.ts` | Builds structured integrity chain object but is never called from any API route or UI |
| `generateSmartNotification()` | `src/services/ai.service.ts` | Fully implemented but never called — notification service uses raw strings instead |

### Gap 7: SSE In-Memory Only [MEDIUM]

**Current:** `src/lib/sse.ts` uses an in-memory `Map` to track connected clients.

**Problem:** Incompatible with PM2 cluster mode or multi-container deployments. Only users connected to the same process receive events; users on other processes miss updates silently.

**Fix:** Implement Redis pub/sub as the SSE broadcast backbone.

---

## 4. Landing Page Accuracy Assessment

| Claim | Verdict | Notes |
|-------|---------|-------|
| "6-Phase Escrow workflow" | ACCURATE | Fully implemented |
| "5-Point Custody chain" | ACCURATE | Fully implemented |
| "Secure Deal Rooms" with SHA-256 | ACCURATE | Fully implemented |
| "AI-powered deal assistant" | ACCURATE | Requires `ANTHROPIC_API_KEY` |
| "Real-time updates" | ACCURATE | SSE implementation works (single-process) |
| "GPS Evidence" | ACCURATE | Browser geolocation capture |
| "Weight Variance Detection" | ACCURATE | 0.01% threshold |
| "Document Intelligence" | OVERSTATED | Metadata inference only, no content extraction |
| "Compliance Ready" | OVERSTATED | Audit trails exist, no enforcement logic |
| "$50M+ Deals supported" | STATIC COPY | Hardcoded string, not calculated from DB |
| "Trusted by commodity traders" | ASPIRATIONAL | No user metrics or testimonials |
| "85% Cheaper than LCs" | MARKETING | Calculation not platform-enforced |
| "Start 7-Day Free Trial" | FICTIONAL | No trial/subscription system exists |
| Pricing tiers with limits | FICTIONAL | No billing system exists |

---

## 5. API Route Coverage (43 Routes)

All 43 API routes are fully functional and wired to their corresponding UI:

- **Auth:** 6 routes (login, register, forgot-password, reset-password, two-factor, verify-2fa)
- **Deals:** 17 routes (CRUD, messages, parties, timeline, commission, settle, export, events, assistant, risk, anomalies)
- **Workflow:** 5 routes (workflow CRUD, approvals, verification, escrow)
- **Custody:** 4 routes (initiate, checkpoints, confirm, photo upload)
- **Documents:** 3 routes (upload, list, download/preview)
- **Other:** 8 routes (profile, companies, notifications, activity, reports, exchange-rates, admin stats, admin users)

---

## 6. Test Coverage Assessment

**Current:** 46 unit tests across 7 suites (all passing)

| Suite | Tests | Coverage |
|-------|-------|----------|
| Status transitions | 8 | State machine validation |
| Storage | 10 | File validation, save, path safety |
| Rate limiting | 4 | Token bucket logic |
| Sanitization | 6 | HTML stripping, object sanitization |
| Magic bytes | 7 | File type detection |
| SSE | 6 | Client management, broadcast |
| Email templates | 5 | HTML template generation |

**Missing:**
- No integration tests (API route testing)
- No E2E tests (browser-based user flows)
- No workflow/custody service tests
- No AI service tests (mocked)

---

## 7. Recommendations (Priority Order)

| Priority | Action | Effort |
|----------|--------|--------|
| P0 | Fix landing page copy to match reality (pricing, compliance, doc intelligence) | Low |
| P1 | Implement Cloudflare R2 object storage | Medium |
| P1 | Implement Google Cloud Vision + real document intelligence | Medium |
| P1 | Build subscription/billing system (Stripe) | High |
| P2 | Build compliance module | High |
| P2 | Implement company/party verification workflows | Medium |
| P2 | Add video evidence upload support | Low |
| P2 | Wire dead code (`generateSmartNotification`, `computeIntegrityChain`) | Low |
| P3 | SSE scaling with Redis pub/sub | Medium |
| P3 | Webhook integrations (Slack/Teams) | Medium |
| P3 | E2E and integration tests | Medium |
| P3 | Dynamic trust metrics on landing page | Low |

---

*This audit was conducted by analyzing every file in the codebase, cross-referencing all documentation, and verifying each feature end-to-end.*
