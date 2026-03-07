# DealVault — Revenue Model & Pricing Strategy

## Executive Summary

DealVault operates at the intersection of virtual deal rooms, escrow management, and supply chain traceability — a unique position no single competitor occupies in Africa. The platform facilitates high-value commodity transactions (gold, diamonds, platinum, tanzanite) where deals routinely range from $500K to $50M+. Traditional alternatives (Letters of Credit, bank escrow, law firm escrow) cost 2-10% of deal value. DealVault at 0.5-0.75% represents an 85-93% cost reduction while adding digital deal management, compliance automation, and chain of custody tracking.

**Projected Year 1 ARR: $950K - $1.3M**
**Projected Year 3 ARR: $4M - $6M**
**5-Year Target: $10M+ ARR**

---

## 1. Market Opportunity

### Total Addressable Market

| Region | Annual Commodity Flow | Key Commodities |
|--------|----------------------|-----------------|
| South Africa | ~USD 25 billion | Gold, PGMs, Diamonds |
| East Africa (Tanzania, Kenya) | ~USD 10 billion | Tanzanite, Gold, Gemstones |
| Southern Africa (Botswana, Namibia, Zimbabwe) | ~USD 15 billion | Diamonds, PGMs, Gold |
| **Total Regional** | **~USD 50 billion/year** | |

### Customer Segments

| Segment | SA Estimate | Regional Total |
|---------|------------|----------------|
| Mining companies (all sizes) | 550-800 | 900-1,200 |
| Brokers & intermediaries | 300-800 | 500-1,000 |
| Refineries & smelters | 15-25 | 25-40 |
| Diamond cutting/trading houses | 50-100 | 80-150 |
| Export trading companies | 200-400 | 350-600 |
| Banks in commodity trade finance | 8-12 | 15-20 |
| **Total** | **1,123-2,137** | **1,870-3,010** |

### Market Sizing

| Metric | Value |
|--------|-------|
| **TAM** (all commodity deal management, Southern & East Africa) | USD 50-250M/year |
| **SAM** (precious metals/stones, SA + East Africa) | USD 15-30M/year |
| **SOM Year 1** (50-70 customers) | USD 950K-1.3M |
| **SOM Year 3** (200-300 customers) | USD 4M-6M |
| **SOM Year 5** (400-500 customers) | USD 10M+ |

### Why Now

1. **Fraud crisis**: R21-70 billion lost annually to illegal mining and commodity fraud in SA. A R24.4 billion gold VAT fraud scheme exposed by SARS — platforms that create auditable trails are in demand.
2. **Regulatory tailwinds**: FICA amendments targeting precious metals dealers, SADPMR digital compliance push, post-VAT-fraud SARS scrutiny.
3. **Mid-market gap**: Global CTRM platforms (ION, Aspect) cost $50K+/year and target enterprises. Small/mid-tier miners, brokers, and dealers currently use WhatsApp, email, and spreadsheets.
4. **Africa commodity boom**: Mining sector output grew from USD 480B (2021) to USD 620B (2025) — ~7% CAGR. Gold prices rose 60%+ between January 2024 and July 2025.

---

## 2. Revenue Model: Hybrid (Subscription + Transaction Fee)

### Why Hybrid

A pure subscription model leaves money on the table when clients close $50M deals. A pure transaction model creates unpredictable revenue. The hybrid approach captures both predictable baseline revenue and upside from deal flow.

### Competitive Fee Landscape

| Alternative | Cost | DealVault vs. |
|-------------|------|---------------|
| Letters of Credit (all-in) | 3-10% of deal value | **85-93% cheaper** |
| Bank escrow | 2-4% | **75-85% cheaper** |
| Law firm escrow | 1.5-3% | **65-75% cheaper** |
| Digital escrow (Escrow.com) | 0.7-1.2% | **Competitive, with more features** |
| Commodity broker commission | 0.5-1% | **At parity, with full platform** |

---

## 3. Pricing Tiers

### Tier Naming

Inspired by precious metal refining grades and African mining heritage — not generic SaaS names.

