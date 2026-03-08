import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  FileCheck,
  Users,
  Link2,
  FlaskConical,
  Banknote,
  MapPin,
  ArrowRight,
  Check,
  Star,
  ChevronRight,
  Scale,
  Eye,
  Globe,
  Bot,
  ShieldAlert,
  ScanSearch,
  Bell,
  Radio,
  FileSearch,
} from "lucide-react";
import { PlatformMetrics } from "@/components/landing/PlatformMetrics";
import { PricingSection } from "@/components/landing/PricingSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="DealVault" width={28} height={28} />
            <span className="text-xl font-bold">DealVault</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              <Image src="/logo.png" alt="" width={16} height={16} />
              Secure commodity deal rooms for Southern Africa
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Secure Deal Rooms for
              <span className="text-emerald-600"> High-Value</span> Commodity Trades
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              The only platform that combines deal management, escrow workflow, and chain of custody tracking for gold, diamond, platinum, and tanzanite transactions.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                  See How It Works
                </Button>
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required. 7-day full access trial.
            </p>
          </div>

          {/* Dynamic trust metrics */}
          <PlatformMetrics />
        </section>

        {/* Problem Statement */}
        <section className="border-y bg-muted/30">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">The Problem with Commodity Trading Today</h2>
              <p className="mt-4 text-muted-foreground">
                African commodity trades worth billions are managed through WhatsApp, email, and paper trails. The result? Billions lost annually to fraud, no audit trails, and Letters of Credit that cost 3-10% of deal value.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
              {[
                { icon: Eye, title: "No Visibility", desc: "Deals negotiated across fragmented channels. No single source of truth for documents, parties, or status." },
                { icon: Scale, title: "Expensive Trust", desc: "Letters of Credit cost 3-10% all-in. Bank escrow costs 2-4%. For a $5M deal, that is $150K-$500K in fees." },
                { icon: Link2, title: "Custody Gaps", desc: "No verification that tested gold is the same gold delivered. Commodity swaps between testing and delivery are a known fraud vector." },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border bg-background p-6">
                  <item.icon className="h-6 w-6 text-red-500 mb-3" />
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Everything You Need to Close Commodity Deals</h2>
            <p className="mt-4 text-muted-foreground">
              From first contact to fund release — one platform for the entire deal lifecycle.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Lock, title: "Secure Deal Rooms", desc: "Tamper-proof document hashing, party verification, and immutable audit trails for every transaction." },
              { icon: FileCheck, title: "Document Management", desc: "Upload SPA, NCNDA, IMFPA, BCL, POF with visibility controls — deal-wide, side-only, or private." },
              { icon: Users, title: "Multi-Party Coordination", desc: "Manage sellers, buyers, mandates, and intermediaries with side-based confidentiality controls." },
              { icon: Banknote, title: "Escrow Workflow", desc: "6-phase state machine: listing, documentation, buyer review, testing, fund blocking, and release." },
              { icon: Link2, title: "Chain of Custody", desc: "5-point tracking with GPS, photo & video evidence, seal verification, and dual-party confirmation at every checkpoint." },
              { icon: FlaskConical, title: "Testing & Verification", desc: "Record assay results, inspector details, and link certificates. Intermediary-managed, visible to all parties." },
              { icon: MapPin, title: "GPS Evidence", desc: "Capture geotagged photos at each checkpoint. Cryptographic hashing ensures photos are tamper-proof." },
              { icon: Globe, title: "Designed for Compliance", desc: "Audit trails, chain of custody records, and document management designed to support SADPMR, FICA/AML, and Kimberley Process requirements." },
              { icon: Shield, title: "Weight Variance Detection", desc: "Automatic alerts when commodity weight differs by more than 0.01% between checkpoints." },
              { icon: Bot, title: "AI Deal Room Assistant", desc: "Ask questions about deal status, timeline, and next steps. AI-powered insights with full deal context." },
              { icon: ShieldAlert, title: "AI Risk Scoring", desc: "Automated risk assessment analyzes deal value, party verification, document completeness, and flags concerns." },
              { icon: ScanSearch, title: "Anomaly Detection", desc: "AI scans for suspicious patterns — weight variances, unusual deal velocity, commission outliers, and new accounts." },
              { icon: Radio, title: "Real-Time Updates", desc: "Live deal room updates — instant and always in sync. See messages, status changes, and document uploads the moment they happen." },
              { icon: Bell, title: "Email Notifications", desc: "Transactional emails for party invitations, status changes, and document uploads. Never miss a deal update." },
              { icon: FileSearch, title: "Document Intelligence", desc: "AI analyzes uploaded document metadata to suggest relevant deal fields and streamline processing." },
            ].map((feature) => (
              <div key={feature.title} className="rounded-lg border p-6 hover:border-emerald-200 hover:shadow-sm transition-all dark:hover:border-emerald-800">
                <feature.icon className="h-7 w-7 text-emerald-600 mb-3" />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-y bg-muted/30">
          <div className="container mx-auto px-4 py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">How DealVault Works</h2>
              <p className="mt-4 text-muted-foreground">
                Six phases from deal creation to fund release, with custody verification at every step.
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-4xl">
              <div className="grid gap-0">
                {[
                  { phase: "1", title: "Listing", desc: "Create a deal room, set commodity details and value, invite all parties (seller, buyer, intermediaries, mandates)." },
                  { phase: "2", title: "Documentation", desc: "Upload SPA, NCNDA, IMFPA, BCL, POF, and all required documents. Each file is cryptographically hashed for integrity." },
                  { phase: "3", title: "Buyer Review", desc: "Buyer reviews all documentation and submits formal approval. Side-based messaging keeps communications confidential." },
                  { phase: "4", title: "Testing & Verification", desc: "Intermediary coordinates assay testing. Results recorded with inspector details and linked to verification certificates." },
                  { phase: "5", title: "Fund Blocking", desc: "Buyer blocks funds in escrow. Seller confirms receipt. Both parties verified before proceeding." },
                  { phase: "6", title: "Fund Release", desc: "Chain of custody must be complete — all 5 checkpoints verified by both sides — before funds are released." },
                ].map((step, i) => (
                  <div key={step.phase} className="flex gap-4 pb-8 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold flex-shrink-0">
                        {step.phase}
                      </div>
                      {i < 5 && <div className="w-px flex-1 bg-emerald-200 dark:bg-emerald-800 mt-2" />}
                    </div>
                    <div className="pb-4">
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Chain of Custody Highlight */}
        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-2 items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  <Link2 className="h-3 w-3" />
                  Industry First
                </div>
                <h2 className="text-2xl font-bold sm:text-3xl">Chain of Custody That Prevents Commodity Swaps</h2>
                <p className="mt-4 text-muted-foreground">
                  The biggest vulnerability in commodity trading: tested gold gets swapped before delivery. DealVault closes this gap with 5-point custody tracking that both sides must independently verify.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Tamper-evident seal ID tracking from origin to delivery",
                    "Geotagged photo & video evidence at every checkpoint",
                    "Weight variance auto-detection (>0.01% threshold)",
                    "Dual-party confirmation — both buyer and seller must verify",
                    "Fund release blocked until all checkpoints are verified",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border bg-muted/50 p-6">
                <div className="space-y-4">
                  {[
                    { num: "1", label: "Origin Sampling", status: "verified" },
                    { num: "2", label: "Testing / Assay", status: "verified" },
                    { num: "3", label: "Storage / Vault", status: "verified" },
                    { num: "4", label: "Transit", status: "active" },
                    { num: "5", label: "Delivery", status: "pending" },
                  ].map((cp) => (
                    <div key={cp.num} className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                        cp.status === "verified" ? "bg-emerald-500 text-white" :
                        cp.status === "active" ? "bg-blue-500 text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {cp.status === "verified" ? <Check className="h-4 w-4" /> : cp.num}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{cp.label}</span>
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-full ${
                        cp.status === "verified" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        cp.status === "active" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {cp.status === "verified" ? "Both sides confirmed" :
                         cp.status === "active" ? "Evidence submitted" : "Pending"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Commodities Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Built for African Commodity Markets</h2>
            <p className="mt-4 text-muted-foreground">
              Purpose-built for the commodities that drive Southern and East African economies.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { name: "Gold", detail: "Bullion, dust, recycled" },
              { name: "Diamonds", detail: "Rough & polished" },
              { name: "Platinum", detail: "PGMs, sponge, ingots" },
              { name: "Tanzanite", detail: "Rough & cut stones" },
            ].map((c) => (
              <div key={c.name} className="rounded-lg border p-5 text-center hover:border-emerald-200 transition-colors dark:hover:border-emerald-800">
                <div className="text-lg font-bold">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-emerald-600 dark:bg-emerald-900">
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to Secure Your Next Deal?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-emerald-100">
              Join commodity traders across Southern Africa who use DealVault to manage high-value transactions with full audit trails and chain of custody verification.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto">
                  Start Free Trial
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-emerald-200">
              No credit card required. 7-day full access trial.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t">
          <div className="container mx-auto px-4 py-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="DealVault" width={24} height={24} />
                <span className="font-bold">DealVault</span>
                <span className="text-xs text-muted-foreground ml-2">Secure Commodity Deal Rooms</span>
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
                <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              </div>
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} DealVault. Built by ISU Tech.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
