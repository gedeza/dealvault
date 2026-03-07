# DealVault — Project Proposal

**Prepared by:** Nhlanhla Mnyandu, ISU Tech
**Client:** Internal Product
**Date:** March 2026
**Version:** 1.0

---

## 1. Executive Summary

DealVault is a secure, web-based deal room platform purpose-built for managing multi-party commodity transactions. It enables brokers, mandates, sellers, and buyers to collaborate on high-value deals (gold, diamonds, platinum) through structured workflows, verified document exchange, commission tracking, and immutable audit trails.

The platform addresses a significant gap in the commodity trading market where no existing solution provides intermediary-focused deal management with commission ledger enforcement, multi-party visibility controls, and document integrity verification — all at pricing accessible to individual brokers and small trading firms.

**Investment:** Internal development by ISU Tech
**Timeline:** MVP delivered March 2026
**Target Launch:** Q2 2026 (South Africa, pilot users)

---

## 2. Business Case

### 2.1 The Opportunity

The commodity intermediary market in Africa represents thousands of brokers and mandate holders facilitating deals worth billions annually. These intermediaries currently rely on WhatsApp, email, and spreadsheets — losing deals to miscommunication, losing commissions to circumvention, and losing credibility to document fraud.

### 2.2 Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | R0/month | 3 active deals, 5 documents per deal, 2 companies |
| **Professional** | R499/month (~$27 USD) | Unlimited deals, 50 documents per deal, 10 companies, email notifications |
| **Business** | R1,499/month (~$82 USD) | Unlimited everything, priority support, API access, custom branding |
| **Enterprise** | Custom | On-premise deployment, SSO, dedicated support, SLA |

### 2.3 Revenue Projections

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Free users | 500 | 2,000 | 5,000 |
| Paid users (Professional) | 50 | 250 | 800 |
| Paid users (Business) | 10 | 50 | 200 |
| Enterprise contracts | 0 | 2 | 5 |
| **Monthly Recurring Revenue** | **R39,940** | **R199,250** | **R698,200** |
| **Annual Revenue** | **R479,280** | **R2,391,000** | **R8,378,400** |

*Assumptions: 10% free-to-paid conversion, 5% monthly churn, 20% annual growth in paid base.*

### 2.4 Cost Structure

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Cloud hosting (Hetzner/AWS) | R2,000-R8,000 | Scales with users |
| Domain + SSL | R100 | Annual renewal |
| Email service (Resend) | R0-R500 | Free tier covers early stage |
| Monitoring (Sentry, Uptime) | R0-R1,000 | Free tiers available |
| **Total Fixed Costs** | **R2,100-R9,500** | |

Break-even: ~6 Professional subscribers cover minimum hosting costs.

---

## 3. Product Scope

### 3.1 Core Features (MVP — Delivered)

| Feature | Description | Status |
|---------|-------------|--------|
| **User Authentication** | Email/password with JWT sessions | Complete |
| **Two-Factor Authentication** | TOTP-based with QR code setup, replay prevention | Complete |
| **Password Recovery** | Token-based reset with 1-hour expiry | Complete |
| **Deal Room Creation** | Create deals with commodity, quantity, value, currency, commission pool | Complete |
| **Deal Status Lifecycle** | 8-state machine: draft to closed/cancelled with enforced transitions | Complete |
| **Multi-Party Management** | Invite sellers, buyers, mandates, intermediaries with side assignment | Complete |
| **Party Accept/Reject** | Invited users accept or reject with optional company assignment | Complete |
| **Document Upload** | File validation (type whitelist, magic bytes, 25MB limit), SHA-256 hashing | Complete |
| **Document Download/Preview** | Inline preview for images and PDFs, download with access control | Complete |
| **Visibility Controls** | Three levels: deal-wide, side-only, private — enforced on documents and messages | Complete |
| **In-Deal Messaging** | Real-time messaging within deal rooms with visibility levels | Complete |
| **Commission Ledger** | Track commission splits per party with pool validation (total cannot exceed pool %) | Complete |
| **Timeline & Audit Trail** | Every action logged: status changes, uploads, messages, party actions | Complete |
| **Audit Export** | Download timeline as CSV or JSON for compliance and dispute resolution | Complete |
| **Dashboard Analytics** | Stats cards, status distribution, commodity value breakdown, activity feed | Complete |
| **Company Management** | CRUD for user companies with registration/tax numbers | Complete |
| **Notification System** | In-app notifications with bell icon, unread count, mark-as-read | Complete |
| **Email Notifications** | Party invitations, status changes, password resets via Resend API | Complete |
| **Admin Dashboard** | Platform stats, user management, role administration | Complete |
| **Role-Based Access Control** | User and admin roles with route-level enforcement | Complete |
| **Dark Mode** | Full theme support across all pages | Complete |
| **Mobile Responsive** | Card-based views for tables, touch-friendly interactions | Complete |
| **API Documentation** | Interactive OpenAPI spec viewer at /api-docs | Complete |

### 3.2 Future Features (Post-MVP)

