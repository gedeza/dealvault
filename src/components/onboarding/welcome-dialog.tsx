"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WelcomeDialogProps {
  open: boolean;
  onTakeTour: () => void;
  onSkip: () => void;
}

export function WelcomeDialog({ open, onTakeTour, onSkip }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onSkip(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-2">
            <Image src="/logo.png" alt="DealVault" width={40} height={40} />
          </div>
          <DialogTitle className="text-xl">Welcome to DealVault!</DialogTitle>
          <DialogDescription className="text-center">
            Your secure platform for managing commodity deals with full audit trails,
            escrow workflows, and chain of custody tracking. Let us show you around.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={onTakeTour} className="flex-1 gap-2">
            Take the Tour
          </Button>
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Skip for Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
