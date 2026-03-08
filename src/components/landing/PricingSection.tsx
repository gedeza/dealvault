"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X, Star } from "lucide-react";

const tiers = [
  {
    name: "Prospect",
    tagline: "Individual brokers & small traders",
    monthlyPrice: 299,
    annualPrice: 249,
    annualTotal: "$2,988/yr",
    savings: "Save $600",
    limits: "5 deals | 3 users | 5 GB | Up to $2M",
    cta: "Start 7-Day Trial",
    ctaHref: "/register?plan=prospect",
    ctaVariant: "outline" as const,
    popular: false,
    features: [
      { text: "Deal rooms & status tracking", included: true },
      { text: "Document management + tamper-proof hashing", included: true },
      { text: "Multi-party coordination (6 parties)", included: true },
      { text: "Deal-level messaging", included: true },
      { text: "Commission ledger (view)", included: true },
      { text: "Automated deal status tracking", included: true },
      { text: "Email support (48hr)", included: true },
      { text: "Basic admin dashboard", included: true },
      { text: "Escrow workflow (6-phase)", included: false },
      { text: "Chain of custody tracking", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Reef",
    tagline: "Established brokers & mid-size firms",
    monthlyPrice: 899,
    annualPrice: 749,
    annualTotal: "$8,988/yr",
    savings: "Save $1,800",
    limits: "20 deals | 10 users | 25 GB | Up to $15M",
    cta: "Start 7-Day Free Trial",
    ctaHref: "/register?plan=reef",
    ctaVariant: "default" as const,
    popular: true,
    features: [
      { text: "Everything in Prospect", included: true },
      { text: "Escrow workflow (6-phase)", included: true },
      { text: "Fund blocking & release tracking", included: true },
      { text: "Basic verification management", included: true },
      { text: "Private & side messaging", included: true },
      { text: "Full commission CRUD", included: true },
      { text: "Full admin dashboard", included: true },
      { text: "VAT compliance audit trail", included: true },
      { text: "Audit log export (CSV)", included: true },
      { text: "Email support (24hr)", included: true },
      { text: "Chain of custody tracking", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Sovereign",
    tagline: "Large trading houses & mining companies",
    monthlyPrice: 1799,
    annualPrice: 1499,
    annualTotal: "$17,988/yr",
    savings: "Save $3,600",
    limits: "75 deals | 30 users | 100 GB | Up to $50M",
    cta: "Start 7-Day Free Trial",
    ctaHref: "/register?plan=sovereign",
    ctaVariant: "outline" as const,
    popular: false,
    features: [
      { text: "Everything in Reef", included: true },
      { text: "Chain of custody tracking", included: true },
      { text: "GPS & photo checkpoints", included: true },
      { text: "Dual-party confirmation", included: true },
      { text: "Weight variance detection", included: true },
      { text: "Full verification management", included: true },
      { text: "FICA/SADPMR compliance reporting", included: true },
      { text: "Kimberley Process tracking", included: true },
      { text: "API access (10K req/day)", included: true },
      { text: "Audit export (CSV + PDF)", included: true },
      { text: "Phone support + AM (8hr)", included: true },
    ],
  },
  {
    name: "Vault",
    tagline: "Institutions, banks & government",
    monthlyPrice: null,
    annualPrice: null,
    annualTotal: "From $42,000/yr",
    savings: null,
    limits: "Unlimited deals | Unlimited users | 1 TB+ | No cap",
    cta: "Contact Sales",
    ctaHref: "mailto:sales@dealvault.co.za",
    ctaVariant: "outline" as const,
    popular: false,
    features: [
      { text: "Everything in Sovereign", included: true },
      { text: "Custom escrow workflows", included: true },
      { text: "White-label / custom branding", included: true },
      { text: "SSO / SAML integration", included: true },
      { text: "Unlimited API + webhooks", included: true },
      { text: "Custom compliance reporting", included: true },
      { text: "On-premises deployment", included: true },
      { text: "Multi-tenant admin", included: true },
      { text: "Dedicated engineer support", included: true },
      { text: "Custom SLAs (99.9%)", included: true },
      { text: "Negotiated transaction fees (-25%)", included: true },
    ],
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="border-y bg-muted/30">
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Pricing Built for Commodity Trading
          </h2>
          <p className="mt-4 text-muted-foreground">
            85-93% cheaper than Letters of Credit. No free tier — because platforms
            handling $500K-$50M deals don&apos;t do free.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border bg-background p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                !annual
                  ? "bg-emerald-600 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                annual
                  ? "bg-emerald-600 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs opacity-80">-17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl bg-background p-6 relative flex flex-col ${
                tier.popular
                  ? "border-2 border-emerald-500 shadow-lg shadow-emerald-500/10"
                  : "border"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              {tier.name === "Vault" && (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{tier.name}</h3>
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
              )}
              {tier.name !== "Vault" && (
                <h3 className="text-lg font-bold">{tier.name}</h3>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {tier.tagline}
              </p>

              <div className="mt-4">
                {tier.monthlyPrice !== null ? (
                  <>
                    <span className="text-3xl font-bold">
                      ${annual ? tier.annualPrice : tier.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">/mo</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold">Custom</span>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {tier.monthlyPrice !== null ? (
                  annual ? (
                    <>
                      {tier.annualTotal}{" "}
                      <span className="text-emerald-600 font-medium">
                        {tier.savings}
                      </span>
                    </>
                  ) : (
                    "Billed monthly"
                  )
                ) : (
                  "From $3,500/mo — sales-led"
                )}
              </p>

              {/* Tier Limits */}
              <p className="mt-3 text-xs text-muted-foreground border-t pt-3">
                {tier.limits}
              </p>

              {/* Features */}
              <ul className="mt-4 space-y-2 flex-1">
                {tier.features.map((f) => (
                  <li key={f.text} className="flex gap-2 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={
                        f.included ? "" : "text-muted-foreground/50"
                      }
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={tier.ctaHref} className="block mt-6">
                <Button
                  variant={tier.ctaVariant}
                  className={`w-full ${
                    tier.popular
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : ""
                  }`}
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Transaction Fee Note */}
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Transaction fees</strong> apply at deal settlement (0.15%-1.00%
            of deal value, degressive by size). Capped per deal by tier.{" "}
            <Link
              href="mailto:sales@dealvault.co.za"
              className="text-emerald-600 hover:underline"
            >
              See full fee schedule
            </Link>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            All tiers include a 7-day free trial. No credit card required to start.
          </p>
        </div>
      </div>
    </section>
  );
}