| Tier | Name | Rationale |
|------|------|-----------|
| 1 | **Prospect** | Mining term for an initial exploration site; signals entry point |
| 2 | **Reef** | The Witwatersrand Reef — the geological formation that made SA the gold capital |
| 3 | **Sovereign** | A gold sovereign coin; signals authority and high value |
| 4 | **Vault** | The ultimate secure holding; aligns with the DealVault brand |

### Pricing Table

| | Prospect | Reef | Sovereign | Vault |
|---|----------|------|-----------|-------|
| **Monthly** | $299/mo | $899/mo | $1,799/mo | Custom |
| **Annual** | $249/mo | $749/mo | $1,499/mo | Custom (from $3,500/mo) |
| **Annual Total** | $2,988 | $8,988 | $17,988 | $42,000+ |
| **Annual Savings** | $600 (17%) | $1,800 (17%) | $3,600 (17%) | Negotiated |
| **Target** | Individual brokers, small traders | Established brokers, mid-size firms | Large trading houses, mining companies | Institutions, banks, government |

### Tier Limits

| Dimension | Prospect | Reef | Sovereign | Vault |
|-----------|----------|------|-----------|-------|
| Active deals | 5 | 20 | 75 | Unlimited |
| Users/seats | 3 | 10 | 30 | Unlimited |
| Parties per deal | 6 | 12 | Unlimited | Unlimited |
| Document storage | 5 GB | 25 GB | 100 GB | 1 TB+ |
| Deal value cap | $2M | $15M | $50M | None |

### Feature Gating Matrix

| Feature | Prospect | Reef | Sovereign | Vault |
|---------|----------|------|-----------|-------|
| Deal rooms (create, invite, track) | Yes | Yes | Yes | Yes |
| Document management + SHA-256 | Yes | Yes | Yes | Yes |
| Messaging (deal visibility) | Yes | Yes | Yes | Yes |
| Messaging (side/private visibility) | — | Yes | Yes | Yes |
| Commission ledger (view) | Yes | Yes | Yes | Yes |
| Commission ledger (full CRUD) | — | Yes | Yes | Yes |
| Status state machine | Yes | Yes | Yes | Yes |
| **Escrow workflow (6-phase)** | — | **Yes** | **Yes** | **Yes + Custom** |
| Fund blocking/release tracking | — | Yes | Yes | Yes |
| Verification management | — | Basic | Full | Full |
| **Chain of custody tracking** | — | — | **Yes** | **Yes** |
| GPS/photo checkpoints | — | — | Yes | Yes |
| Dual-party confirmation | — | — | Yes | Yes |
| Weight variance detection | — | — | Yes | Yes |
| Admin dashboard | Basic | Full | Full | Multi-tenant |
| User management | Basic | Full | Full | Full + SSO/SAML |
| API access | — | — | 10K req/day | Unlimited |
| Audit log export | — | CSV | CSV + PDF | Custom formats |
| Support | Email (48hr) | Email (24hr) | Phone + AM (8hr) | Dedicated engineer |
| Custom branding / white-label | — | — | — | Yes |
| Compliance reporting (FICA/SADPMR) | — | — | Yes | Yes + Custom |
| On-premises deployment | — | — | — | Yes |

### Gating Philosophy

- **Prospect** is intentionally limited — it is a "try before you commit" tier. Anyone doing real commodity deals at $500K+ will hit limits within a month.
- **Reef** is the hero tier — most customers should land here. It includes the escrow workflow, DealVault's core differentiator. At $749/month it is a fraction of one deal's value.
- **Sovereign** justifies its premium with chain of custody tracking — the feature no generic VDR offers. For firms moving physical gold, platinum, or diamonds, GPS-verified custody tracking is a compliance necessity, not a luxury.
- **Vault** is sales-led. No self-serve signup. Custom pricing captures value from institutions whose deal volumes justify $50K-$100K+ annual contracts.

---

## 4. Transaction Fees

### Degressive Fee Schedule

Applied per deal at settlement, calculated on deal value.

| Deal Value | Fee (bps) | Fee % | Example Fee |
|-----------|-----------|-------|-------------|
| Up to $1M | 100 bps | 1.00% | $10,000 on $1M |
| $1M - $3M | 75 bps | 0.75% | $22,500 on $3M |
| $3M - $5M | 60 bps | 0.60% | $30,000 on $5M |
| $5M - $10M | 45 bps | 0.45% | $45,000 on $10M |
| $10M - $25M | 30 bps | 0.30% | $75,000 on $25M |
| $25M - $50M | 20 bps | 0.20% | $100,000 on $50M |
| $50M+ | 15 bps | 0.15% | Negotiated |

