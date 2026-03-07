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

  function applyTemplate(template: typeof DEAL_TEMPLATES[0]) {
    setTitle(template.title);
    setCommodity(template.commodity);
    setCommissionPool(String(template.commissionPool));
    toast.info(`Template "${template.name}" applied`);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: title || (formData.get("title") as string),
      commodity,
      quantity: parseFloat(formData.get("quantity") as string),
      unit: formData.get("unit") as string,
      value: parseFloat(formData.get("value") as string),
      currency: formData.get("currency") as string,
      commissionPool:
        parseFloat(commissionPool || (formData.get("commissionPool") as string) || "2") / 100,
    };

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to create deal");
        setLoading(false);
        return;
      }

      const deal = await res.json();
      toast.success("Deal room created");
      router.push(`/deals/${deal.id}`);
    } catch {
      setError("Something went wrong");
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
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
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
                <Select name="currency" defaultValue="USD">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ZAR">ZAR</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Deal Room..." : "Create Deal Room"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
