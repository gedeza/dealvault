# DealVault -- Branding Brief for Graphic Designers

**Prepared by:** ISU Tech
**Date:** March 2026
**Version:** 1.0

---

## 1. What Is DealVault?

DealVault is a **secure deal room platform** purpose-built for **high-value commodity transactions** in Southern and East Africa. It handles deals involving gold, diamonds, platinum, and tanzanite -- transactions that routinely range from **$500K to $50M+**.

The platform replaces fragmented tools (WhatsApp, email, paper trails, bank Letters of Credit) with a single digital workspace where all parties -- sellers, buyers, intermediaries, mandates, and brokers -- collaborate securely from deal creation through to fund release.

### What Makes It Unique

No single competitor combines these three capabilities in one platform:

1. **Virtual Deal Rooms** -- Secure document management with SHA-256 hashing, multi-party collaboration, and side-based confidentiality controls
2. **Escrow Workflow** -- 6-phase state machine (Listing, Documentation, Buyer Review, Testing, Fund Blocking, Fund Release) that replaces costly Letters of Credit
3. **Chain of Custody Tracking** -- 5-point GPS-verified custody chain with dual-party confirmation, weight variance detection, and tamper-evident seal tracking

### Target Market

- Mining companies (all sizes) across Southern and East Africa
- Precious metals/stones brokers and intermediaries
- Refineries, smelters, and cutting houses
- Export trading companies
- Banks involved in commodity trade finance
- Government regulatory bodies (SADPMR, Tanzania Mining Commission)

### Industry Context

- R21-70 billion lost annually to illegal mining and commodity fraud in South Africa
- Traditional alternatives (Letters of Credit, bank escrow) cost 2-10% of deal value
- DealVault costs 85-93% less while adding digital audit trails and compliance automation
- Gold prices rose 60%+ between January 2024 and July 2025 -- deal values are at historic highs

---

## 2. Brand Personality

### Brand Attributes

| Attribute | Expression |
|-----------|-----------|
| **Trustworthy** | This platform handles $50M+ transactions. Every visual element must communicate security and reliability. |
| **Professional** | Users are mining executives, commodity brokers, and institutional traders -- not casual consumers. |
| **African** | Rooted in Southern and East African commodity markets. Not a Western platform adapted for Africa. |
| **Precise** | Assay results, weight variance to 0.01%, SHA-256 hashes -- precision is core to the product. |
| **Authoritative** | The platform must feel like it belongs alongside bank-grade financial tools. |

### Brand Voice

- Direct and confident, never casual or playful
- Technical when needed, but not jargon-heavy
- Commands respect without being cold -- this is a tool for deal-makers who value trust

### What DealVault Is NOT

- It is NOT a consumer app -- avoid bright, playful, startup-style aesthetics
- It is NOT a generic SaaS dashboard -- avoid generic blue/purple tech palettes
- It is NOT a fintech wallet or payments app -- avoid crypto/blockchain aesthetics
- It is NOT budget software -- pricing starts at $249/mo and goes to $42,000+/year

---

## 3. Current Color Direction

The platform currently uses **emerald green** as its primary accent color against a neutral foundation. This direction was chosen deliberately:

### Primary Accent: Emerald Green

| Token | Value | Usage |
|-------|-------|-------|
| `emerald-600` | `#059669` | Primary buttons, icons, accent text, active states |
| `emerald-500` | `#10B981` | Verified/confirmed states, border highlights |
| `emerald-700` | `#047857` | Badge text, dark accent contexts |
| `emerald-50` | `#ECFDF5` | Light accent backgrounds, pills |
| `emerald-100` | `#D1FAE5` | Status badges (verified), light fills |
| `emerald-200` | `#A7F3D0` | Hover borders, stepper connectors |
| `emerald-800` | `#065F46` | Dark mode accent borders |
| `emerald-900` | `#064E3B` | Dark mode CTA section background |
| `emerald-950` | `#022C22` | Dark mode pill backgrounds |

