# DealVault — Market Research Report

**Prepared by:** Nhlanhla Mnyandu, ISU Tech
**Date:** March 2026
**Version:** 1.0

---

## 1. Executive Summary

The commodity trading industry — particularly in gold, diamonds, and platinum — relies heavily on fragmented, manual processes for deal coordination between multiple parties. Brokers, mandates, sellers, and buyers communicate through WhatsApp groups, email threads, and shared folders with no unified audit trail, commission tracking, or document verification.

DealVault addresses this gap by providing a secure, purpose-built deal room platform designed specifically for commodity intermediaries in Southern and East Africa, with applicability to global commodity markets.

---

## 2. Problem Statement

### 2.1 The Current Landscape

Commodity deal chains typically involve 4-8 parties across buy and sell sides:

```
Seller → Seller Mandate → Intermediary/Broker → Buyer Mandate → Buyer
```

Each party in the chain:
- Negotiates commission percentages (typically 1-3% of deal value)
- Exchanges sensitive documents (SPA, NCNDA, IMFPA, BCL, POF)
- Communicates deal progress through informal channels
- Tracks deal status manually via spreadsheets or memory

### 2.2 Pain Points Identified

| Pain Point | Impact | Frequency |
|-----------|--------|-----------|
| **No centralised deal tracking** | Deals fall through the cracks, status unclear | Every deal |
| **Document fraud risk** | Forged BCLs, fake POFs circulated | ~15-20% of deals |
| **Commission disputes** | No written record of agreed splits | ~30% of completed deals |
| **Circumvention** | Parties bypass intermediaries after introduction | ~25% of deal chains |
| **No audit trail** | Impossible to prove who said what, when | Every deal |
| **Communication fragmentation** | WhatsApp, email, calls — nothing in one place | Every deal |
| **Visibility confusion** | Sensitive info shared with wrong side of deal | ~10% of communications |

### 2.3 Real-World Example

A typical gold bullion transaction (500 kg, ~$38.5M USD):

1. Seller in Tanzania contacts a mandate in Dar es Salaam
2. Mandate reaches an intermediary broker in Johannesburg
3. Broker connects with a buyer mandate in Dubai
4. Buyer mandate presents to an end buyer in Switzerland

This chain involves 5+ parties across 4 countries, 3 time zones, and multiple currencies. Documents are exchanged via email attachments with no version control. Commission agreements are verbal or in separate side letters. When disputes arise, there is no single source of truth.

---

## 3. Target Market

### 3.1 Primary Audience

| Segment | Description | Est. Size (Africa) |
|---------|-------------|-------------------|
| **Commodity Brokers** | Independent intermediaries facilitating deals | 5,000-10,000 |
| **Mandate Holders** | Authorised representatives of buyers/sellers | 3,000-5,000 |
| **Mining Companies** | Small-to-mid-scale gold, diamond, platinum producers | 2,000-4,000 |
| **Trading Houses** | Companies that buy and resell commodities | 500-1,000 |

### 3.2 Geographic Focus

**Phase 1 (Launch):**
- South Africa (Johannesburg — gold/platinum hub)
- Tanzania (Dar es Salaam — East African gold corridor)
- Botswana (Gaborone — diamond centre)

**Phase 2 (Expansion):**
- DRC (Kinshasa — cobalt, coltan, gold)
- Ghana (Accra — West African gold hub)
- UAE (Dubai — global commodity trading hub)

**Phase 3 (Global):**
- Switzerland (Geneva/Zurich — global commodity trading capital)
- Singapore (Asia-Pacific commodity hub)
- United Kingdom (London Metal Exchange)

### 3.3 Commodities Covered

| Commodity | Global Annual Trade Value | Key Regions |
|-----------|--------------------------|-------------|
| Gold | ~$200B | South Africa, Tanzania, Ghana, DRC |
| Diamonds | ~$80B | Botswana, DRC, South Africa, Angola |
| Platinum | ~$30B | South Africa (80% of global supply) |
| Chrome | ~$15B | South Africa, Turkey |
| Manganese | ~$20B | South Africa, Gabon |
| Copper | ~$180B | DRC, Zambia |
| Cobalt | ~$10B | DRC (70% of global supply) |

---

## 4. Competitive Analysis

### 4.1 Existing Solutions

