# DealVault: Escrow-Based Commodity Trading Workflow

## Design Document

**Version:** 1.0
**Date:** 2026-03-07
**Author:** Nhlanhla Mnyandu (nhlanhla@isutech.co.za)
**Status:** Approved for Implementation

---

## 1. Executive Summary

DealVault is being enhanced with a comprehensive escrow-based commodity trading workflow, designed specifically for high-value commodity deals (gold, diamonds, platinum). This document captures the research findings, identified vulnerabilities, and the architectural solution.

The enhancement introduces three major capabilities:
1. **6-Phase Escrow Workflow** - A gated deal lifecycle with role-based permissions
2. **Chain of Custody Tracking** - Digital evidence trail preventing commodity swaps between testing and delivery
3. **Escrow Fund Management** - Ledger-based fund blocking and release tracking

---

## 2. Problem Statement

### 2.1 Current Limitations

DealVault currently operates with a simple 7-status linear flow:

```
draft -> documents_pending -> under_review -> verified -> in_progress -> settled -> closed
```

**Critical gaps identified:**

| Gap | Risk |
|-----|------|
| No phase-gating | Anyone can upload docs or advance status at any time |
| Creator-only transitions | Only deal creator can change status; no buyer/intermediary actions |
| No per-phase approvals | Parties accept/reject the deal once, not per phase |
| No escrow tracking | Commission ledger exists but no fund blocking/release |
| No verification records | No model for physical testing/inspection |
| No chain of custody | Nothing proves tested commodity is the same one delivered |
| Documents not phase-linked | Uploads aren't tied to specific workflow stages |

### 2.2 The Chain of Custody Vulnerability

**This is the single biggest fraud vector in commodity trading.**

After gold is tested/assayed at a refinery and verified as authentic, there is NO guarantee that the SAME gold that was tested is the gold that gets delivered:

```
Gold tested at refinery [PASS] -> [UNTRACKED GAP] -> Gold delivered to buyer [???]
                                    ^^^^^^^^^^^^^^^
                                    Swap happens here
```

Real-world fraud scenario:
1. Seller brings authentic gold to refinery - passes assay
2. Seller swaps with fake/lower-grade material after leaving refinery
3. Buyer receives different commodity than what was tested
4. Funds already blocked/released based on the original test results

This is not theoretical - tungsten-filled gold bars have fooled experts worldwide.

---

## 3. Industry Research Findings

### 3.1 How the Industry Solves Chain of Custody

| Organization | Approach |
|---|---|
| **LBMA** (London Bullion Market Association) | "Chain of Integrity" - gold stays in recognized vaults. Trust is broken the moment a bar leaves the controlled environment; re-assay required. Gold Bar Integrity (GBI) initiative adds security features + digital twin database. |
| **De Beers (Tracr)** | Digital twin per diamond on blockchain. Unique surface characteristics scanned and matched at every handoff. 3M+ diamonds registered. |
| **COMEX** | Licensed depositories only (Brinks, HSBC, JP Morgan). Gold moves only via approved carriers. Dual control at every transfer. Eligible/Registered two-tier warehouse system. |
| **Rand Refinery (SA)** | Full chain of custody from deposit to finished product, independently audited. KYC/KYP on all counterparties. Only LBMA-certified refinery in Africa. |
| **Tradewind Markets** | VaultChain on R3 Corda blockchain. Each bar gets digital ownership record. Physical storage at Royal Canadian Mint (sovereign entity). |
| **BullionVault** | Vault operators (Brinks, Loomis) accept legal responsibility. Insurance via Lloyd's of London. Bars never leave recognized vault network. |

**Universal principle:** Trust is maintained by never letting the commodity leave a controlled environment without documented handoff.

### 3.2 Physical Security Measures (Industry Standard)

