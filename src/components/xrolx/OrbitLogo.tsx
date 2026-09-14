import { Sparkles } from "lucide-react";

export function OrbitLogo({ size = 28 }: { size?: number }) {
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full border border-mint/40"
        style={{ animation: "orbit-spin 8s linear infinite" }}
      >
        <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-mint ring-glow" />
      </div>
      <div
        className="absolute inset-[18%] rounded-full border border-mint-glow/30"
        style={{ animation: "orbit-spin 5s linear infinite reverse" }}
      >
        <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-mint-glow" />
      </div>
      <Sparkles
        className="relative text-mint"
        style={{ width: size * 0.42, height: size * 0.42 }}
      />
    </div>
  );
}
