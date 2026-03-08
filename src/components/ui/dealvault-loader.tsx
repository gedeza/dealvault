import Image from "next/image";

interface DealVaultLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { logo: 48, ring: "h-16 w-16", glow: "h-14 w-14" },
  md: { logo: 72, ring: "h-24 w-24", glow: "h-20 w-20" },
  lg: { logo: 96, ring: "h-28 w-28", glow: "h-24 w-24" },
};

export function DealVaultLoader({ message = "Loading DealVault", size = "lg" }: DealVaultLoaderProps) {
  const s = sizeMap[size];

  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-5 animate-in fade-in duration-500">
        <div className="relative flex items-center justify-center">
          <div
            className={`absolute ${s.ring} rounded-full border-2 border-emerald-500/30 animate-ping`}
            style={{ animationDuration: "2s" }}
          />
          <div
            className={`absolute ${s.glow} rounded-full bg-emerald-500/10 animate-pulse`}
            style={{ animationDuration: "1.5s" }}
          />
          <Image
            src="/logo.png"
            alt="DealVault"
            width={s.logo}
            height={s.logo}
            className="relative z-10"
            style={{ animation: "dealvault-breathe 2s ease-in-out infinite" }}
          />
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>{message}</span>
          <span className="flex gap-0.5">
            <span className="animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1s" }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: "150ms", animationDuration: "1s" }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: "300ms", animationDuration: "1s" }}>.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