- **Bar identification:** Refiner hallmark, weight, purity, unique serial number (laser-engraved)
- **Tamper-evident packaging:** "Certicards" that show visible damage if opened
- **Seal integrity:** Checkpoints at every custody handover; compromised seal invalidates chain
- **Weight verification:** Recorded at multiple points; discrepancies trigger investigation
- **Specific gravity testing:** Weighing in air and water detects tungsten-filled counterfeits
- **Secure transport:** Approved carriers only (Brinks, Loomis, Malca-Amit, G4S)

### 3.3 South African Regulatory Context

**Precious Metals Act (Act 37 of 2005):**
- Precious Metals Beneficiation License from SADPMR required to trade/process/deal in gold
- Export permit required from SADPMR for international sales
- Every licence holder must keep a "true and correct register in the prescribed form" of precious metal movements
- Assay certificate from accredited institution (SA Bureau of Standards) required for export

**Regulatory bodies:**
- SADPMR (South African Diamond and Precious Metals Regulator)
- SARB (South African Reserve Bank)
- SARS (South African Revenue Service)

**DealVault's custody chain directly satisfies the regulatory requirement for a "true and correct register" of precious metal movements.**

### 3.4 Insurance Requirements

- Lloyd's of London is the standard insurer for bullion in vault and transit
- A compromised seal or undocumented handover can void insurance claims
- Air carriers may limit liability under the Montreal Convention (~USD 40/kg vs gold value of ~USD 80,000+/kg)
- Documentation at every handover is essential for pursuing claims
- Insurance certificates must extend from transit into storage without coverage gaps

---

## 4. Solution Architecture

### 4.1 Overview

The solution introduces a parallel workflow system alongside existing deals. Existing deals continue working with the simple status flow. New escrow deals opt into the enhanced workflow.

Three new subsystems:
1. **DealWorkflow** - Phase orchestrator with approval gates
2. **Chain of Custody** - Checkpoint-based evidence tracking
3. **EscrowRecord** - Fund blocking and release ledger

### 4.2 Roles

| Role | Platform Mapping | Function |
|------|-----------------|----------|
| **Seller** | `seller` party role | Lists commodity, uploads documentation, coordinates testing access |
| **Buyer** | `buyer` party role | Reviews docs, verifies authenticity, blocks funds, confirms receipt |
| **Broker** | `seller_mandate`, `buyer_mandate` | Facilitates deal, manages doc requests, schedules testing |
| **Intermediary** | `seller_intermediary`, `buyer_intermediary` | Neutral party overseeing escrow, confirms fund blocking, triggers release |

### 4.3 The 6-Phase Workflow

```
Phase 1: LISTING
  Seller lists commodity (type, quantity, price, location)
  Gate: All parties must accept invitation
      |
      v
Phase 2: DOCUMENTATION
  Seller uploads paperwork, certifications, assay requirements
  Gate: Required documents uploaded
      |
      v
Phase 3: BUYER REVIEW
  Buyer reviews documents, verifies authenticity
  Gate: Buyer explicitly approves documentation
      |
      v
Phase 4: TESTING
  Physical verification at secure location (refinery)
  Test results uploaded by neutral party
  -> Chain of Custody INITIATED here (commodity sealed at test site)
  Gate: Verification passed + custody chain initiated
      |
      v
Phase 5: FUND BLOCKING
  Buyer blocks funds in escrow (bank/attorney trust account)
  Intermediary confirms fund receipt
  -> Chain of Custody CHECKPOINTS tracked here
  Gate: Funds confirmed blocked + custody checkpoints progressing
      |
      v
Phase 6: FUND RELEASE
  Commodity delivered, buyer confirms receipt
  -> Chain of Custody COMPLETED (all checkpoints confirmed by both sides)
  Intermediary triggers fund release
  Commission settled atomically
  Gate: Delivery confirmed + all custody checkpoints verified
      |
      v
COMPLETED
```

### 4.4 Phase State Machine

