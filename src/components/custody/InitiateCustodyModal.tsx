"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CUSTODIAN_TYPES, CUSTODIAN_TYPE_LABELS } from "@/types/workflow";

interface InitiateCustodyModalProps {
  dealId: string;
  onCreated: () => void;
}

export function InitiateCustodyModal({
  dealId,
  onCreated,
}: InitiateCustodyModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    sealId: "",
    custodianName: "",
    custodianType: "",
    custodianContact: "",
  });

  const handleSubmit = async () => {
    if (!form.sealId.trim()) {
      toast.error("Seal ID is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/custody`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sealId: form.sealId,
          custodianName: form.custodianName || undefined,
          custodianType: form.custodianType || undefined,
          custodianContact: form.custodianContact || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Chain of custody initiated");
        setOpen(false);
        setForm({ sealId: "", custodianName: "", custodianType: "", custodianContact: "" });
        onCreated();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to initiate custody");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Link2 className="h-4 w-4 mr-1" />
          Initiate Custody Tracking
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initiate Chain of Custody</DialogTitle>
          <DialogDescription>
            Start tracking the physical commodity from testing through to delivery.
            A unique seal ID will be recorded and verified at each checkpoint.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Seal ID *</Label>
            <Input
              placeholder="e.g., DV-2026-001-C001"
              value={form.sealId}
              onChange={(e) => setForm({ ...form, sealId: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              The unique identifier on the tamper-evident seal applied to the commodity.
            </p>
          </div>

          <div>
            <Label>Custodian Name</Label>
            <Input
              placeholder="e.g., Rand Refinery"
              value={form.custodianName}
              onChange={(e) => setForm({ ...form, custodianName: e.target.value })}
            />
          </div>

          <div>
            <Label>Custodian Type</Label>
            <Select
              value={form.custodianType}
              onValueChange={(v) => setForm({ ...form, custodianType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {CUSTODIAN_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {CUSTODIAN_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Custodian Contact</Label>
            <Input
              placeholder="Phone or email"
              value={form.custodianContact}
              onChange={(e) => setForm({ ...form, custodianContact: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !form.sealId.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Link2 className="h-4 w-4 mr-1" />}
            Initiate Custody
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
