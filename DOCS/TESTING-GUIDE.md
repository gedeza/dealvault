# DealVault — Manual Testing Guide

This guide provides two realistic commodity deal scenarios to test the full application flow: creating deals, managing companies, inviting parties, uploading documents, sending messages, and progressing deal status.

## Prerequisites

1. App running at `http://localhost:3000`
2. Database seeded: `npm run db:seed`

### Seed Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@dealvault.co.za | password123 | Admin |
| seller@example.com | password123 | Seller |
| buyer@example.com | password123 | Buyer |
| broker@example.com | password123 | Intermediary |
| mandate@example.com | password123 | Buyer Mandate |

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

### 2.7 — Progress Status

| From | To |
|------|----|
| Draft | Documents Pending |

**Verify:** Status updated, notifications sent.

---

## Cross-Account Verification

### As broker@example.com

1. Login and check **Dashboard** for pending invitations on both deals
2. Accept both invitations
3. Verify you can see **Deal** visibility messages but NOT **Side** or **Private** messages from other sides
4. Verify documents with **Side** visibility from seller are hidden
5. Send a message on each deal to confirm messaging works

### As mandate@example.com

1. Login and accept invitation on Deal 1
2. Verify correct side assignment (buy side)
3. Confirm visibility filtering — should see buy-side messages only

### As admin@dealvault.co.za

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

### Deal Detail
- [ ] Overview tab shows all deal info
- [ ] Status transitions restricted to valid options
- [ ] Parties tab: invite, accept, reject
- [ ] Documents tab: upload, download, preview (images/PDFs)
- [ ] Messages tab: send with visibility levels
- [ ] Timeline tab: shows chronological events
- [ ] Commission tab: add/edit commission splits

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

## Document Types Reference

These are the standard commodity trade documents referenced in this guide:

| Abbreviation | Full Name | Purpose |
|-------------|-----------|---------|
| SPA | Sale Purchase Agreement | Primary contract between buyer and seller |
| NCNDA | Non-Circumvention, Non-Disclosure Agreement | Protects intermediaries from being bypassed |
| IMFPA | Irrevocable Master Fee Protection Agreement | Guarantees commission payments to intermediaries |
| BCL | Bank Comfort Letter | Bank confirms buyer's financial capability |
| POF | Proof of Funds | Evidence of available funds for the transaction |
| KYC | Know Your Customer | Identity and compliance documentation |
| KP | Kimberley Process Certificate | Conflict-free diamond certification |

---

*DealVault Testing Guide v1.0 — March 2026*