### Transaction Fee Caps by Tier

Higher tiers get lower per-deal caps as a volume incentive.

| Tier | Transaction Fee Rate | Min per Deal | Max per Deal |
|------|---------------------|--------------|--------------|
| Prospect | Standard schedule | $250 | $3,000 |
| Reef | Standard schedule | $200 | $5,000 |
| Sovereign | Standard -10% | $150 | $7,500 |
| Vault | Custom (from -25%) | Negotiated | Negotiated |

### Worked Examples

**$5M gold deal on Reef tier:**
- Monthly subscription: $749
- Transaction fee: $5M x 0.60% = $30,000, capped at $5,000
- Total: $5,749 (0.11% of deal value)

**$500K tanzanite deal on Prospect tier:**
- Monthly subscription: $299
- Transaction fee: $500K x 1.00% = $5,000, capped at $3,000
- Total: $3,299 (0.66% of deal value)

**$50M platinum deal on Sovereign tier:**
- Monthly subscription: $1,499
- Transaction fee: $50M x 0.20% = $100,000, capped at $7,500
- Total: $8,999 (0.018% of deal value)

### Fee Collection

- **When:** Charged at deal settlement/completion (success-based)
- **Optional deal listing fee:** $500-$1,000 flat fee at deal creation (non-refundable, covers compliance/admin costs)
- **Fee split:** Default 50/50 between buyer and seller, configurable to either party
- **Method:** Deducted from escrowed funds at settlement, or invoiced separately

---

## 5. No Free Tier

**Strong recommendation against a free tier:**

1. **Regulatory signal** — A platform handling $500K-$50M commodity deals with a free option signals "not serious." In commodity trading, trust is purchased.
2. **Security liability** — Free accounts attract bad actors attempting deal fraud or document spoofing.
3. **Support burden** — Free users generate tickets without revenue.

**Instead offer:**
- **14-day free trial** of the Reef tier (hero tier), requiring company registration and phone verification
- **Demo environment** with synthetic data for prospects to explore

---

## 6. Revenue Projections

### Year 1

| Source | Monthly | Annual |
|--------|---------|--------|
| Prospect (20 accounts x $249) | $4,980 | $59,760 |
| Reef (35 accounts x $749) | $26,215 | $314,580 |
| Sovereign (10 accounts x $1,499) | $14,990 | $179,880 |
| Vault (3 accounts x $3,500 avg) | $10,500 | $126,000 |
| **Subscription subtotal** | **$56,685** | **$680,220** |
| Transaction fees (~40% of subscriptions) | $22,674 | $272,088 |
| **Total Year 1 ARR** | | **$952,308** |

### Year 1-5 Growth

| Year | Customers | Subscription ARR | Transaction Fee ARR | Total ARR |
|------|-----------|-----------------|--------------------| ----------|
| 1 | 68 | $680K | $272K | **$952K** |
| 2 | 140 | $1.4M | $700K | **$2.1M** |
| 3 | 250 | $2.5M | $1.5M | **$4.0M** |
| 4 | 380 | $3.8M | $2.7M | **$6.5M** |
| 5 | 500 | $5.0M | $4.5M | **$9.5M** |

Transaction fees grow faster than subscriptions as deal volume increases and larger clients join.

### Breakeven Analysis

| Cost Category | Annual |
|---------------|--------|
| Infrastructure/hosting | $30K-$60K |
| Development team | $200K-$400K |
| Compliance/KYC/AML | $50K-$100K |
| Legal/regulatory | $50K-$100K |
| Sales/marketing | $100K-$200K |
| **Total operating costs** | **$430K-$860K** |

At $3.5M average deal size and 65 bps blended rate, breakeven requires **13-25 deals/year** from transaction fees alone, or **40-60 subscription accounts**.

---

## 7. Currency & Payment Strategy

