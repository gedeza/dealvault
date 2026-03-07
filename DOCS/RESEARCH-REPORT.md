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

DealVault is positioned to fill this gap as a **vertical SaaS** purpose-built for commodity deal intermediaries.

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

## 9. Sources and References

- World Gold Council — Gold Demand Trends (2025)
- Kimberley Process Statistics — Rough Diamond Trade (2025)
- Johnson Matthey — Platinum Group Metals Market Report (2025)
- African Mining Vision — African Union Commission
- Extractive Industries Transparency Initiative (EITI) Reports
- South African Reserve Bank — Cross-border Transaction Guidelines
- Tanzania Mining Commission — Export Regulations
- Botswana Ministry of Minerals — Diamond Trading Hub Reports

---

*ISU Tech — Market Research Division*
*Confidential — For Internal Use Only*