```
listing ----[all_parties_accepted]---------> documentation
documentation --[seller_docs_uploaded]-----> buyer_review
buyer_review ---[buyer_approved]-----------> testing
testing --------[verification_passed]------> fund_blocking
fund_blocking --[escrow_confirmed]---------> fund_release
fund_release ---[delivery_confirmed]-------> completed

Any phase (testing+) ----> disputed
disputed ----------------> (intermediary resolves to any valid phase)
Any phase (pre-fund) ----> cancelled
cancelled ---------------> listing (restart)
```

### 4.5 Role Permissions Per Phase

| Phase | Seller | Buyer | Broker | Intermediary |
|-------|--------|-------|--------|--------------|
| Listing | Create, edit, invite | View | Invite, edit | View |
| Documentation | Upload docs | View docs | Manage requests | Verify docs |
| Buyer Review | Respond to queries | **Approve/reject** | Facilitate | Review integrity |
| Testing | Coordinate access | Attend inspection | Schedule | **Record results** |
| Fund Blocking | Await | **Block funds** | Notify | **Confirm block** |
| Fund Release | Confirm delivery | View | Observe | **Trigger release** |
| Completed | View, receive commission | View | Receive commission | Archive |
| Disputed | Provide evidence | Provide evidence | Facilitate | **Decide outcome** |

---

## 5. Chain of Custody Design

### 5.1 The Solution

A digital evidence chain between testing and delivery, requiring multi-party confirmation at each checkpoint. Fund release is blocked until ALL mandatory checkpoints are confirmed by both sides.

```
TESTING COMPLETE
    |
    v
[Checkpoint 1] Sealed at Refinery
  - Tamper-evident seal applied, seal ID recorded
  - Photo of sealed package (timestamped, geotagged)
  - Weight recorded
  - Both sides confirm
    |
    v
[Checkpoint 2] Stored in Vault / Secure Facility
  - Custodian accepts custody
  - Seal integrity verified (photo)
  - Weight verified
  - Both sides confirm
    |
    v
[Checkpoint 3] Transferred to Logistics
  - Carrier accepts package
  - Seal integrity verified (photo)
  - Waybill number recorded
  - Both sides confirm
    |
    v
[Checkpoint 4] Arrived at Delivery Point
  - Package arrived
  - Seal integrity verified (photo)
  - Weight verified
  - Both sides confirm
    |
    v
[Checkpoint 5] Received by Buyer
  - Buyer inspects: serial numbers match, seals intact
  - Final weight verification
  - Photo evidence
  - Both sides confirm
    |
    v
CUSTODY COMPLETE -> Fund release unlocked
```

### 5.2 Data Captured Per Checkpoint

| Data Point | Purpose | How Captured |
|------------|---------|--------------|
| **Serial numbers** | Match against assay - if different, instant red flag | Manual entry, cross-referenced automatically |
| **Seal ID + photo** | Tamper-evident seal verified at each stop | Phone camera upload |
| **Seal integrity** | Confirms packaging not opened | Boolean + photo evidence |
| **Weight** | Variance > 0.01% triggers alert | Manual entry, auto-compared |
| **GPS coordinates** | Proves location at time of checkpoint | Browser geolocation API |
| **Timestamped photos** | Visual record, SHA-256 hashed | Phone camera, EXIF extracted |
| **Dual confirmation** | Both sides independently verify | Separate confirm actions |

### 5.3 Trust Amplifiers

1. **Serial number tracking** - Assay serial must match delivery serial; automatic mismatch detection
2. **Timestamped geotagged photos** - EXIF data cross-referenced with claimed location
3. **Dual-party confirmation** - Both seller-side AND buyer-side must independently confirm each handoff
4. **Weight verification** - Auto-flags discrepancies between sequential checkpoints
5. **SHA-256 photo hashing** - Stored at upload time; any file replacement is detectable
6. **Immutable timeline** - Custody events logged to DealTimeline; cannot be edited or deleted

### 5.4 Honest Framing

> This system creates a documented audit trail that makes fraud **detectable and attributable**. It does not physically prevent tampering, but ensures any tampering leaves gaps in the evidence chain that can be identified and used in dispute resolution, insurance claims, and legal proceedings.