| Feature | Priority | Description |
|---------|----------|-------------|
| Real-time updates | High | WebSocket/SSE for live deal room updates |
| Deal settlement workflow | High | Guided settlement process with checklists |
| Email notifications (expanded) | High | Daily digest, deal activity summaries |
| PostgreSQL migration | High | Production database with connection pooling |
| Document e-signatures | Medium | Integrated signing for SPA, NCNDA, IMFPA |
| Multi-language support | Medium | Afrikaans, French (DRC/West Africa), Arabic (UAE) |
| Mobile app (PWA) | Medium | Installable progressive web app |
| Blockchain audit trail | Low | Immutable transaction log on-chain |
| AI document analysis | Low | Auto-classify uploaded documents, flag anomalies |
| White-label option | Low | Custom branding for enterprise clients |

---

## 4. Technical Architecture

### 4.1 Stack Overview

```
                    ┌─────────────────────────────┐
                    │          Client              │
                    │  React 19 + TypeScript        │
                    │  TailwindCSS v4 + shadcn/ui  │
                    └──────────┬──────────────────┘
                               │
                    ┌──────────▼──────────────────┐
                    │       Next.js 16             │
                    │    App Router + API Routes   │
                    │    Proxy (Rate Limiting)     │
                    └──────────┬──────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌──────▼──────┐ ┌───────▼───────┐
    │   NextAuth v4  │ │  Prisma ORM │ │  File Storage │
    │  JWT + TOTP    │ │  SQLite/PG  │ │  Local/S3     │
    └────────────────┘ └─────────────┘ └───────────────┘
```

### 4.2 Data Model

```
User ──┬── Company
       ├── DealParty ──── CommissionLedger
       ├── Deal (creator)
       ├── Document
       ├── Message
       ├── DealTimeline
       ├── Notification
       ├── PasswordReset
       └── UsedTotpCode

Deal ──┬── DealParty ──── Company (optional)
       ├── Document
       ├── Message
       ├── DealTimeline
       └── CommissionLedger
```

### 4.3 Security Architecture

| Layer | Implementation |
|-------|---------------|
| **Authentication** | bcryptjs password hashing (12 rounds), JWT sessions |
| **Two-Factor** | TOTP (RFC 6238) with QR provisioning, replay attack prevention |
| **Authorisation** | Session-based route protection, role checks (user/admin) |
| **Rate Limiting** | Per-IP buckets: auth (10/15min), API (60/min), upload (10/min) |
| **Input Validation** | Zod schemas on all API boundaries |
| **Input Sanitisation** | HTML tag stripping, entity decoding on all text inputs |
| **File Validation** | Extension whitelist + MIME type + magic byte verification |
| **Document Integrity** | SHA-256 hash computed at upload, stored for verification |
| **Visibility Enforcement** | Server-side filtering on messages and documents by deal/side/private |
| **Security Headers** | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy |
| **CSRF Protection** | All mutating routes require authenticated session |
| **Environment Validation** | NEXTAUTH_SECRET enforced in production |

### 4.4 Deal Status State Machine

```
          ┌──────────────────────────────────────────────────────────┐
          │                                                          │
          ▼                                                          │
       ┌───────┐    ┌────────────────┐    ┌──────────────┐    ┌──────────┐
       │ Draft │───▶│ Documents      │───▶│ Under Review │───▶│ Verified │
       └───┬───┘    │ Pending        │    └──────┬───────┘    └────┬─────┘
           │        └───────┬────────┘           │                 │
           │                │                    │                 │
           │                │                    │                 ▼
           │                │                    │          ┌─────────────┐
           │                │                    │          │ In Progress │
           │                │                    │          └──────┬──────┘
           │                │                    │                 │
           │                │                    │                 ▼
           │                │                    │          ┌─────────────┐
           │                │                    │          │  Settled    │
           │                │                    │          └──────┬──────┘
           │                │                    │                 │
           │                │                    │                 ▼
           │                │                    │          ┌─────────────┐
           │                │                    │          │   Closed    │
           │                │                    │          └─────────────┘
           │                │                    │
           ▼                ▼                    ▼
       ┌─────────────────────────────────────────────┐
       │                 Cancelled                    │
       └─────────────────────────────────────────────┘
```

**Transition Rules:**
- Only the deal creator can change status
- Transitions are validated server-side against the state machine
- Each transition is logged in the timeline with timestamp and user
- All deal parties are notified on status change
- Settlement requires all parties to have accepted their invitations

### 4.5 Infrastructure

| Component | Development | Production |
|-----------|-------------|------------|
| Runtime | Node.js 20+ | Docker (multi-stage build) |
| Database | SQLite (file-based) | PostgreSQL 16 (containerised) |
| File Storage | Local filesystem (/uploads) | Local / S3 (future) |
| Email | Console logging | Resend API |
| CI/CD | GitHub Actions | Lint → Test → Build → Seed |
| Deployment | npm run dev | docker compose up |

---

## 5. User Flows

### 5.1 Deal Creation Flow

