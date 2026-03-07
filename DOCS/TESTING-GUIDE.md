# DealVault — Manual Testing Guide

This guide provides realistic commodity deal scenarios to test the full application flow: creating deals, managing companies, inviting parties, uploading documents, sending messages, progressing deal status, enabling escrow workflows, and chain of custody tracking.

## Prerequisites

1. App running at `https://dealvault.isutech.co.za` (production) or `http://localhost:3000` (local)
2. Database seeded: `npm run db:seed`

### Seed Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@dealvault.co.za | password123 | Admin |
| seller@example.com | password123 | Seller (James van der Merwe) |
| buyer@example.com | password123 | Buyer (Sarah Ndlovu) |
| broker@example.com | password123 | Intermediary (Ahmed Patel) |
| mandate@example.com | password123 | Buyer Mandate (Lindiwe Dlamini) |

### Seed Deals

| Deal # | Title | Commodity | Value | Status |
|--------|-------|-----------|-------|--------|
| DV-2026-0001 | Gold Bullion Purchase - 25kg AU 999.9 | Gold | USD 1,750,000 | Documents Pending |
| DV-2026-0002 | Rough Diamonds - 500 carats | Diamonds | USD 2,500,000 | Draft |
| DV-2026-0003 | Platinum Sponge Export - 100kg | Platinum | USD 3,200,000 | Under Review |
| DV-2026-0004 | Tanzanite Rough Stones - 200 carats | Tanzanite | USD 980,000 | Documents Pending |

---

## Deal 1: Tanzania Gold Bullion Export

### 1.1 — Login & Create Company

Login as **seller@example.com** and navigate to **Companies**.

| Field | Value |
|-------|-------|
| Name | Arusha Gold Mining Ltd |
| Registration # | TZ-2024-MNG-0847 |
| Tax # | TIN-128-456-903 |
| Country | Other |

**Verify:** Company appears in the table with "Unverified" badge.

---

### 1.2 — Create Deal

Navigate to **Deal Rooms** > **New Deal Room**.

| Field | Value |
|-------|-------|
| Title | Tanzania AU Bullion — March 2026 Shipment |
| Commodity | Gold |
| Quantity | 500 |
| Unit | kg |
| Deal Value | 38500000 |
| Currency | USD |
| Commission Pool (%) | 2.5 |

**Verify:** Deal created with status "Draft" and deal number format DV-2026-XXXX.

---

### 1.3 — Invite Parties

Open the deal and go to the **Parties** tab.

| Email | Role |
|-------|------|
| buyer@example.com | Buyer |
| broker@example.com | Intermediary |
| mandate@example.com | Mandate |

**Verify:** Each party shows status "Invited" with correct role and side assignment (buy/sell).

---

### 1.4 — Upload Documents

Go to the **Documents** tab and upload files.

| Document Type | File | Visibility |
|--------------|------|------------|
| SPA (Sale Purchase Agreement) | Any PDF | Deal (visible to all) |
| BCL (Bank Comfort Letter) | Any PDF | Side (visible to sell side only) |
| POF (Proof of Funds) | Any image (JPG/PNG) | Private (visible to uploader only) |

**Verify:**
- Files upload successfully with SHA-256 hash displayed
- File size shown correctly
- Visibility badges match selection
- Image files show preview button

---

### 1.5 — Send Messages

Go to the **Messages** tab and send the following.

| # | Message | Visibility |
|---|---------|-----------|
| 1 | SPA draft v2 uploaded for review. Buyer to confirm tonnage allocation by Friday. | Deal |
| 2 | Seller confirmed CIF Dar es Salaam port. Assay reports from SGS available on request. | Side |
| 3 | Broker — please verify the mandate chain before we move to under_review. | Private |

**Verify:**
- Messages appear with correct visibility badges
- Timeline shows "message_sent" events

---

### 1.6 — Progress Status

From the deal overview, update the status.

| From | To |
|------|----|
| Draft | Documents Pending |
| Documents Pending | Under Review |