This aligns with how LBMA, Rand Refinery, and commodity insurance companies operate - documented handoffs shift liability and make fraud prosecutable.

### 5.5 Single Enforcement Point

The entire fraud prevention mechanism collapses to one server-side check:

```typescript
// In PATCH /api/deals/[id] or workflow advance handler
if (targetPhase === "fund_release") {
  const custodyComplete = await isCustodyComplete(dealId);
  if (!custodyComplete) {
    return error("All custody checkpoints must be confirmed before releasing funds");
  }
}
```

No UI bypass possible. Fund release is physically blocked until custody is verified.

---

## 6. Escrow Fund Management

### 6.1 MVP Approach: Ledger-Based Tracking

DealVault tracks escrow states without moving money. The platform acts as a deal coordination and audit layer, not a payment processor.

**How it works:**
1. Buyer and seller agree on deal terms on-platform
2. Buyer provides proof of fund blocking (bank SWIFT reference, attorney trust account reference)
3. Platform records the escrow state and attaches proof document
4. Intermediary confirms funds are visible/blocked
5. Release is triggered by platform status change
6. Actual fund movement happens off-platform (attorney trust account or bank escrow)
7. Platform generates release instruction that parties take to their bank/attorney

**Why this is correct for v1:**
- Avoids financial regulation (not holding funds)
- In commodity trading, deals use attorneys/banks for escrow already
- DealVault adds transparency and audit trail, not replacing the escrow mechanism
- Reduces liability

### 6.2 Escrow State Machine

```
pending -> blocked -> block_confirmed -> released
                                      -> refunded (dispute resolution)
                  -> disputed (any phase from blocked onward)
```

| State | Triggered By | Evidence Required |
|-------|-------------|-------------------|
| pending | System (auto on phase enter) | None |
| blocked | Buyer | Bank reference number, proof document |
| block_confirmed | Intermediary | Visual confirmation of funds |
| released | Intermediary | Delivery confirmation + custody complete |
| refunded | Intermediary | Dispute resolution decision |
| disputed | Any party | Dispute reason |

---

## 7. Data Model

### 7.1 New Models

```
DealWorkflow          - Phase orchestrator (1:1 with Deal)
PhaseApproval         - Per-role, per-phase sign-off records
VerificationRecord    - Physical testing details
EscrowRecord          - Fund blocking/release tracking
CustodyLog            - Chain of custody master record (1:1 with Deal)
CustodyCheckpoint     - Sequential evidence checkpoints
CustodyConfirmation   - Dual-party sign-off per checkpoint
```

### 7.2 Relationship Diagram

```
Deal
 |-- DealWorkflow (1:1, optional)
 |    |-- PhaseApproval (1:many)
 |    |-- VerificationRecord (1:1)
 |    |-- EscrowRecord (1:1)
 |
 |-- CustodyLog (1:1, optional)
      |-- CustodyCheckpoint (1:many, ordered by sequence)
           |-- CustodyConfirmation (1:many, one per confirming user)
```

---

## 8. API Design

### 8.1 New Endpoints

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| POST | `/api/deals/[id]/workflow` | Creator/Seller | Create workflow for deal |
| GET | `/api/deals/[id]/workflow` | Any party | Get full workflow state |
| PATCH | `/api/deals/[id]/workflow` | Per phase rules | Advance/rollback phase |
| POST | `/api/deals/[id]/workflow/approvals` | Per phase rules | Submit phase approval |
| GET | `/api/deals/[id]/workflow/approvals` | Any party | List approvals |
| PATCH | `/api/deals/[id]/workflow/verification` | Intermediary | Record test results |
| PATCH | `/api/deals/[id]/workflow/escrow` | Buyer/Intermediary | Progress escrow state |
| POST | `/api/deals/[id]/custody` | Creator/Seller | Initiate custody tracking |
| GET | `/api/deals/[id]/custody` | Any party | Get full custody chain |
| PATCH | `/api/deals/[id]/custody/checkpoints/[cpId]` | Any party | Submit checkpoint evidence |
| POST | `/api/deals/[id]/custody/checkpoints/[cpId]/confirm` | Opposite side | Confirm/dispute checkpoint |
| POST | `/api/deals/[id]/custody/checkpoints/[cpId]/photo` | Any party | Upload checkpoint photo |