| Solution | Type | Strengths | Weaknesses |
|----------|------|-----------|------------|
| **Intralinks** | Virtual Data Room | Enterprise-grade security, M&A focus | $15K+/month, not commodity-specific, no commission tracking |
| **Merrill DatasiteOne** | Virtual Data Room | Strong document management | Enterprise pricing, no deal chain concept |
| **WhatsApp Groups** | Messaging | Ubiquitous, free, instant | No audit trail, no document verification, no commission tracking |
| **Email + Spreadsheets** | Manual Process | Familiar, free | Fragmented, no visibility controls, version chaos |
| **Salesforce** | CRM | Highly customisable | Expensive, requires consultants, not deal-room oriented |
| **Monday.com / Asana** | Project Management | Task tracking, collaboration | Not designed for multi-party confidential deals |

### 4.2 Market Gap

No existing solution addresses all of:
1. Multi-party deal rooms with buy/sell side separation
2. Commission ledger with pool validation
3. Document verification with tamper detection (SHA-256)
4. Message visibility controls (deal-wide, side-only, private)
5. Deal status state machine with audit trail
6. Pricing accessible to individual brokers and small firms
7. **Escrow-based workflow with role-gated phase transitions**
8. **Chain of custody tracking between testing and delivery**
9. **Dual-party checkpoint confirmation with geotagged evidence**
10. **Automated serial number and weight variance detection**

DealVault is positioned to fill this gap as a **vertical SaaS** purpose-built for commodity deal intermediaries — evolving from a deal tracker into a **trust infrastructure platform**.

---

## 5. Industry Research

### 5.1 Commodity Trading in Africa

Africa accounts for approximately 30% of global mineral reserves and is a significant exporter of gold, diamonds, platinum group metals, and base metals. The commodity trading ecosystem on the continent is characterised by:

- **Informal networks** — Most deals originate through personal relationships
- **Trust-based transactions** — Verbal agreements are common, leading to disputes
- **Regulatory complexity** — Each country has different mining, export, and forex regulations
- **Document-heavy processes** — KYC, Kimberley Process (diamonds), assay certificates, export permits
- **High fraud incidence** — Fake documents, non-existent inventory, phantom buyers

### 5.2 The Intermediary Economy

In African commodity markets, intermediaries play a critical role:

- **Mandate holders** act as authorised representatives (typically exclusive for 6-12 months)
- **Brokers** connect supply and demand across borders
- **Facilitators** provide logistics, compliance, or banking introductions
- **Commission structures** range from 0.5% to 5% of deal value, split across the chain

A single gold deal of 1,000 kg at $77,000/kg = $77M. At 2% commission pool, that's $1.54M split across 3-5 intermediaries. The stakes are high enough to warrant proper tooling.

### 5.3 Document Standards

Standard commodity trade documents that must be exchanged and verified:

| Document | Abbreviation | Purpose | Issued By |
|----------|-------------|---------|-----------|
| Sale Purchase Agreement | SPA | Primary contract | Legal counsel |
| Non-Circumvention Non-Disclosure Agreement | NCNDA | Protects intermediaries | Parties jointly |
| Irrevocable Master Fee Protection Agreement | IMFPA | Guarantees commission payments | Parties + bank |
| Bank Comfort Letter | BCL | Confirms financial capability | Buyer's bank |
| Proof of Funds | POF | Evidence of available capital | Bank / auditor |
| Soft Corporate Offer | SCO | Initial seller offer | Seller / mandate |
| Full Corporate Offer | FCO | Binding seller offer | Seller |
| Letter of Intent | LOI | Buyer's expression of interest | Buyer |
| Kimberley Process Certificate | KPC | Conflict-free diamond cert | Government authority |
| Assay Report | — | Metal purity verification | Independent lab (SGS, ALS) |

### 5.4 Trust and Verification Challenges

The commodity trading space suffers from significant trust issues:

- **Document forgery** — Fake BCLs and POFs are commonly circulated
- **Identity fraud** — Parties misrepresent their authority or company affiliation
- **Circumvention** — After introductions are made, parties cut out intermediaries
- **Double-selling** — Same inventory offered to multiple buyers simultaneously
- **Payment disputes** — Commission not paid after deal settlement

These trust issues create demand for a platform that provides:
- Immutable audit trails (who uploaded what, when)
- Document integrity verification (hash-based tamper detection)
- Commission agreements recorded before deal progression
- Timeline logging of every action for dispute resolution

---

## 6. Technology Trends

### 6.1 Relevant Trends

| Trend | Relevance to DealVault |
|-------|----------------------|
| **SaaS adoption in Africa** | Growing internet penetration and mobile-first users |
| **Digital document verification** | SHA-256 hashing, magic byte validation gaining adoption |
| **Zero-trust security** | Role-based access, visibility controls becoming standard |
| **Mobile responsiveness** | 70%+ of African internet users are mobile-first |
| **Cloud-native architecture** | Docker, serverless enabling cost-effective deployment |
| **Real-time collaboration** | Users expect instant updates (WebSocket/SSE) |