**Verify:**
- Only valid transitions are shown as options
- Timeline logs each status change
- Notifications sent to all parties

---

### 1.7 — Enable Escrow Workflow

From the deal header, click **"Enable Escrow Workflow"**.

**Verify:**
- Confirm dialog appears explaining what will be activated
- After confirming, two new tabs appear: **Workflow** and **Custody**
- The **WorkflowStepper** appears above the tabs showing 6 phases
- Current phase is "Listing" (Phase 1)
- The deal's `workflowPhase` is set in the database

---

### 1.8 — Escrow Workflow Phases

Navigate to the **Workflow** tab to test phase progression.

#### Phase 1: Listing
- Deal is listed, parties are being assembled
- **Action:** As seller, click **"Advance to Documentation"**
- **Verify:** Phase stepper updates to show Phase 2 active

#### Phase 2: Documentation
- All required documents must be uploaded
- **Gate:** At least one document must exist
- **Action:** Upload a document if not already done, then advance
- **Verify:** Phase gate requirements shown if not met

#### Phase 3: Buyer Review
- Buyer reviews and approves documentation
- **Action:** Login as **buyer@example.com**, navigate to the deal's Workflow tab
- Click **"Approve"** to submit phase approval
- **Verify:** Approval badge appears with buyer's name and role

#### Phase 4: Testing & Verification
- Intermediary records test/assay results
- **Action:** Login as **broker@example.com**, navigate to the deal's Workflow tab
- The **VerificationPanel** shows an editable form for the intermediary:

| Field | Value |
|-------|-------|
| Location / Refinery | Rand Refinery, Germiston |
| Result | Passed |
| Inspector Name | Dr. M. Govender |
| Inspector Company | SGS South Africa |
| Findings | AU 999.9 purity confirmed. Weight: 500.02kg. No impurities detected. |

- **Verify:**
  - Intermediary sees the editable form
  - Other roles see read-only view
  - Result badge shows (Passed/Failed/Conditional)

#### Phase 5: Fund Blocking
- Buyer's funds are blocked in escrow
- **Action (as buyer):** In the **EscrowStatusCard**, click **"Block Funds"**
- **Action (as seller):** Click **"Confirm Receipt"** to acknowledge fund block
- **Verify:**
  - Escrow status progresses: Pending -> Blocked -> Confirmed
  - 4-step progress indicator updates
  - Only authorized roles see action buttons

#### Phase 6: Fund Release
- **Gate:** Chain of custody must be complete before funds release
- See Section 1.9 for custody completion
- **Action:** After custody is complete, click **"Release Funds"**
- **Verify:** Deal moves to settled/closed state

---

### 1.9 — Chain of Custody Tracking

Navigate to the **Custody** tab.

#### Initiate Custody

Click **"Initiate Custody Tracking"** button.

| Field | Value |
|-------|-------|
| Seal ID | DV-2026-001-C001 |
| Custodian Name | Rand Refinery |
| Custodian Type | Refinery |
| Custodian Contact | +27 11 418 9000 |

**Verify:**
- Custody log created with seal ID displayed
- 5 default checkpoints appear:
  1. Origin Sampling
  2. Testing / Assay
  3. Storage / Vault
  4. Transit
  5. Delivery

#### Submit Checkpoint Evidence

Expand **"Origin Sampling"** (Checkpoint 1) and fill the evidence form:

| Field | Value |
|-------|-------|
| Location | Merelani Hills, Arusha |
| GPS | Click the location pin button to capture (or enter manually) |
| Seal Intact? | Yes - Intact |
| Weight | 500.02 |
| Weight Unit | kg |
| Photo Evidence | Upload a JPG/PNG image |
| Notes | Initial sampling at mine site. Serial: ARS-2026-0847. |

**Verify:**
- GPS coordinates captured from browser geolocation
- Photo uploaded successfully
- Evidence details appear in the checkpoint card
- Submitted by user name and timestamp shown

#### Confirm Checkpoint (Dual-Party)

After evidence is submitted, the **other side** must confirm.