### Why Emerald Green

1. **Commodity association** -- Green is the universal color of money, wealth, and precious materials. It resonates with commodity traders who deal in physical value.
2. **Trust and security** -- Green signals safety, verification, and "go" in financial interfaces. Checkmarks, verified states, and confirmed custody checkpoints all use green naturally.
3. **African identity** -- Emerald is found in multiple African national flags and is associated with the continent's natural wealth. It avoids the overused blue of Western fintech.
4. **Differentiation** -- Most competing platforms (Intralinks, Datasite, Escrow.com) use blue or navy. Emerald immediately distinguishes DealVault.

### Secondary/Semantic Colors

| Color | Usage |
|-------|-------|
| `red-500` | Problem statements, destructive actions, error states, cancelled status |
| `blue-500` | Active/in-progress states (e.g., custody checkpoint currently active) |
| `amber-500` | Premium tier indicators (Vault tier star icon), warning states |
| `neutral grays` | All foundational UI: backgrounds, borders, muted text, cards |

### Foundation: Neutral System

The UI uses a **shadcn/ui** neutral base with no colored tint:

- **Light mode:** Pure white background (`oklch(1 0 0)`), near-black text (`oklch(0.145 0 0)`)
- **Dark mode:** Near-black background (`oklch(0.145 0 0)`), near-white text (`oklch(0.985 0 0)`)
- **Borders/muted:** Achromatic grays throughout
- **Cards:** White (light) / dark gray (dark) with subtle borders

This neutral foundation ensures emerald accents are the clear visual focus.

---

## 4. Typography

### Current Fonts

| Context | Font | Rationale |
|---------|------|-----------|
| Primary (sans) | **Geist Sans** | Modern, professional, excellent readability. Used for all UI text. |
| Monospace | **Geist Mono** | Used for deal numbers (DV-2026-0001), hash values, financial figures |

### Typography Scale

- **Hero headings:** 4xl-6xl, bold, tight tracking
- **Section headings:** 2xl-3xl, bold
- **Card titles:** lg, bold or semibold
- **Body text:** base/sm, normal weight
- **Labels/badges:** xs, medium weight
- **Financial values:** 3xl bold (pricing), 2xl bold (trust metrics)

### Guidelines for Designers

- Headings should feel authoritative without being heavy -- tight tracking, clean weight
- Financial figures (deal values, pricing) should be prominent and confident
- Consider a serif or semi-serif accent font for the wordmark/logo if desired, to convey gravitas
- All text must be legible at typical dashboard density

---

## 5. Naming & Tier System

### Brand Name: DealVault

- "Deal" -- the core unit of the platform (commodity transactions)
- "Vault" -- security, precious metals storage, and trust
- Tagline: **"Secure Commodity Deal Rooms"**

### Pricing Tier Names (Mining Heritage)

Each tier name draws from precious metal mining terminology:

| Tier | Name | Origin | Price |
|------|------|--------|-------|
| 1 | **Prospect** | Mining term for an initial exploration site | $249/mo |
| 2 | **Reef** | The Witwatersrand Reef -- the geological formation that made SA the gold capital | $749/mo |
| 3 | **Sovereign** | A gold sovereign coin -- signals authority and high value | $1,499/mo |
| 4 | **Vault** | The ultimate secure holding; aligns with the brand name | Custom ($3,500+/mo) |

Designers should consider how these tier names might be visually distinguished -- e.g., subtle material textures (raw stone, gold reef, sovereign coin, vault door) or progressive visual weight.

---

## 6. Logo Direction

### Current State

The platform currently uses a **Lucide Shield icon** (`Shield` from lucide-react) in `emerald-600` as a placeholder logo mark, paired with the "DealVault" wordmark in bold sans-serif.

### Logo Requirements

The logo should communicate:

1. **Security/protection** -- The vault concept, safety of assets
2. **Commodity trading** -- Connection to precious metals/stones
3. **Africa** -- Without being cliched (avoid continent silhouettes)
4. **Digital sophistication** -- This is a technology platform, not a mining company

