"use client";

import { useState, useCallback } from "react";
import { toUSDEquivalent } from "@/lib/currency";

const HIGH_VALUE_THRESHOLD = 1_000_000;

export function useTwoFactor() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [resolveRef, setResolveRef] = useState<((token: string | null) => void) | null>(null);

  const checkTwoFactorStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(data.twoFactorEnabled || false);
        return data.twoFactorEnabled || false;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  const requireVerification = useCallback((dealValue: number, currency: string): boolean => {
    return toUSDEquivalent(dealValue, currency) >= HIGH_VALUE_THRESHOLD;
  }, []);

  const verify = useCallback(async (): Promise<string | null> => {
    await checkTwoFactorStatus();
    setIsVerifying(true);

    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  }, [checkTwoFactorStatus]);

  const onVerified = useCallback((token: string) => {
    setIsVerifying(false);
    resolveRef?.(token);
    setResolveRef(null);
  }, [resolveRef]);

  const onClose = useCallback(() => {
    setIsVerifying(false);
    resolveRef?.(null);
    setResolveRef(null);
  }, [resolveRef]);

  return {
    requireVerification,
    verify,
    isVerifying,
    twoFactorEnabled,
    onVerified,
    onClose,
    modalProps: {
      open: isVerifying,
      onClose,
      onVerified,
      twoFactorEnabled,
    },
  };
}