- **Action (as buyer@example.com):** Open the deal's Custody tab
- Expand the checkpoint with submitted evidence
- Click **"Confirm"** to verify, or **"Dispute"** to raise an issue

**Verify:**
- Confirmation badge appears (S for sell-side, B for buy-side)
- Both sides must confirm for a checkpoint to be marked complete
- Green checkmark appears when checkpoint is complete
- If disputed: red alert triangle, dispute reason displayed

#### Weight Variance Detection

Submit evidence on a later checkpoint (e.g., "Delivery") with a different weight:

| Field | Value |
|-------|-------|
| Weight | 499.80 |
| Weight Unit | kg |

**Verify:** System auto-flags weight variance if difference exceeds 0.01% threshold.

#### Complete All Mandatory Checkpoints

Repeat the evidence submission and dual-party confirmation for all 5 checkpoints.

**Verify:**
- Progress counter updates: "X of 5 mandatory checkpoints verified"
- When all mandatory checkpoints are complete, the fund release gate is satisfied
- Returning to Workflow tab, the "Release Funds" button becomes available

---

## Deal 2: Botswana Rough Diamond Allocation

### 2.1 — Login & Create Company

Login as **buyer@example.com** and navigate to **Companies**.

| Field | Value |
|-------|-------|
| Name | Cape Diamond Traders (Pty) Ltd |
| Registration # | ZA-2019-CK-441827 |
| Tax # | 9150248163 |
| Country | South Africa |

**Verify:** Company appears in the table alongside any existing companies.

---

### 2.2 — Accept Invitation on Deal 1

Before creating Deal 2, navigate to **Dashboard** or **Deal Rooms**.

**Verify:**
- Pending invitation for "Tanzania AU Bullion" is visible
- Click to open deal, accept the invitation
- Optionally assign "Cape Diamond Traders (Pty) Ltd" as company
- Party status changes from "Invited" to "Accepted"
- Timeline logs the acceptance

---

### 2.3 — Create Deal

Navigate to **Deal Rooms** > **New Deal Room**.

| Field | Value |
|-------|-------|
| Title | Botswana Rough Diamonds — Q2 Allocation |
| Commodity | Diamonds |
| Quantity | 2500 |
| Unit | carats |
| Deal Value | 4750000 |
| Currency | USD |
| Commission Pool (%) | 3 |

**Verify:** Deal created with status "Draft".

---

### 2.4 — Invite Parties

Open the deal and go to the **Parties** tab.

| Email | Role |
|-------|------|
| seller@example.com | Seller |
| broker@example.com | Intermediary |

**Verify:** Parties appear with status "Invited".

---

### 2.5 — Upload Documents

Go to the **Documents** tab and upload files.

| Document Type | File | Visibility |
|--------------|------|------------|
| NCNDA (Non-Circumvention Agreement) | Any PDF | Deal |
| IMFPA (Irrevocable Master Fee Protection) | Any PDF | Deal |
| KYC Pack | Any image or document | Side |

**Verify:**
- All uploads succeed with type and size validation
- Visibility filtering works correctly

---

### 2.6 — Send Messages

Go to the **Messages** tab and send the following.

| # | Message | Visibility |
|---|---------|-----------|
| 1 | NCNDA signed by both principals. Awaiting KP certificate from Gaborone before shipping. | Deal |
| 2 | Valuation based on March 2026 Rapaport list. Sight allocation confirmed by De Beers. | Side |
| 3 | Commission split: 1.5% broker, 1% buyer mandate, 0.5% facilitator. Please confirm. | Deal |

**Verify:**
- Messages display with correct visibility
- Timeline updated

---

### 2.7 — Progress Status & Enable Workflow

| From | To |
|------|----|
| Draft | Documents Pending |

Then click **"Enable Escrow Workflow"** and test the same workflow phases as Deal 1.

**Verify:** Status updated, notifications sent, workflow tabs appear.

---

## Cross-Account Verification

### As broker@example.com (Intermediary)