### Logo Variants Needed

| Variant | Usage |
|---------|-------|
| **Full logo** (mark + wordmark) | Navigation header, marketing, documents |
| **Icon mark only** | Favicon, mobile app icon, small contexts |
| **Monochrome** (single color) | PDF headers, email signatures, stamps |
| **Reversed** (white on dark) | Dark mode, emerald CTA sections |
| **Wordmark only** | Where the mark is too small to render |

### Suggested Concepts to Explore

- Shield + vault door combination
- Abstract gemstone facets forming a shield shape
- Interlocking chain links (representing custody chain) within a vault/shield
- A "DV" monogram that suggests security or a seal

### Dimensions

- Icon mark should work at 16x16 (favicon) through 512x512
- Full logo should be legible at 120px wide minimum
- Provide SVG and PNG at 1x, 2x, 3x

---

## 7. UI Component Patterns

### Key Visual Elements in the Platform

Designers should understand these recurring UI patterns:

| Component | Description |
|-----------|-------------|
| **Deal cards** | List view cards showing deal number, title, commodity, value, status badge, party count |
| **Status badges** | Rounded pills with colored backgrounds: draft (gray), documents_pending (amber), under_review (blue), verified (emerald), in_progress (blue), settled (emerald), closed (gray), cancelled (red) |
| **Custody checkpoint visualization** | Vertical stepper with 5 numbered circles (origin, testing, storage, transit, delivery) connected by lines, with verified/active/pending states |
| **6-phase workflow stepper** | Numbered emerald circles with connecting vertical lines showing deal progress |
| **Pricing cards** | 4-column card layout with the "Reef" hero tier highlighted with emerald border and "Most Popular" badge |
| **Trust metrics bar** | 4-column stat display: "85% Cheaper", "$50M+ Deals", "6-Phase Escrow", "5-Point Custody" |
| **Side-based messaging** | Chat interface with visibility controls: deal (all see), side (buy/sell team only), private |
| **Commission ledger** | Table showing party, agreed %, calculated amount, status |
| **Document list** | File cards with type icon, SHA-256 hash preview, upload date, visibility badge |
| **Timeline/audit log** | Vertical chronological list of deal events with icons and timestamps |

### Card/Container Patterns

- Rounded corners: `0.625rem` base radius (10px)
- Borders: 1px solid, subtle gray
- Hover: Emerald border tint + subtle shadow
- Hero cards: 2px emerald border for emphasis
- Dark mode: Slightly elevated card backgrounds against dark base

---

## 8. Iconography

### Current Approach

The platform uses **Lucide React** icons exclusively -- a clean, consistent, 24px stroke-based icon set.

### Key Icons in Use

| Icon | Context |
|------|---------|
| `Shield` | Brand mark, security references |
| `Lock` | Secure deal rooms |
| `FileCheck` | Document management |
| `Users` | Multi-party coordination |
| `Link2` | Chain of custody |
| `FlaskConical` | Testing/assay verification |
| `Banknote` | Escrow/fund management |
| `MapPin` | GPS evidence/location |
| `Check` | Verified states, feature lists |
| `Star` | Premium/Vault tier |
| `Scale` | Trust/balance (problem statement) |
| `Eye` | Visibility controls |
| `Globe` | Compliance/international |
| `ArrowRight` / `ChevronRight` | CTAs, navigation |

### Guidelines for Custom Icons

If creating custom iconography:
- Match Lucide's 24px grid, 1.5px stroke weight
- Keep style consistent: rounded caps, minimal fills
- Consider filled variants for active/selected states
- Icons should work at 16px minimum (sidebar, badges)

---

## 9. Imagery & Photography Direction

### Recommended Imagery Themes

