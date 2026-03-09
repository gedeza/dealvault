# DealVault Payment Strategy & Compliance Report

**Date:** 9 March 2026
**Scope:** SA-based B2B SaaS for mining/commodities deal management — scaling from South Africa to continental Africa and internationally

---

## Executive Summary

Stripe is **not directly available in South Africa**. SA businesses cannot open a native Stripe account. The current billing implementation (which relies on `STRIPE_SECRET_KEY`) will not work without incorporating a foreign entity. This report recommends **Paystack as the primary processor** (Stripe-owned, available in SA) with **Flutterwave as the secondary/expansion processor**, and outlines the fraud, regulatory, and architectural considerations for scaling across Africa.

---

## 1. Payment Processor Comparison

### 1.1 Why NOT Stripe Directly

- South Africa is **not in Stripe's supported countries list**
- Stripe's 2020 acquisition of Paystack created an "extended network" covering SA, Nigeria, Ghana, Kenya — but this is Paystack infrastructure, not full Stripe
- Workaround: Incorporate a UK/US entity to access Stripe directly — adds admin overhead and is not recommended as primary strategy

### 1.2 Recommended: Paystack (Primary)

| Attribute | Details |
|---|---|
| **SA Support** | Yes, fully operational |
| **Currencies** | ZAR, NGN, GHS, KES, USD |
| **Local fees** | 2.9% + ZAR 1 per transaction |
| **International fees** | 3.9% + ZAR 100 (international cards) |
| **Settlement** | T+1 (next business day) |
| **Recurring billing** | Yes — plans, subscriptions, recurring charges API |
| **Developer experience** | Excellent — REST API, webhooks, TypeScript support |
| **Countries** | SA, Nigeria, Ghana, Kenya |

**Why Paystack:**
- Best developer experience for a Next.js/TypeScript stack
- Native subscription/recurring billing API maps to DealVault's tiered model
- Covers core initial markets: SA, Nigeria, Ghana, Kenya
- Stripe backing ensures long-term stability and feature development
- Lowest local transaction fees in SA (2.9% + R1)
- T+1 settlement
- Webhook-driven architecture aligns with existing event-driven design

### 1.3 Recommended: Flutterwave (Secondary/Expansion)

| Attribute | Details |
|---|---|
| **SA Support** | Yes (Third-Party Payment Processor License) |
| **Currencies** | 150+ currencies |
| **Fees** | ~1.4% local, ~3.8% international |
| **Settlement** | 1-5 business days |
| **Mobile money** | Yes — M-Pesa, MTN MoMo, Airtel Money |
| **Countries** | 30+ African countries |

**Why Flutterwave:**
- Covers 30+ African countries Paystack doesn't reach
- Mobile money integration (critical for East/Central Africa)
- High-value B2B payment support via Payful partnership
- Blockchain-based cross-border settlements coming 2026
- Use as failover + primary for markets Paystack doesn't cover

### 1.4 Other Processors Evaluated

| Processor | Verdict | Reason |
|---|---|---|
| **PayFast** | Optional (SA-only) | Deepest SA local methods (SnapScan, Zapper, Instant EFT) but SA-only, higher fees (3.5% + R2), older API |
| **Peach Payments** | Worth monitoring | Best fraud tools in SA (120+ rules, PCI Level 1) but R499/month fee, smaller footprint |
| **Yoco** | Eliminated | No subscription/recurring billing support |
| **DPO Pay** | Alternative to Flutterwave | 20+ African countries, mobile money, but less developer-friendly |

### 1.5 Fee Comparison

| Processor | Local Card | International | Monthly Fee | Settlement |
|---|---|---|---|---|
| Paystack | 2.9% + R1 | 3.9% + R100 | None | T+1 |
| PayFast | 3.5% + R2 | Same | None | T+2-3 |
| Peach Payments | 2.95% + R1.50 | Varies | R499 | T+1-2 |
| Flutterwave | ~1.4% | ~3.8% | None | T+1-5 |

---

## 2. Fraud Risks & Security

### 2.1 Real-World Incidents in African Fintech

#### Flutterwave: Repeated Security Breaches (2023-2024)
- **Feb 2023:** NGN 2.9 billion diverted to 107 bank accounts
- **Mar 2023:** NGN 550 million to 107 bank accounts
- **Oct 2023:** NGN 19 billion through unauthorized POS transactions
- **Apr 2024:** NGN 11 billion — breach went undetected because deposits were kept below fraud-check thresholds

