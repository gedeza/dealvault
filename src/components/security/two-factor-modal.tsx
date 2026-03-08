"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Loader2 } from "lucide-react";
import Link from "next/link";

interface TwoFactorModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: (token: string) => void;
  twoFactorEnabled: boolean;
}

export function TwoFactorModal({ open, onClose, onVerified, twoFactorEnabled }: TwoFactorModalProps) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];

    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setDigits(newDigits);
      const lastFilled = Math.min(pasted.length - 1, 5);
      inputRefs.current[lastFilled]?.focus();
      return;
    }

    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [digits]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        onVerified(data.token);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!twoFactorEnabled) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 mb-2">
              <Shield className="h-7 w-7 text-amber-500" />
            </div>
            <DialogTitle>2FA Required for High-Value Deals</DialogTitle>
            <DialogDescription className="text-center">
              Deals valued at $1,000,000 or above require two-factor authentication.
              Please enable 2FA in your profile settings first.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Link href="/profile" className="flex-1">
              <Button className="w-full">Enable 2FA in Profile</Button>
            </Link>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 mb-2">
            <Shield className="h-7 w-7 text-emerald-500" />
          </div>
          <DialogTitle>Verify Your Identity</DialogTitle>
          <DialogDescription className="text-center">
            This high-value deal requires 2FA verification.
            Enter the 6-digit code from your authenticator app.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 mt-4">
          {digits.map((digit, i) => (
            <Input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                handleChange(i, pasted);
              }}
              className="h-12 w-12 text-center text-lg font-mono font-bold"
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center mt-2">{error}</p>
        )}

        <Button
          onClick={handleVerify}
          disabled={loading || digits.join("").length !== 6}
          className="w-full mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify & Continue"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
