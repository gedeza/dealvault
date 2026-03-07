import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Lock, FileCheck, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-bold">DealVault</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Secure Commodity Deal Rooms
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            The trusted platform for South African gold and diamond transactions.
            Verify parties, manage documents, and track deals with complete
            audit trails.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                <Shield className="h-4 w-4" />
                Create Your Deal Room
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-24">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border p-6">
              <Lock className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="text-lg font-semibold">Secure & Verified</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                SHA-256 document hashing, party verification, and immutable
                audit trails for every transaction.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <FileCheck className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="text-lg font-semibold">Document Management</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload and manage SPA, NCNDA, IMFPA, BCL, POF, and all
                required transaction documents in one place.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <Users className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="text-lg font-semibold">Multi-Party Deals</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage sellers, buyers, mandates, and intermediaries with
                side-based confidentiality controls.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