1. Login and check **Dashboard** for pending invitations on both deals
2. Accept both invitations
3. Verify you can see **Deal** visibility messages but NOT **Side** or **Private** messages from other sides
4. Verify documents with **Side** visibility from seller are hidden
5. Send a message on each deal to confirm messaging works
6. Navigate to **Workflow** tab — verify the **VerificationPanel** shows editable form (intermediary-only)
7. Submit test results on the VerificationPanel
8. Verify other roles see read-only view of your test results

### As mandate@example.com (Buyer Mandate)

1. Login and accept invitation on Deal 1
2. Verify correct side assignment (buy side)
3. Confirm visibility filtering — should see buy-side messages only
4. Navigate to **Custody** tab — verify you can confirm checkpoints (as buy-side party)
5. Try to dispute a checkpoint and verify dispute reason is required

### As admin@dealvault.co.za (Admin)

1. Login and navigate to **Admin** dashboard
2. **Verify platform stats:**
   - Total users count includes all seed + test accounts
   - Total deals includes both new deals plus seeded deals
   - Total deal value reflects all deals combined
3. **Verify user management:**
   - All accounts visible in user list
   - Role toggle works (do not change roles on test accounts)
4. **Verify deal visibility:**
   - Admin can see all deals in the deals list
   - Status distribution chart reflects current statuses

---

## Feature Checklist

Use this checklist to track testing progress.

### Authentication
- [ ] Login with valid credentials
- [ ] Login rejection with wrong password
- [ ] Registration of new account
- [ ] Forgot password flow (check dev console for reset token)
- [ ] Two-factor authentication setup (Profile > 2FA)

### Dashboard
- [ ] Stats cards show correct counts
- [ ] Pending invitations section visible when invites exist
- [ ] Status distribution chart renders
- [ ] Commodity value breakdown displays
- [ ] Recent deals grid shows latest deals
- [ ] Activity feed shows recent timeline events

### Deal Rooms
- [ ] Search by deal title or number
- [ ] Filter by status
- [ ] Filter by commodity
- [ ] Pagination works
- [ ] Mobile card view renders on small screens

### Deal Detail — Core
- [ ] Overview tab shows all deal info
- [ ] Status transitions restricted to valid options
- [ ] Parties tab: invite, accept, reject
- [ ] Documents tab: upload, download, preview (images/PDFs)
- [ ] Messages tab: send with visibility levels
- [ ] Timeline tab: shows chronological events
- [ ] Commission tab: add/edit commission splits

### Deal Detail — Escrow Workflow
- [ ] "Enable Escrow Workflow" button visible on deals without workflow
- [ ] Confirm dialog before enabling
- [ ] WorkflowStepper renders above tabs (horizontal on desktop, vertical on mobile)
- [ ] Workflow tab appears after enabling
- [ ] Custody tab appears after enabling
- [ ] Phase 1 (Listing) — seller can advance
- [ ] Phase 2 (Documentation) — gate checks for documents
- [ ] Phase 3 (Buyer Review) — buyer can approve/reject
- [ ] Phase 4 (Testing) — intermediary can submit verification results
- [ ] Phase 5 (Fund Blocking) — buyer blocks funds, seller confirms
- [ ] Phase 6 (Fund Release) — gated by custody completion
- [ ] Phase approvals show with user name, role, timestamp
- [ ] Terminal states (settled, cancelled, disputed) show banner and disable actions
- [ ] Only authorized roles see action buttons for each phase

### Escrow Management
- [ ] EscrowStatusCard shows 4-step progress indicator
- [ ] Pending -> Blocked transition (buyer action)
- [ ] Blocked -> Confirmed transition (seller action)
- [ ] Confirmed -> Released transition (gated by custody)
- [ ] Refund flow works when dispute raised
- [ ] Role-based action buttons (buyer blocks, seller confirms, intermediary releases)