```
Broker logs in
  → Dashboard (sees stats, pending invites, recent activity)
  → "New Deal Room" button
  → Fills: title, commodity, quantity, unit, value, currency, commission %
  → (Optional) selects quick-start template (Gold, Diamond, Platinum)
  → Deal created in "Draft" status
  → Broker auto-added as seller party
  → Redirected to deal detail page
```

### 5.2 Party Invitation Flow

```
Deal creator opens deal
  → Parties tab → "Invite Party"
  → Enters email, selects role (seller/buyer/mandate/intermediary)
  → System auto-assigns side (sell/buy) based on role
  → Notification sent to invited user (in-app + email)
  → Invited user logs in → sees pending invitation on dashboard
  → Accepts (optionally assigns company) or rejects
  → Timeline logs the action
```

### 5.3 Document Exchange Flow

```
Party opens deal → Documents tab
  → "Upload Document" → selects file
  → Client validates: file type, size (< 25MB)
  → Server validates: extension, MIME type, magic bytes
  → File saved with SHA-256 hash as filename
  → Document record created with visibility setting
  → Other parties see document (filtered by visibility)
  → Any party can download or preview (images/PDFs inline)
```

### 5.4 Deal Progression Flow

```
Creator reviews deal completeness
  → Changes status: Draft → Documents Pending
  → Parties upload required documents
  → Creator reviews → Documents Pending → Under Review
  → Verification process → Under Review → Verified
  → Execution begins → Verified → In Progress
  → All deliverables met → creator triggers settlement
  → System validates: all parties accepted, commission entries exist
  → Status: In Progress → Settled
  → Final close: Settled → Closed
```

---

## 6. Deployment Strategy

### 6.1 Phase 1 — Pilot (Q2 2026)

- Deploy on Hetzner Cloud (Cape Town region) or DigitalOcean
- 10-20 pilot users from personal network (brokers in Johannesburg)
- Gather feedback on core workflows
- Monitor performance, fix critical issues

### 6.2 Phase 2 — Soft Launch (Q3 2026)

- Open registration with free tier
- Marketing through commodity trading WhatsApp groups and LinkedIn
- Onboard first paying customers (Professional tier)
- Add real-time updates (WebSocket)

### 6.3 Phase 3 — Growth (Q4 2026 - Q1 2027)

- Expand to Tanzania and Botswana markets
- Launch Business tier with API access
- Integrate document e-signatures
- Build mobile PWA

### 6.4 Phase 4 — Scale (2027+)

- Enterprise tier with on-premise option
- Multi-language support
- AI-powered document analysis
- Blockchain audit trail option
- Seek angel/seed funding if traction warrants

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Low user adoption | Medium | High | Free tier lowers barrier; focus on WhatsApp-to-DealVault migration path |
| Competing product enters market | Low | Medium | First-mover advantage; deep domain specificity |
| Document storage costs | Medium | Low | S3-compatible storage; enforce file size limits |
| Regulatory compliance | Medium | Medium | Consult legal on POPIA (SA), data residency requirements |
| Security breach | Low | Critical | 2FA, rate limiting, input validation, security headers, regular audits |
| User expects mobile app | High | Medium | PWA capability planned; responsive design already implemented |
| Commission disputes despite platform | Medium | Low | Immutable audit trail provides evidence; platform is record-keeper, not arbitrator |

---

## 8. Success Metrics

| Metric | Target (6 months) | Target (12 months) |
|--------|-------------------|---------------------|
| Registered users | 200 | 1,000 |
| Active deals (monthly) | 50 | 300 |
| Paid subscribers | 20 | 100 |
| Monthly Recurring Revenue | R15,000 | R50,000 |
| Deal value processed | R50M | R500M |
| User retention (monthly) | 60% | 75% |
| NPS score | 30+ | 50+ |
| Uptime | 99.5% | 99.9% |

---

## 9. Team

| Role | Person | Responsibility |
|------|--------|----------------|
| Product Owner & Developer | Nhlanhla Mnyandu | Architecture, development, deployment |
| Company | ISU Tech | Business entity, hosting, support |

Future hires (post-revenue):
- Frontend developer (UI/UX polish, mobile PWA)
- Customer success (onboarding, support)
- Sales (enterprise accounts, partnerships)

---

## 10. Conclusion

DealVault fills a genuine market gap in the commodity trading intermediary space. The MVP is feature-complete with robust security, multi-party deal management, commission tracking, and document verification. The platform is technically sound (Next.js 16, React 19, Prisma, Docker) and ready for pilot deployment.

The immediate next steps are:

1. Deploy to production infrastructure
2. Onboard 10-20 pilot users from existing broker networks
3. Iterate based on feedback
4. Launch free tier for organic growth
5. Convert engaged users to paid plans

The commodity trading industry is ready for purpose-built tooling. DealVault is positioned to become the standard platform for deal room management in African commodity markets.

---

**Approved by:**

_________________________
Nhlanhla Mnyandu
Managing Director, ISU Tech
nhlanhla@isutech.co.za

---

*ISU Tech — Project Proposal*
*Confidential — For Internal Use Only*
