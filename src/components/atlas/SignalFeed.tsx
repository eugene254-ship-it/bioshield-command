import { useMemo, useState } from "react";
import { RISK_META, type OutbreakSignal, type SignalType } from "@/lib/atlas-data";
import { Activity, Bird, Wheat, HelpCircle, TrendingUp, Radio, Filter, X } from "lucide-react";
import type { LiveEvent } from "@/hooks/useLiveFeed";

const TYPE_ICON = { human: Activity, animal: Bird, crop: Wheat, unknown: HelpCircle };
const TYPES: SignalType[] = ["human", "animal", "crop", "unknown"];

interface Props {
  signals: OutbreakSignal[];
  events: LiveEvent[];
  selectedId: string | null;
  onSelect: (s: OutbreakSignal) => void;
}

export function SignalFeed({ signals, events, selectedId, onSelect }: Props) {
  const regions = useMemo(
    () => Array.from(new Set(signals.map((s) => s.region))).sort(),
    [signals]
  );
  const [region, setRegion] = useState<string>("all");
  const [activeTypes, setActiveTypes] = useState<Set<SignalType>>(new Set(TYPES));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleType = (t: SignalType) =>
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });

  const filtered = signals.filter(
    (s) => (region === "all" || s.region === region) && activeTypes.has(s.type)
  );

  const sorted = [...filtered].sort((a, b) => {
    const order = { critical: 0, high: 1, unknown: 2, medium: 3, low: 4 };
    return order[a.level] - order[b.level] || b.severity - a.severity;
  });
  const newIds = new Set(events.filter((e) => (e.kind === "new" || e.kind === "manual") && Date.now() - e.at < 20000).map((e) => e.signalId));
  const activeFilterCount = (region !== "all" ? 1 : 0) + (activeTypes.size !== TYPES.length ? 1 : 0);

  return (
    <div className="flex h-full flex-col panel rounded-lg overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Signal Intelligence</div>
          <div className="text-sm font-medium">Live Bio-Signals</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] uppercase tracking-wider transition ${
              filtersOpen || activeFilterCount > 0
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border bg-card/60 text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Filter className="h-3 w-3" />
            Filter{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
          </button>
          <div className="flex items-center gap-1.5 text-[10px] text-risk-low">
            <Radio className="h-3 w-3" />
            <span className="h-1.5 w-1.5 rounded-full bg-risk-low animate-pulse" />
            WS
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="border-b border-border bg-background/40 px-4 py-3 space-y-2">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Region</div>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded border border-border bg-card/60 px-2 py-1.5 text-xs outline-none focus:border-primary"
            >
              <option value="all">All regions ({signals.length})</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r} ({signals.filter((s) => s.region === r).length})
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Type</div>
            <div className="flex flex-wrap gap-1">
              {TYPES.map((t) => {
                const Icon = TYPE_ICON[t];
                const on = activeTypes.has(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] uppercase tracking-wider transition ${
                      on ? "border-primary/60 bg-primary/15 text-primary" : "border-border bg-card/40 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setRegion("all"); setActiveTypes(new Set(TYPES)); }}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>
      )}

      {events.length > 0 && (
        <div className="border-b border-border bg-background/40 px-4 py-2 max-h-20 overflow-y-auto scrollbar-thin">
          {events.slice(0, 3).map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-[10px] py-0.5">
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                e.kind === "new" ? "bg-primary" : e.kind === "escalation" ? "bg-risk-critical" : e.kind === "manual" ? "bg-risk-medium" : "bg-risk-low"
              }`} />
              <span className="text-muted-foreground uppercase tracking-wider mr-1">{e.kind}</span>
              <span className="text-foreground/85 truncate flex-1">{e.text}</span>
              <span className="font-mono text-muted-foreground">{Math.floor((Date.now() - e.at) / 1000)}s</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No signals match the current filters.
          </div>
        )}
        {sorted.map((s) => {
          const Icon = TYPE_ICON[s.type];
          const meta = RISK_META[s.level];
          const selected = selectedId === s.id;
          const isNew = newIds.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`group relative w-full border-b border-border/60 px-4 py-3 text-left transition hover:bg-accent/40 ${selected ? "bg-accent/60" : ""}`}
            >
              {isNew && (
                <span className="absolute right-2 top-2 rounded bg-primary/20 px-1.5 py-0.5 text-[8px] font-mono uppercase text-primary border border-primary/40">
                  NEW
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border"
                  style={{ background: `${meta.color}22`, borderColor: `${meta.color}55` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <span className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider shrink-0"
                      style={{ background: `${meta.color}22`, color: meta.color }}>
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