| Theme | Examples |
|-------|---------|
| **Commodity close-ups** | Gold bars/bullion, rough diamonds, platinum ingots, tanzanite crystals |
| **African mining landscapes** | Witwatersrand, Merelani Hills (Tanzania), Kimberley, Bushveld Complex |
| **Secure environments** | Vault interiors, refined assay labs, secure logistics |
| **Professional people** | Diverse African business professionals in formal/corporate settings |
| **Digital + physical** | Tablet/laptop overlaid with physical commodity -- bridging digital platform and physical trade |

### Photography Style

- High quality, well-lit, professional grade
- Desaturated slightly to let the emerald UI colors stand out
- Avoid overly stock-photo feel -- authenticity matters in this market
- African settings and faces should be prominent, not tokenistic
- No cryptocurrency imagery, blockchain graphics, or generic tech abstractions

### Textures & Patterns (Optional)

- Subtle gold/metallic textures for premium tier backgrounds
- Geological/mineral patterns as section dividers or backgrounds
- Topographic contour lines (mining exploration maps) as subtle decorative elements

---

## 10. Application Contexts

### Where Branding Will Appear

| Context | Notes |
|---------|-------|
| **Web application** | Primary platform -- Next.js/React, shadcn/ui components, responsive |
| **Landing/marketing page** | Currently built, needs professional imagery and possible refinement |
| **Email templates** | Transactional emails (password reset, deal invitations, status updates) |
| **PDF exports** | Audit logs, commission reports, compliance documents |
| **Investor/pitch materials** | Revenue model presentations, partnership proposals |
| **Legal documents** | Terms of service, NCNDA/IMFPA templates |
| **Social media** | LinkedIn primarily (B2B market), Twitter/X |
| **Business cards** | For sales team |
| **Conference materials** | Minerals Council SA events, Mining Indaba, SADPMR dealer networks |

---

## 11. Competitive Visual Landscape

Understanding how competitors look helps differentiate:

| Competitor | Visual Identity |
|------------|----------------|
| **Intralinks** (VDR) | Dark navy blue, corporate, enterprise-heavy |
| **Datasite** (VDR) | Bright blue/cyan, clean modern SaaS |
| **Escrow.com** | Green/blue, consumer-friendly, simple |
| **Truzo** (SA escrow) | Purple/violet, modern fintech |
| **ION Commodities** (CTRM) | Dark blue/gray, enterprise, dense |
| **Aspect Enterprise** (CTRM) | Blue/teal, corporate |

**DealVault's differentiation:** Emerald green + neutral foundation. Professional but not corporate-heavy. African-rooted without being folksy. Premium without being exclusionary.

---

## 12. Deliverables Requested

### Priority 1 (Immediate)
- [ ] Logo design (all variants listed in Section 6)
- [ ] Favicon and app icon
- [ ] Color palette finalization (confirm emerald direction or propose alternatives)
- [ ] Brand guidelines document (1-2 pages of rules)

### Priority 2 (Near-term)
- [ ] Landing page hero imagery or illustration
- [ ] Commodity icon set (gold, diamonds, platinum, tanzanite) in brand style
- [ ] Pricing tier visual treatments (Prospect/Reef/Sovereign/Vault)
- [ ] Email template header/footer design

### Priority 3 (Future)
- [ ] Social media templates (LinkedIn banners, post templates)
- [ ] Pitch deck template
- [ ] Conference banner/rollup design
- [ ] Business card design

---

## 13. Reference Files

| File | Location | Description |
|------|----------|-------------|
| Landing page (live) | https://dealvault.isutech.co.za | Current marketing page with all sections |
| Revenue model | `DOCS/REVENUE-MODEL.md` | Full pricing tiers, market positioning, competitive landscape |
| Global CSS | `src/app/globals.css` | Theme tokens, light/dark mode values |
| Landing page code | `src/app/page.tsx` | Complete component with all sections and styling |
| Testing guide | `DOCS/TESTING-GUIDE.md` | Feature descriptions and workflow details |

---

*DealVault Branding Brief v1.0 -- March 2026*
*Prepared by ISU Tech for graphic design partners*