**Lesson:** Even Africa's largest processors get hit. Transaction velocity monitoring and amount thresholds are critical.

#### AI-Generated Biometric Fraud (2025-2026)
- **69% of confirmed biometric fraud in Africa is now AI-generated** (synthetic faces, deepfakes)
- One syndicate used 100 stolen faces for **160,000 verification attacks** in one month
- Fraud losses in Nigeria jumped **603%** in Q1 2025

#### SIM Swap Crisis
- Africa faces a **$4 billion SIM swap and identity theft fraud crisis**
- Account takeover attacks are **5x more common** than registration fraud
- SMS OTPs can be bypassed — prefer app-based 2FA

#### Paystack Regulatory Fine (2025)
- Fined NGN 250 million for operating Zap app without proper licensing
- Highlights regulatory enforcement risk across jurisdictions

### 2.2 Fraud Patterns Relevant to DealVault

| Pattern | Description | Mitigation |
|---|---|---|
| **Card testing** | Fraudsters test stolen cards on low-cost SaaS subscriptions | Velocity checks, CAPTCHA on payment forms |
| **Chargeback abuse** | Stolen cards used for subscriptions; cardholders dispute later | 3D Secure (mandatory in SA), detailed transaction logs |
| **BEC (Business Email Compromise)** | Fraudsters impersonate deal parties to redirect payments | Email verification, deal party authentication |
| **Currency arbitrage** | Exploiting conversion rate gaps across payment hops | Minimize currency hops, monitor for unusual patterns |
| **Invoice manipulation** | Altered payment details in deal documentation | Document integrity checks, chain of custody |

### 2.3 Payment Processing Bottlenecks

| Bottleneck | Impact | Mitigation |
|---|---|---|
| **Cross-border costs** | 12-25% of transaction value within Southern Africa | Use PAPSS when available, minimize currency hops |
| **PayFast reliability** | 235 outages since April 2024 (~10/month) | Multi-provider failover |
| **Paystack reliability** | 6,732 outages in ~3 years | Multi-provider failover |
| **Settlement delays** | 1-5 business days cross-border | Set customer expectations, buffer cash flow |
| **Currency liquidity** | ~$5B annual losses continent-wide | Price in USD/ZAR, settle in ZAR |

### 2.4 Security Best Practices (Must-Implement)

1. **3D Secure 2.0** — **Legally mandatory in SA** (PASA mandated since 2013). Shifts fraud liability to card issuer.
2. **Tokenization** — Never store raw card data. Use Paystack/Flutterwave's tokenization. Reduces PCI scope to SAQ-A.
3. **Webhook security:**
   - HMAC signature verification (SHA-256+)
   - Timestamp freshness check (reject >5 min old)
   - Idempotency keys (store processed webhook IDs, 7-30 day TTL)
   - Return 2xx immediately, process async
   - IP allowlisting for webhook endpoints
   - TLS only
4. **Velocity monitoring** — Rate limit payment attempts per user/IP/card
5. **Sanctions screening** — Automated OFAC SDN, UN, EU list checks at onboarding
6. **Internal controls** — RBAC on billing systems, audit trails, segregation of duties

---

## 3. Regulatory Compliance

### 3.1 South African Regulations

#### SARB Exchange Control
- All inbound foreign payments must flow through an Authorised Dealer (licensed SA bank)
- Payments reported on SARB's FinSurv Reporting System
- **Action:** Open business account with an Authorised Dealer bank experienced in SaaS/tech payment flows

#### FICA (KYC/AML)
- SA exited FATF grey list October 2025, but enhanced standards remain permanent
- **Requirements:** Customer Due Diligence (CDD), Risk-Based Approach, Enhanced Due Diligence (EDD) for mining/commodities clients, Compliance Officer appointment, Suspicious Transaction Reports
- **Penalties:** Up to ZAR 10 million + criminal charges
- **Action:** Implement KYC at onboarding — company verification, beneficial ownership, director ID. Default to EDD for all mining/commodities clients.

#### POPIA (Data Protection)
- Active enforcement — fines up to R10M or 10% of turnover
- **Requirements:** Consent, purpose limitation, security measures, data retention policies, Information Officer registration, breach notification
- **Action:** Encrypt billing data at rest and in transit. Implement data retention policies. Provide self-service data access/deletion.

