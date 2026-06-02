import { SIGNALS, RISK_META, type OutbreakSignal } from "@/lib/atlas-data";
import { Activity, Bird, Wheat, HelpCircle, TrendingUp } from "lucide-react";

const TYPE_ICON = { human: Activity, animal: Bird, crop: Wheat, unknown: HelpCircle };

interface Props {
  selectedId: string | null;
  onSelect: (s: OutbreakSignal) => void;
}

export function SignalFeed({ selectedId, onSelect }: Props) {
  const sorted = [...SIGNALS].sort((a, b) => b.severity - a.severity);
  return (
    <div className="flex h-full flex-col panel rounded-lg overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Signal Intelligence</div>
          <div className="text-sm font-medium">Live Bio-Signals</div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-risk-low">
          <span className="h-1.5 w-1.5 rounded-full bg-risk-low animate-pulse" />
          STREAMING
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sorted.map((s) => {
          const Icon = TYPE_ICON[s.type];
          const meta = RISK_META[s.level];
          const selected = selectedId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`group w-full border-b border-border/60 px-4 py-3 text-left transition hover:bg-accent/40 ${selected ? "bg-accent/60" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border"
                  style={{ background: `${meta.color}22`, borderColor: `${meta.color}55` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                      style={{ background: `${meta.color}22`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {s.country} · {s.region} · {s.detectedAgo}
                  </div>
                  <div className="mt-1.5 text-[12px] leading-snug text-foreground/85 line-clamp-2">
                    {s.description}
                  </div>
                  <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" style={{ color: meta.color }} />
                      <span style={{ color: meta.color }}>↑ {s.velocity.toFixed(1)}x</span> 48h
                    </span>
                    <span>conf {(s.confidence * 100).toFixed(0)}%</span>
                    <span>sev {(s.severity * 100).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
