"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

interface CurrencySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
}

export function CurrencySelector({ value, onValueChange, name }: CurrencySelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange} name={name}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs">{c.code}</span>
              <span className="text-muted-foreground text-xs">({c.symbol})</span>
              <span className="text-xs">{c.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