### 6.2 Technology Selection Rationale

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Full-stack, SSR/SSG, API routes in one codebase |
| Database | PostgreSQL (prod) | ACID compliance, JSON support, scalability |
| Auth | NextAuth + TOTP 2FA | Flexible, well-maintained, critical for high-value deals |
| File validation | Magic byte detection | Prevents disguised malicious uploads |
| Document hashing | SHA-256 | Tamper detection without storing file contents in DB |
| Deployment | Docker | Consistent environments, easy scaling |
| UI | shadcn/ui + Tailwind | Rapid development, dark mode, accessible components |

---

## 7. Key Findings

1. **No direct competitor** exists for commodity deal room management at the intermediary level
2. **WhatsApp is the de facto platform** — any solution must be simpler and more valuable than group chats
3. **Commission tracking is the killer feature** — intermediaries lose millions annually to disputes and circumvention
4. **Document verification builds trust** — SHA-256 hashing and upload validation address fraud concerns
5. **Mobile-first is non-negotiable** — the majority of users will access from smartphones
6. **Multi-currency support is essential** — deals span USD, ZAR, EUR, GBP, AED
7. **Audit trails have legal value** — in dispute resolution, a timestamped log is evidence

---

## 8. Recommendations

Based on this research, the following product strategy is recommended:

1. **Build a commodity-specific deal room platform** (not a generic VDR)
2. **Focus on the intermediary** as the primary user (they initiate and manage deals)
3. **Commission ledger as core differentiator** — make it impossible to dispute agreed splits
4. **Start with gold, diamonds, platinum** — highest value, most active in Southern/East Africa
5. **Freemium model** — free for 3 active deals, paid plans for unlimited deals and advanced features
6. **Mobile-first design** — responsive tables, card views, touch-friendly interactions
7. **Launch in South Africa** — strongest network, regulated market, English-speaking

---

## 9. Escrow Workflow & Chain of Custody Research

### 9.1 The Escrow Gap

User feedback from commodity traders revealed that DealVault's original linear deal flow (draft -> settled -> closed) does not reflect the actual trading process. Real commodity deals follow a 6-phase escrow-based workflow:

1. **Product Listing** - Seller lists commodity with specifications
2. **Documentation** - Seller uploads paperwork, certifications, test requirements
3. **Buyer Review** - Buyer verifies document authenticity
4. **Physical Testing** - Commodity tested at secure location (e.g., refinery)
5. **Fund Blocking** - Once verified, buyer's funds are held in escrow
6. **Fund Release** - After confirmed delivery, funds released to seller

Each phase acts as a gate - progression requires specific role-based approvals and evidence.

### 9.2 The Chain of Custody Vulnerability

**The single biggest fraud vector in commodity trading:** After gold is tested at a refinery and verified as authentic, there is no guarantee the same gold is delivered to the buyer.

```
Gold tested at refinery [PASS] -> [UNTRACKED GAP] -> Gold delivered to buyer [???]
                                    Swap happens here
```

This is not theoretical - tungsten-filled gold bars have fooled experts worldwide. The gap between testing and delivery is where swap fraud occurs.

### 9.3 Industry Solutions Researched

| Organization | Approach |
|---|---|
| **LBMA** | "Chain of Integrity" - gold stays in recognized vaults. Trust broken the moment a bar leaves controlled environment; re-assay required. Gold Bar Integrity (GBI) initiative adds digital twin database (launched 2020). |
| **De Beers (Tracr)** | Digital twin per diamond on blockchain. Unique surface characteristics scanned at every handoff. 3M+ diamonds registered, $3.4B+ combined value. |
| **COMEX** | Licensed depositories only (Brinks, HSBC, JP Morgan). Gold moves only via approved carriers. Dual control at every transfer. |
| **Rand Refinery** | Full chain of custody from deposit to finished product, independently audited. KYC/KYP on all counterparties. Only LBMA-certified refinery in Africa. |
| **Tradewind Markets** | VaultChain on R3 Corda blockchain. Physical storage at Royal Canadian Mint (sovereign entity for higher trust). |
| **BullionVault** | Vault operators (Brinks, Loomis) accept legal responsibility. Insurance via Lloyd's of London. Bars never leave recognized vault network. |

**Universal principle:** Trust is maintained by never letting the commodity leave a controlled environment without documented handoff.

### 9.4 Physical Security Measures (Industry Standard)