### Chain of Custody
- [ ] "Initiate Custody Tracking" modal opens with seal ID field
- [ ] Custodian name, type, contact fields work
- [ ] 5 default checkpoints created automatically
- [ ] Checkpoint cards show sequence numbers and labels
- [ ] Evidence submission form: location, GPS, seal intact, weight, photo, notes
- [ ] GPS capture via browser geolocation API
- [ ] Photo upload (JPEG, PNG, WEBP accepted)
- [ ] Photo SHA-256 hash recorded for tamper detection
- [ ] Submitted evidence shows in checkpoint details
- [ ] Dual-party confirmation: both sides must confirm
- [ ] Confirm button available only to opposite side (not submitter)
- [ ] Dispute flow: requires reason text
- [ ] Dispute shows red alert with reason
- [ ] Checkpoint marked complete when both sides confirm
- [ ] Progress counter: "X of Y mandatory checkpoints verified"
- [ ] Weight variance auto-detection (>0.01% threshold)
- [ ] Fund release blocked until all mandatory checkpoints verified

### Companies
- [ ] Create company with all fields
- [ ] Edit existing company
- [ ] Delete company (blocked if linked to active deal)

### Profile
- [ ] View profile stats
- [ ] Update name and phone
- [ ] Change password (requires current password)
- [ ] Enable/disable 2FA

### Notifications
- [ ] Bell icon shows unread count
- [ ] Dropdown lists recent notifications
- [ ] Mark individual as read
- [ ] Mark all as read

### Admin (admin account only)
- [ ] Platform stats display
- [ ] User list with search
- [ ] Role toggle (user/admin)
- [ ] Admin link hidden for non-admin users

### Dark Mode
- [ ] Toggle theme via header button
- [ ] All pages render correctly in both themes

---

## Workflow Roles Reference

| Party Role | Workflow Role | Side | Key Actions |
|-----------|-------------|------|-------------|
| Seller | seller | sell | Advance phases, confirm fund block |
| Buyer | buyer | buy | Approve reviews, block funds |
| Seller's Intermediary | intermediary | sell | Submit test results, release funds |
| Buyer's Intermediary | intermediary | buy | Submit test results, release funds |
| Seller's Mandate | broker | sell | Approve phases |
| Buyer's Mandate | broker | buy | Approve phases |

## Escrow Workflow Phases

| # | Phase | Triggered By | Gates |
|---|-------|-------------|-------|
| 1 | Listing | seller | — |
| 2 | Documentation | seller | At least 1 document uploaded |
| 3 | Buyer Review | buyer | Buyer phase approval submitted |
| 4 | Testing & Verification | intermediary | Verification result recorded |
| 5 | Fund Blocking | buyer | Escrow status = confirmed |
| 6 | Fund Release | intermediary | All mandatory custody checkpoints verified |

## Chain of Custody Checkpoints

| # | Checkpoint | Type | Mandatory |
|---|-----------|------|-----------|
| 1 | Origin Sampling | origin | Yes |
| 2 | Testing / Assay | testing | Yes |
| 3 | Storage / Vault | storage | Yes |
| 4 | Transit | transit | Yes |
| 5 | Delivery | delivery | Yes |

## Document Types Reference

These are the standard commodity trade documents referenced in this guide:

| Abbreviation | Full Name | Purpose |
|-------------|-----------|---------|
| SPA | Sale Purchase Agreement | Primary contract between buyer and seller |
| NCNDA | Non-Circumvention, Non-Disclosure Agreement | Protects intermediaries from being bypassed |
| IMFPA | Irrevocable Master Fee Protection Agreement | Guarantees commission payments to intermediaries |
| BCL | Bank Comfort Letter | Bank confirms buyer's financial capability |
| POF | Proof of Funds | Evidence of available funds for the transaction |
| FCO | Full Corporate Offer | Seller's formal offer with terms |
| ICPO | Irrevocable Corporate Purchase Order | Buyer's formal commitment to purchase |
| KYC | Know Your Customer | Identity and compliance documentation |
| KP | Kimberley Process Certificate | Conflict-free diamond certification |

---

*DealVault Testing Guide v2.0 — March 2026*