---

## 9. Phase Timeout Recommendations

| Phase | Timeout | On Expiry |
|-------|---------|-----------|
| Documentation | 7 days | Reminder -> 14 days -> auto-cancel |
| Buyer Review | 5 days | Reminder -> 10 days -> auto-cancel |
| Testing | 14 days | Reminder -> 21 days -> escalate |
| Fund Blocking | 5 days | Reminder -> 10 days -> auto-cancel |
| Delivery | 14 days | Reminder -> 21 days -> auto-dispute |
| Release Confirmation | 3 days | Reminder -> 7 days -> admin review |

---

## 10. MVP vs Future Enhancements

### 10.1 MVP (v1) - Build Now

- [x] 6-phase workflow state machine with gates
- [x] Role-based phase permissions
- [x] Per-phase approval records
- [x] Verification/testing record
- [x] Escrow ledger (tracking only, no payment integration)
- [x] Chain of custody with 5 checkpoints
- [x] Dual-party confirmation per checkpoint
- [x] Serial number + weight tracking
- [x] Geotagged photo evidence (browser API)
- [x] SHA-256 integrity hashing
- [x] Immutable audit trail

### 10.2 V2 - Near-Term

- Email notifications per phase transition
- PDF generation (deal summaries, release instructions, audit exports)
- Commodity templates (gold, chrome, manganese presets)
- KYC document collection for users/companies
- Dashboard analytics (deal volume, time per phase, completion rates)
- Phase timeout enforcement with cron

### 10.3 V3 - Future

- Payment integration (attorney trust account API)
- Digital signatures (DocuSign or equivalent)
- Blockchain-anchored audit records
- IoT sensor integration (NFC tags, GPS trackers)
- Smart contract escrow (international deals)
- LBMA GBI database integration
- AI-powered document verification (OCR + certificate validation)
- Real-time WebSocket updates
- Mobile app (React Native)

---

## 11. Build Sequence

### Phase A: Schema & Types (No Breaking Changes)
1. Add new Prisma models (DealWorkflow, PhaseApproval, VerificationRecord, EscrowRecord, CustodyLog, CustodyCheckpoint, CustodyConfirmation)
2. Add relations to existing Deal, User, Document models
3. Run migration
4. Create `src/types/workflow.ts` with all constants
5. Extend `EVENT_TYPES` in `src/types/index.ts`

### Phase B: Services
1. Create `src/services/workflow.service.ts`
2. Create `src/services/custody.service.ts`

### Phase C: API Routes
1. Workflow routes (`/api/deals/[id]/workflow/...`)
2. Custody routes (`/api/deals/[id]/custody/...`)
3. Modify existing deal PATCH handler with new gates

### Phase D: UI Components
1. WorkflowStepper, PhaseActionPanel
2. EscrowStatusCard, VerificationPanel
3. CustodyTracker, CheckpointCard
4. InitiateCustodyModal, CheckpointSubmitForm

### Phase E: Integration
1. Add Workflow tab to deal detail page
2. Add Custody tab to deal detail page
3. Enable workflow toggle on new deal page
4. Update deal list to show workflow phase

---

## 12. References

- LBMA Gold Bar Integrity Initiative - https://www.lbma.org.uk/good-delivery/lbma-gold-bar-integrity-initiative-security-feature
- LBMA Responsible Gold Guidance v9
- De Beers Tracr Platform - https://www.tracr.com/
- Tradewind Markets VaultChain
- COMEX Gold Warrants FAQ (CME Group)
- SA Precious Metals Act (Act 37 of 2005)
- SADPMR Regulations
- Rand Refinery Chain of Custody
- CustodyChain App (Polygon/Ethereum)
- AlpVision Anti-Counterfeiting for Precious Metals