### Pricing Currency
- **Primary:** USD (commodity trading standard globally)
- **Display:** ZAR conversion shown for South African clients
- **Invoicing:** USD for cross-border, ZAR for domestic SA deals

### Payment Methods

| Method | Use Case |
|--------|----------|
| EFT / Instant EFT (Ozow) | SA subscription payments |
| Credit/debit card (Stripe) | International subscriptions |
| Bank wire / SWIFT | Transaction fees on high-value deals |
| PayFast / Peach Payments | ZAR subscription billing |

---

## 8. Regulatory Monetization

Premium compliance features that command higher pricing:

| Feature | Regulatory Basis | Tier |
|---------|-----------------|------|
| SADPMR transaction logging | Precious Metals Act — mandatory records | Sovereign+ |
| FICA/AML screening | Financial Intelligence Centre Act — ZAR 100K+ threshold | Sovereign+ |
| Kimberley Process certificate tracking | KP — auditable warranty invoices required | Sovereign+ |
| LBMA chain of custody | Responsible Gold Guidance for refiners | Sovereign+ |
| Export permit management | SARS customs + SADPMR certificates | Sovereign+ |
| VAT compliance audit trail | Post-R24.4B fraud scandal — critical for SARS | Reef+ |
| Custom compliance reporting | FICA, FATF, KP, LBMA — consolidated | Vault |

### Government/Regulatory Partnership Opportunities

- **SADPMR** — Could mandate digital record-keeping for licensed dealers
- **Financial Intelligence Centre (FIC)** — AML compliance platform for precious metals dealers
- **SARS** — Auditable transaction trails (directly addresses known VAT fraud vector)
- **Tanzania Mining Commission** — Government actively seeking to capture more domestic value from tanzanite

---

## 9. Competitive Positioning

### DealVault's Unique Position

No single competitor combines all three capabilities:

| Capability | VDRs (Intralinks, Datasite) | Escrow (Escrow.com, Truzo) | CTRM (ION, Aspect) | DealVault |
|-----------|---------------------------|---------------------------|--------------------| ----------|
| Document security & deal rooms | Yes | — | — | **Yes** |
| Multi-party collaboration | Limited | — | — | **Yes** |
| Escrow / fund management | — | Yes | — | **Yes** |
| Chain of custody tracking | — | — | Partial | **Yes** |
| Compliance automation | — | — | Partial | **Yes** |
| Africa-focused | — | Truzo only | — | **Yes** |
| Price point | $10K-$200K/yr | Per-transaction | $50K+/yr | **$3K-$18K/yr** |

### Key Sales Arguments

1. **85-93% cheaper than Letters of Credit** — savings of $70K-$300K per $3.5M deal vs. LC-based alternatives
2. **Only platform combining deal room + escrow + custody** for physical commodity trades in Africa
3. **Fraud prevention** — auditable trails, dual-party confirmation, tamper-evident photo hashing address the R21-70B annual fraud problem
4. **Regulatory compliance built-in** — SADPMR, FICA, KP, LBMA requirements automated
5. **Mid-market sweet spot** — too expensive for WhatsApp, too cheap to ignore vs. bank instruments

---

## 10. Go-to-Market Strategy

### Phase 1: SA Precious Metals (Months 1-6)
- Target: Gold and PGM brokers, mid-tier miners, Rand Refinery ecosystem
- Channel: Direct sales, Minerals Council SA events, SADPMR dealer networks
- Goal: 30-50 accounts

### Phase 2: SA Diamonds + Expansion (Months 6-12)
- Target: Diamond dealers, cutting houses, De Beers sightholders
- Add: Kimberley Process compliance features
- Goal: 70+ accounts

### Phase 3: East Africa (Months 12-18)
- Target: Tanzania tanzanite market, Kenya gold dealers
- Partnership: Tanzania Mining Commission
- Goal: 100-150 accounts

### Phase 4: Enterprise & Government (Months 18-24)
- Target: Large mining houses, banks, regulatory bodies
- Launch: Vault tier, white-label options
- Goal: 200+ accounts, first government contract

---

*DealVault Revenue Model v1.0 — March 2026*
*Research compiled from 60+ industry sources including Escrow.com, LBMA, SADPMR, Minerals Council SA, SARS, Kimberley Process, and leading VDR/CTRM platforms.*
