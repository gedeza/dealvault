"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES, formatCurrency, convertCurrency } from "@/lib/currency";
import { ArrowRightLeft } from "lucide-react";

interface CurrencyConverterProps {
  amount: number;
  currency: string;
}

export function CurrencyConverter({ amount, currency }: CurrencyConverterProps) {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [targetCurrency, setTargetCurrency] = useState(currency === "USD" ? "ZAR" : "USD");

  useEffect(() => {
    fetch("/api/exchange-rates")
      .then((res) => res.json())
      .then((data) => {
        if (data.rates) setRates(data.rates);
      })
      .catch(() => {});
  }, []);

  if (!rates) return null;

  const converted = convertCurrency(amount, currency, targetCurrency, rates);
  const otherCurrencies = SUPPORTED_CURRENCIES.filter((c) => c.code !== currency);

  return (
    <div className="flex items-center gap-2 text-sm">
      <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="font-medium tabular-nums">{formatCurrency(converted, targetCurrency)}</span>
      <Select value={targetCurrency} onValueChange={setTargetCurrency}>
        <SelectTrigger className="h-7 w-[90px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {otherCurrencies.map((c) => (
            <SelectItem key={c.code} value={c.code} className="text-xs">
              {c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
