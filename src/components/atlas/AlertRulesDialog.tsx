import { useEffect, useState } from "react";
import { BellRing, X, Trash2, Plus } from "lucide-react";
import type { RiskLevel } from "@/lib/atlas-data";

export interface AlertRule {
  id: string;
  region: string; // "*" for all
  threshold: Exclude<RiskLevel, "low">;
  enabled: boolean;
}

const KEY = "atlas.alertRules.v1";
const LEVELS: AlertRule["threshold"][] = ["medium", "high", "critical", "unknown"];

export function loadRules(): AlertRule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [
      { id: "r-default", region: "*", threshold: "critical", enabled: true },
    ];
    return JSON.parse(raw);
  } catch { return []; }
}

export function saveRules(rules: AlertRule[]) {
  try { localStorage.setItem(KEY, JSON.stringify(rules)); } catch {}
}

interface Props {
  regions: string[];
  rules: AlertRule[];
  setRules: (r: AlertRule[]) => void;
}

export function AlertRulesDialog({ regions, rules, setRules }: Props) {
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState("*");
  const [threshold, setThreshold] = useState<AlertRule["threshold"]>("high");

  useEffect(() => { saveRules(rules); }, [rules]);

  const add = () => {
    const id = `r-${Date.now().toString(36)}`;
    setRules([...rules, { id, region, threshold, enabled: true }]);
  };
  const toggle = (id: string) =>
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  const remove = (id: string) => setRules(rules.filter((r) => r.id !== id));

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded border border-border bg-card/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:border-primary/50 hover:text-primary"
      >
        <BellRing className="h-3 w-3" /> Alerts · {activeCount}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-lg panel shadow-2xl glow-primary">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Alert Rules</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Notify when risk level crosses threshold</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="rounded border border-border bg-background/40 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">New Rule</div>
                <div className="flex flex-wrap gap-2 items-end">
                  <label className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <span className="text-[9px] uppercase text-muted-foreground">Region</span>
                    <select value={region} onChange={(e) => setRegion(e.target.value)} className="rounded border border-border bg-card/60 px-2 py-1.5 text-xs">
                      <option value="*">All regions</option>
                      {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase text-muted-foreground">Threshold ≥</span>
                    <select value={threshold} onChange={(e) => setThreshold(e.target.value as AlertRule["threshold"])} className="rounded border border-border bg-card/60 px-2 py-1.5 text-xs">
                      {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </label>
                  <button onClick={add} className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90">
                    <Plus className="h-3 w-3" /> Add Rule
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Configured Rules · {rules.length}</div>
                {rules.length === 0 && (
                  <div className="rounded border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    No rules. Add one above to receive alerts.
                  </div>
                )}
                {rules.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 rounded border border-border bg-card/40 px-3 py-2 text-xs">
                    <button
                      onClick={() => toggle(r.id)}
                      className={`h-4 w-7 rounded-full transition relative ${r.enabled ? "bg-primary" : "bg-border"}`}
                      aria-label="Toggle rule"
                    >
                      <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-background transition ${r.enabled ? "left-3.5" : "left-0.5"}`} />
                    </button>
                    <div className="flex-1">
                      <span className="text-foreground/90">{r.region === "*" ? "All regions" : r.region}</span>
                      <span className="text-muted-foreground"> · alert when level ≥ </span>
                      <span className="font-mono uppercase text-primary">{r.threshold}</span>
                    </div>
                    <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-risk-critical">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
