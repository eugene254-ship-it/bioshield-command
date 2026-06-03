import { useMemo, useState } from "react";
import { GitCompare, X } from "lucide-react";
import type { OutbreakSignal } from "@/lib/atlas-data";
import { STRATEGIES, simulate, type StrategyKey, type RichSim } from "@/lib/atlas-sim";

const ALL_KEYS: StrategyKey[] = ["none", "diagnostics", "hospitals", "lockdown", "vaccine"];

export function ScenarioCompare({ signal }: { signal: OutbreakSignal | null }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<StrategyKey[]>(["none", "diagnostics", "lockdown"]);

  const sims: RichSim[] = useMemo(
    () => selected.map((k) => simulate(signal, 72, k)),
    [signal, selected]
  );

  const toggle = (k: StrategyKey) =>
    setSelected((prev) =>
      prev.includes(k) ? prev.filter((p) => p !== k) : prev.length < 4 ? [...prev, k] : prev
    );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!signal}
        className="flex items-center gap-1 rounded border border-border bg-card/60 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <GitCompare className="h-3 w-3" /> Compare Scenarios
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-lg panel shadow-2xl glow-primary">
            <div className="flex items-center justify-between border-b border-border px-5 py-3 sticky top-0 bg-card/95 backdrop-blur z-10">
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Scenario Comparison · 72h</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Target: {signal?.name ?? "—"}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="border-b border-border px-5 py-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Containment Strategies (select up to 4)</div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_KEYS.map((k) => {
                  const on = selected.includes(k);
                  const st = STRATEGIES[k];
                  return (
                    <button
                      key={k}
                      onClick={() => toggle(k)}
                      className={`rounded border px-2.5 py-1 text-[11px] transition ${on ? "border-primary/70 bg-primary/15 text-primary" : "border-border bg-card/40 text-muted-foreground hover:border-primary/40"}`}
                    >
                      {on ? "● " : "○ "}{st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`grid gap-3 p-5 ${sims.length === 1 ? "" : sims.length === 2 ? "md:grid-cols-2" : sims.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"}`}>
              {sims.map((sim) => <ScenarioCard key={sim.strategy} sim={sim} />)}
              {sims.length === 0 && (
                <div className="col-span-full text-center text-xs text-muted-foreground py-8">
                  Select at least one strategy to compare.
                </div>
              )}
            </div>

            {sims.length >= 2 && <DeltaSummary sims={sims} />}
          </div>
        </div>
      )}
    </>
  );
}

function ScenarioCard({ sim }: { sim: RichSim }) {
  const st = STRATEGIES[sim.strategy];
  const max = Math.max(...sim.hourly);
  const peak = max.toFixed(2);
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium" style={{ color: st.color }}>{st.label}</div>
          <div className="text-[10px] text-muted-foreground">{st.sub}</div>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground text-right">
          vel ×{st.velMul.toFixed(2)}<br/>sev ×{st.sevMul.toFixed(2)}
        </div>
      </div>

      <div>
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Predicted Heatmap</div>
        <div className="flex items-end gap-0.5 h-14">
          {sim.hourly.map((v, i) => {
            const hue = 25 + (1 - v) * 130;
            return (
              <div key={i} className="flex-1 rounded-sm"
                style={{ height: `${10 + v * 90}%`, background: `oklch(0.70 0.22 ${hue})` }} />
            );
          })}
        </div>
        <div className="flex justify-between text-[8px] font-mono text-muted-foreground mt-0.5">
          <span>T+0</span><span>T+36h</span><span>T+72h</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <Mini label="Tier-1" value={sim.hospital.tier1} />
        <Mini label="Tier-2" value={sim.hospital.tier2} />
        <Mini label="ICU" value={sim.hospital.icu} critical={sim.hospital.icu > 70} />
      </div>

      <div className="font-mono text-[10px] text-muted-foreground">
        Peak load <span className="text-foreground">{peak}</span> · ICU cap at <span className="text-risk-critical">{sim.hospital.bedsHit}</span>
      </div>
    </div>
  );
}

function Mini({ label, value, critical }: { label: string; value: number; critical?: boolean }) {
  const color = critical ? "var(--risk-critical)" : "var(--color-primary)";
  return (
    <div className="rounded border border-border/60 bg-card/40 p-1.5">
      <div className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm" style={{ color }}>{value}<span className="text-[8px] text-muted-foreground">%</span></div>
    </div>
  );
}

function DeltaSummary({ sims }: { sims: RichSim[] }) {
  const baseline = sims[0];
  return (
    <div className="border-t border-border px-5 py-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        Δ vs {STRATEGIES[baseline.strategy].label}
      </div>
      <div className="space-y-1">
        {sims.slice(1).map((s) => {
          const dIcu = s.hospital.icu - baseline.hospital.icu;
          const dPeak = Math.max(...s.hourly) - Math.max(...baseline.hourly);
          const ok = dIcu < 0;
          return (
            <div key={s.strategy} className="flex items-center gap-3 text-[11px] font-mono">
              <span className="w-40 truncate text-foreground/90">{STRATEGIES[s.strategy].label}</span>
              <span className={ok ? "text-risk-low" : "text-risk-critical"}>
                ICU {dIcu >= 0 ? "+" : ""}{dIcu}%
              </span>
              <span className={dPeak < 0 ? "text-risk-low" : "text-risk-critical"}>
                Peak {dPeak >= 0 ? "+" : ""}{(dPeak * 100).toFixed(0)}
              </span>
              <span className="text-muted-foreground">
                {ok ? "↓ averted load" : "↑ added load"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
