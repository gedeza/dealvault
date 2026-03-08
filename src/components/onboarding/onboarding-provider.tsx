"use client";

import { useEffect, useState, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "@/styles/onboarding.css";
import { WelcomeDialog } from "./welcome-dialog";

const STORAGE_KEY = "dealvault_onboarding_complete";

const tourSteps = [
  {
    element: "[data-tour='sidebar-nav']",
    popover: {
      title: "Navigation",
      description: "Use the sidebar to navigate between dashboard sections. Access your deals, companies, reports, and profile from here.",
      side: "right" as const,
    },
  },
  {
    element: "[data-tour='dashboard-stats']",
    popover: {
      title: "Portfolio Overview",
      description: "Track your deal portfolio at a glance — total deals, active deals, portfolio value, and pending invitations.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='nav-deals']",
    popover: {
      title: "Deal Rooms",
      description: "Create and manage secure deal rooms for your commodity transactions. Each room has documents, parties, messages, and an audit trail.",
      side: "right" as const,
    },
  },
  {
    element: "[data-tour='nav-companies']",
    popover: {
      title: "Companies",
      description: "Manage your company profiles and track which entities are involved in your deals.",
      side: "right" as const,
    },
  },
  {
    element: "[data-tour='nav-reports']",
    popover: {
      title: "Reports & Analytics",
      description: "View interactive charts and analytics across your deal portfolio — volume trends, commodity distribution, and more.",
      side: "right" as const,
    },
  },
  {
    element: "[data-tour='nav-profile']",
    popover: {
      title: "Profile & Security",
      description: "Update your profile, enable two-factor authentication, and manage your security settings.",
      side: "right" as const,
    },
  },
  {
    element: "[data-tour='new-deal-btn']",
    popover: {
      title: "Create a Deal Room",
      description: "Ready to get started? Click here to create your first deal room and begin tracking a commodity transaction.",
      side: "top" as const,
    },
  },
];

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        steps: tourSteps,
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Done",
        onDestroyed: () => {
          localStorage.setItem(STORAGE_KEY, "true");
        },
      });
      driverObj.drive();
    }, 300);
  }, []);

  const skipTour = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  return (
    <>
      {children}
      <WelcomeDialog open={showWelcome} onTakeTour={startTour} onSkip={skipTour} />
    </>
  );
}

export function restartOnboardingTour() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}
