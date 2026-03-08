"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COMMODITIES, UNITS, type Commodity } from "@/types";
import { toast } from "sonner";
import { useTwoFactor } from "@/hooks/use-two-factor";
import { TwoFactorModal } from "@/components/security/two-factor-modal";
import { CurrencySelector } from "@/components/currency/currency-selector";
import { ShieldCheck } from "lucide-react";

const DEAL_TEMPLATES = [
  {
    name: "Gold Bullion Purchase",
    commodity: "gold" as Commodity,
    unit: "kg",
    commissionPool: 2,
    title: "Gold Bullion Purchase",
  },
  {
    name: "Diamond Rough Sale",
    commodity: "diamonds" as Commodity,
    unit: "carats",
    commissionPool: 3,
    title: "Diamond Rough Stone Sale",
  },
  {
    name: "Platinum Export",
    commodity: "platinum" as Commodity,
    unit: "kg",
    commissionPool: 1.5,
    title: "Platinum Group Metals Export",
  },
];

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [commodity, setCommodity] = useState<Commodity>("gold");
  const [title, setTitle] = useState("");
  const [commissionPool, setCommissionPool] = useState("2");
  const [currency, setCurrency] = useState("USD");
  const { requireVerification, verify, isVerifying, modalProps } = useTwoFactor();

  function applyTemplate(template: typeof DEAL_TEMPLATES[0]) {
    setTitle(template.title);
    setCommodity(template.commodity);
    setCommissionPool(String(template.commissionPool));
    toast.info(`Template "${template.name}" applied`);
  }

  async function createDeal(formData: FormData, verificationToken?: string) {
    const data = {
      title: title || (formData.get("title") as string),
      commodity,
      quantity: parseFloat(formData.get("quantity") as string),
      unit: formData.get("unit") as string,
      value: parseFloat(formData.get("value") as string),
      currency,
      commissionPool:
        parseFloat(commissionPool || (formData.get("commissionPool") as string) || "2") / 100,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (verificationToken) {
      headers["X-2FA-Token"] = verificationToken;
    }

    const res = await fetch("/api/deals", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || "Failed to create deal");
    }

    return res.json();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const value = parseFloat(formData.get("value") as string);

    try {
      let verificationToken: string | undefined;

      // Check if 2FA verification is needed for high-value deals
      if (requireVerification(value, currency)) {
        try {
          const token = await verify();
          if (!token) {
            setLoading(false);
            return;
          }
          verificationToken = token;
        } catch {
          setLoading(false);
          return;
        }
      }

      const deal = await createDeal(formData, verificationToken);
      toast.success("Deal room created");
      router.push(`/deals/${deal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Deal Room</CardTitle>
          <CardDescription>
            Set up a secure deal room for your commodity transaction
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Quick Templates */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Quick Start Templates</Label>
              <div className="flex flex-wrap gap-2">
                {DEAL_TEMPLATES.map((t) => (
                  <Button
                    key={t.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(t)}
                    className="text-xs"
                  >
                    {t.name}
                  </Button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Deal Title</Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Gold Bullion Purchase - 50kg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commodity</Label>
                <Select
                  value={commodity}
                  onValueChange={(val) => setCommodity(val as Commodity)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMODITIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select name="unit" defaultValue={UNITS[commodity][0]}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS[commodity].map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                placeholder="e.g., 50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Deal Value</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 3000000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <CurrencySelector value={currency} onValueChange={setCurrency} />
              </div>
            </div>

            {/* High-value deal notice */}
            <HighValueNotice />

            <div className="space-y-2">
              <Label htmlFor="commissionPool">Commission Pool (%)</Label>
              <Input
                id="commissionPool"
                name="commissionPool"
                type="number"
                step="0.1"
                value={commissionPool}
                onChange={(e) => setCommissionPool(e.target.value)}
                min="0"
                max="100"
                required
              />
              <p className="text-xs text-muted-foreground">
                Total commission pool as a percentage of deal value, to be
                split among intermediaries
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || isVerifying}>
              {loading || isVerifying ? "Creating Deal Room..." : "Create Deal Room"}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* 2FA Verification Modal */}
      <TwoFactorModal {...modalProps} />
    </div>
  );
}

function HighValueNotice() {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
      <div className="flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
        <div className="text-xs text-emerald-800 dark:text-emerald-300">
          <p className="font-medium">High-Value Deal Security</p>
          <p className="mt-0.5 text-emerald-700 dark:text-emerald-400">
            Deals valued at $1,000,000 USD or more require two-factor
            authentication verification before creation.
          </p>
        </div>
      </div>
    </div>
  );
}