#### Consumer Protection Act (CPA) — Critical for Subscriptions
- **No automatic renewal** of fixed-term contracts without active customer consent
- **Written notification** before expiry with renewal options
- **Cancellation:** Customers may cancel with 20 business days' notice
- **Refund:** Return prepaid amounts within 15 business days
- **Action:** Build renewal reminders, self-service cancellation, process refunds within 15 days. Don't auto-renew annual plans without explicit consent.

#### ECTA (Electronic Communications)
- **7-day cooling-off period** — consumers may cancel within 7 days without penalty
- **Full price disclosure** including VAT, company registration, physical address
- **Action:** Display full pricing with VAT. Include company details on subscription pages. Implement 7-day cancellation window.

#### VAT
- Current: 15.5% (from May 2025), rising to **16% from April 2026**
- Exports of services to non-SA customers: zero-rated with proper documentation
- **Action:** Register for VAT. Charge 15.5% on domestic sales. Zero-rate exports with location evidence.

### 3.2 Pan-African Regulatory Highlights

| Country/Region | Key Requirement |
|---|---|
| **Nigeria** | Naira restrictions, 7.5% VAT on digital services (Jan 2026), $25K threshold triggers registration |
| **Kenya** | M-Pesa dominance (91% mobile money penetration), digital services tax framework |
| **Ghana** | PAPSS participant, fintech passporting with Rwanda |
| **EAC** | Cross-Border Payment Masterplan approved May 2025, but transfer costs remain extreme (44% Tanzania→Rwanda) |
| **AfCFTA** | Digital Trade Protocol adopted Feb 2024 — aspirational, 5-year implementation window |
| **PAPSS** | Live in 12 countries, 120-second settlement in local currencies — monitor for merchant APIs |

### 3.3 International Compliance

| Requirement | Details | Priority |
|---|---|---|
| **GDPR** | SA has NO EU adequacy decision. Need SCCs + DTIA for EU customer data. Consider EU-hosted data center. | Medium (when serving EU) |
| **PCI DSS v4.0** | Mandatory since March 2025. Use tokenized gateway → SAQ-A qualification. | Critical |
| **OFAC Sanctions** | Screen against SDN list. Block comprehensively sanctioned countries (Sudan, South Sudan). | High |
| **AML** | FATF risk-based approach. Commodities platforms inherit higher risk rating. | Critical |

### 3.4 Mining/Commodities Sector Specific

- **Enhanced Due Diligence** is mandatory, not optional, for mining/commodities clients (FATF 2024-2025)
- **Beneficial ownership transparency** required (SA cleaned up records for FATF exit)
- **Conflict minerals regulations** (EU Regulation, Dodd-Frank Section 1502) — DealVault isn't directly subject but customers are. Consider compliance documentation features as a **selling point**.
- **Kimberley Process** — relevant only for diamond deals; KP certificate storage would be a value-add feature

---

## 4. Architecture Recommendation

### 4.1 Payment Abstraction Layer

Build a provider-agnostic payment layer to support multiple processors:

```
src/
  services/
    payment/
      payment.service.ts          # Unified interface
      providers/
        paystack.provider.ts      # Paystack adapter
        flutterwave.provider.ts   # Flutterwave adapter
      types.ts                    # Shared payment types
      router.ts                   # Provider selection (by country/currency/method)
      webhook-handler.ts          # Normalize webhook events to internal events
```

**Key design principles:**
- Unified `PaymentProvider` interface: `createSubscription()`, `cancelSubscription()`, `processPayment()`, `verifyWebhook()`, `getTransaction()`
- Provider router selects processor based on customer country, payment method, currency
- Normalized webhook events: Paystack `charge.success` → internal `PAYMENT_COMPLETED`
- Idempotency: store payment reference IDs, handle duplicate webhooks
- Failover: retry with secondary provider on gateway errors
- **Do NOT use third-party orchestration** (Spreedly, Primer) at current scale — build the abstraction yourself

### 4.2 Data Residency

| Data Type | Location | Rationale |
|---|---|---|
| **Primary app data** | AWS af-south-1 (Cape Town) | POPIA compliance, low latency for African users |
| **Payment tokens** | Paystack/Flutterwave infrastructure | PCI scope reduction — never store card data |
| **Billing records** | SA primary with encrypted backups | POPIA + FICA record-keeping |
| **EU customer data** | Consider AWS eu-west-1 (Ireland) | GDPR compliance when serving EU |

### 4.3 Multi-Entity Strategy