- **Bar identification:** Refiner hallmark, weight, purity, unique serial number (laser-engraved)
- **Tamper-evident packaging:** "Certicards" that show visible damage if opened
- **Seal integrity:** Verified at every custody handover; compromised seal invalidates chain and can void insurance
- **Weight verification:** Recorded at multiple points; discrepancies trigger investigation
- **Specific gravity testing:** Weighing in air and water detects tungsten-filled counterfeits
- **Secure transport:** Approved carriers only (Brinks, Loomis, Malca-Amit, G4S)

### 9.5 South African Regulatory Context

**Precious Metals Act (Act 37 of 2005):**
- Precious Metals Beneficiation License from SADPMR required to trade/process/deal in gold
- Export permit required from SADPMR for international sales
- Every licence holder must keep a "true and correct register in the prescribed form" of precious metal movements
- Assay certificate from accredited institution (SA Bureau of Standards) required for export

**Regulatory bodies:** SADPMR, SARB, SARS

**Key insight:** A digital chain of custody feature in DealVault directly satisfies the regulatory requirement for a "true and correct register."

### 9.6 Insurance Requirements

- Lloyd's of London is the standard insurer for bullion in vault and transit
- A compromised seal or undocumented handover can void insurance claims
- Air carriers may limit liability under the Montreal Convention (~USD 40/kg vs gold value of ~USD 80,000+/kg)
- Documentation at every handover point is essential for pursuing claims beyond convention limits
- Insurance certificates must extend from transit into storage without coverage gaps

### 9.7 Escrow Fund Management Findings

For MVP, the recommended approach is **ledger-based tracking without payment integration**:

- Platform acts as a deal coordination and audit layer, not a payment processor
- Buyer provides proof of fund blocking (bank SWIFT reference, attorney trust account reference)
- Platform records escrow state and attaches proof documents
- Actual fund movement happens off-platform (attorney trust account or bank escrow)
- This avoids financial regulation, reduces liability, and matches how high-value commodity trades already work

### 9.8 Digital Trust Amplifiers (No Hardware Required)

Research identified four smartphone-based trust mechanisms buildable in a web app:

1. **Serial number tracking** - Assay serial matched against delivery serial; automatic mismatch detection
2. **Timestamped geotagged photos** - EXIF data cross-referenced with claimed location
3. **Dual-party confirmation** - Both seller-side AND buyer-side must independently confirm each custody handoff
4. **Weight verification** - Auto-flags discrepancies between sequential checkpoints (>0.01% variance)

Combined with SHA-256 photo hashing (already used for documents), these create a tamper-evident digital evidence chain that makes fraud detectable and attributable.

### 9.9 Key Finding: DealVault's Differentiator

No existing platform combines:
- Multi-party deal room management
- Commission ledger enforcement
- 6-phase escrow workflow with role-based gates
- Chain of custody tracking between testing and delivery
- Dual-party checkpoint confirmation
- Tamper-evident audit trail with SHA-256 integrity hashing

This positions DealVault as a **trust infrastructure platform** for commodity trading, not just a deal tracker.

---

## 10. Sources and References

### Market Research
- World Gold Council — Gold Demand Trends (2025)
- Kimberley Process Statistics — Rough Diamond Trade (2025)
- Johnson Matthey — Platinum Group Metals Market Report (2025)
- African Mining Vision — African Union Commission
- Extractive Industries Transparency Initiative (EITI) Reports
- South African Reserve Bank — Cross-border Transaction Guidelines
- Tanzania Mining Commission — Export Regulations
- Botswana Ministry of Minerals — Diamond Trading Hub Reports

### Chain of Custody & Escrow Research
- LBMA Gold Bar Integrity Initiative — https://www.lbma.org.uk/good-delivery/lbma-gold-bar-integrity-initiative-security-feature
- LBMA Responsible Gold Guidance v9
- De Beers Tracr Platform — https://www.tracr.com/
- Tradewind Markets VaultChain — Blockchain Gold Provenance
- COMEX Gold Warrants FAQ — CME Group
- Rand Refinery Chain of Custody — https://www.randrefinery.com/
- SA Precious Metals Act (Act 37 of 2005) — Government Gazette 30942
- SADPMR Regulations — https://www.sadpmr.co.za/
- CEMAD Gold Transaction Guidelines (SARB)
- CustodyChain App — Polygon/Ethereum custody tracking
- Gen10 Traceability — Commodity supply chain apps
- AlpVision — Anti-counterfeiting for precious metals
- BullionVault — Chain of Integrity documentation
- Lloyd's of London — Bullion insurance standards
- Montreal Convention — Carrier liability limitations

---

*ISU Tech — Market Research Division*
*Confidential — For Internal Use Only*
