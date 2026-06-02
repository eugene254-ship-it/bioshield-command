import { Dna, Globe2, Radio } from "lucide-react";
import { SIGNALS } from "@/lib/atlas-data";

export function TopBar() {
  const critical = SIGNALS.filter((s) => s.level === "critical").length;
  const high = SIGNALS.filter((s) => s.level === "high").length;
  const unknown = SIGNALS.filter((s) => s.level === "unknown").length;
  return (
    <header className="flex items-center justify-between border-b border-border bg-card/40 backdrop-blur px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 items-center justify-center rounded border border-primary/50 bg-primary/10 glow-primary">
          <Dna className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">ATLAS <span className="text-primary">BioShield</span></div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Planetary Nervous System · v0.1</div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4 text-[11px] font-mono">
        <Stat icon={Radio} label="STREAMS" value="247" />
        <Stat dot="var(--risk-critical)" label="CRITICAL" value={critical} />
        <Stat dot="var(--risk-high)" label="HIGH" value={high} />
        <Stat dot="var(--risk-unknown)" label="UNKNOWN" value={unknown} />
        <Stat icon={Globe2} label="COVERAGE" value="94 nations" />
      </div>

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
        <span className="flex items-center gap-1.5 rounded border border-risk-low/40 bg-risk-low/10 px-2 py-1 text-risk-low">
          <span className="h-1.5 w-1.5 rounded-full bg-risk-low animate-pulse" />
          Systems Nominal
        </span>
      </div>
    </header>
  );
}

function Stat({ icon: Icon, dot, label, value }: { icon?: React.ComponentType<{ className?: string }>; dot?: string; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot, boxShadow: `0 0 8px ${dot}` }} />}
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