| Phase | Entity | Trigger |
|---|---|---|
| **Phase 1 (Now)** | Single SA (Pty) Ltd | — |
| **Phase 2** | Nigeria/Kenya local entity or partnership | When country revenue exceeds ~$50K/year |
| **Phase 3** | EU subsidiary (Ireland) | When actively targeting EU market |

### 4.4 B2B Payment Methods to Support

| Method | Market | Priority |
|---|---|---|
| **Card (Visa/MC)** | Global | Critical — via Paystack |
| **EFT/Debit Order (DebiCheck)** | South Africa B2B | High — dominant B2B method in SA |
| **Invoice + Bank Transfer** | Enterprise/Mining | High — large clients expect Net 30/60 terms |
| **Mobile Money (M-Pesa)** | East Africa | Medium — when expanding to Kenya/Tanzania |
| **USSD** | West Africa | Low — when expanding to Nigeria |

**B2B-specific considerations:**
- Mining companies use **purchase order (PO) systems** — support PO numbers on invoices
- Enterprise clients prefer **annual billing** with EFT — reduces chargeback risk
- Consider requiring bank transfer for plans above R2,500+/month
- Support **30-60 day payment terms** for enterprise tier

---

## 5. Implementation Roadmap

### Phase 1: Replace Stripe with Paystack (Immediate)
1. Replace `billing.service.ts` Stripe integration with Paystack
2. Implement Paystack subscription plans matching tier model (prospect/reef/sovereign/vault)
3. Set up Paystack webhook endpoint for subscription lifecycle events
4. Deploy with `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY`
5. Add 3D Secure enforcement (mandatory in SA)

### Phase 2: Payment Abstraction Layer (Before Adding Second Provider)
1. Extract Paystack-specific code into `providers/paystack.provider.ts`
2. Create unified `PaymentProvider` interface
3. Build webhook normalization layer
4. Add idempotency handling

### Phase 3: Compliance Infrastructure
1. Implement KYC at onboarding (tiered: basic for low-risk, EDD for mining clients)
2. Add sanctions screening (OFAC SDN, UN, EU lists)
3. Build subscription management with CPA compliance (renewal reminders, 7-day cooling-off, self-service cancellation)
4. VAT calculation and display

### Phase 4: Continental Expansion
1. Add Flutterwave as secondary provider
2. Enable mobile money payments (M-Pesa, MTN MoMo)
3. Provider router for country-based selection
4. Multi-currency pricing (USD + ZAR + key local currencies)

### Phase 5: Enterprise Features
1. Invoice-based billing with PO support
2. EFT/DebiCheck integration for SA enterprise clients
3. Annual billing with bank transfer
4. Net 30/60 payment terms
5. PAPSS integration (when merchant APIs mature)

---

## 6. Compliance Checklist (Priority Order)

| # | Requirement | Risk if Ignored | Effort |
|---|---|---|---|
| 1 | **FICA KYC/AML at onboarding** | ZAR 10M fine, criminal liability | Medium |
| 2 | **POPIA compliance** (privacy policy, data security, Information Officer) | Regulatory enforcement, reputational damage | Medium |
| 3 | **VAT registration and collection** | SARS penalties, back-tax liability | Low (automate) |
| 4 | **3D Secure enforcement** | Non-compliance with PASA mandate | Low (Paystack handles) |
| 5 | **PCI DSS** (tokenized gateway → SAQ-A) | Fines, card processing termination | Low |
| 6 | **CPA subscription compliance** | Consumer complaints, NCC enforcement | Low |
| 7 | **OFAC/sanctions screening** | Criminal liability, banking relationship loss | Low (automated) |
| 8 | **ECTA disclosures** (pricing, company details, cooling-off) | Regulatory action | Low |
| 9 | **GDPR** (when serving EU customers) | EU fines up to 4% global revenue | Medium |
| 10 | **Mining sector EDD procedures** | Regulatory scrutiny, bank de-risking | Medium |

---

## Sources

This report is compiled from 60+ sources including:
- TechCabal, TechPoint Africa, Technext24 (African fintech news)
- SARB, SARS, Information Regulator (SA regulatory bodies)
- FATF, OFAC, EU regulatory guidance
- Paystack, Flutterwave, PayFast, Peach Payments (official documentation)
- Deloitte, PwC, EY, Webber Wentzel (professional advisory)
- Stripe, PCI Security Standards Council (payment industry standards)
- AfCFTA, PAPSS, EAC (continental trade bodies)

Full source URLs available in the research transcripts.
