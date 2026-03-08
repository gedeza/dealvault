"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ErrorBoundary } from "@/components/error-boundary";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [children]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-5 animate-in fade-in duration-500">
          {/* Logo with glow ring */}
          <div className="relative flex items-center justify-center">
            {/* Outer pulse ring */}
            <div className="absolute h-28 w-28 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: "2s" }} />
            {/* Inner glow ring */}
            <div className="absolute h-24 w-24 rounded-full bg-emerald-500/10 animate-pulse" style={{ animationDuration: "1.5s" }} />
            {/* Logo with breathing scale */}
            <Image
              src="/logo.png"
              alt="DealVault"
              width={96}
              height={96}
              className="relative z-10"
              style={{ animation: "breathe 2s ease-in-out infinite" }}
            />
          </div>
          {/* Animated loading text */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Loading DealVault</span>
            <span className="flex gap-0.5">
              <span className="animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1s" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms", animationDuration: "1s" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms", animationDuration: "1s" }}>.</span>
            </span>
          </div>
        </div>
        <style jsx>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }
        `}</style>
      </div>
    );
  }

  if (!session) return null;

  return (
    <OnboardingProvider>
      <div className="flex h-screen bg-background">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" />
            <div
              className="relative w-64 h-full animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar mobile />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
    </OnboardingProvider>
  );
}
