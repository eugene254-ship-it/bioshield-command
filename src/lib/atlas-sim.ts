import type { OutbreakSignal } from "@/lib/atlas-data";

export type StrategyKey = "none" | "diagnostics" | "hospitals" | "lockdown" | "vaccine";

export interface Strategy {
  key: StrategyKey;
  label: string;
  sub: string;
  velMul: number;
  sevMul: number;
  color: string;
}

export const STRATEGIES: Record<StrategyKey, Strategy> = {
  none:        { key: "none",        label: "No Intervention",    sub: "Baseline trajectory",         velMul: 1.0,  sevMul: 1.0,  color: "var(--risk-critical)" },
  diagnostics: { key: "diagnostics", label: "Mobile Diagnostics", sub: "Early detection cordon",      velMul: 0.85, sevMul: 0.92, color: "var(--risk-high)" },
  hospitals:   { key: "hospitals",   label: "Hospital Surge",     sub: "Tier-1/2 capacity surge",     velMul: 0.95, sevMul: 0.80, color: "var(--color-primary)" },
  lockdown:    { key: "lockdown",    label: "Mobility Lockdown",  sub: "Travel & gathering controls", velMul: 0.55, sevMul: 0.70, color: "var(--risk-unknown)" },
  vaccine:     { key: "vaccine",     label: "Vaccine Pipeline",   sub: "Ring vaccination",            velMul: 0.65, sevMul: 0.55, color: "var(--risk-low)" },
};

export interface RichSim {
  kind: "simulation";
  signal: string;
  hours: number;
  strategy: StrategyKey;
  spreadZones: { name: string; intensity: number; eta: number }[];
  hourly: number[];
  hospital: { tier1: number; tier2: number; icu: number; bedsHit: string };
  recommendation: string;
}

export function simulate(signal: OutbreakSignal | null, hours = 72, strategyKey: StrategyKey = "none"): RichSim {
  const st = STRATEGIES[strategyKey];
  const base = (signal?.severity ?? 0.5) * st.sevMul;
  const vel = Math.max(0.6, (signal?.velocity ?? 1.5) * st.velMul);
  const buckets = Math.floor(hours / 6);
  const hourly = Array.from({ length: buckets }, (_, i) => {
    const t = i / buckets;
    return Math.min(1, base * Math.pow(vel, t * 2) * (0.6 + 0.4 * Math.sin(t * Math.PI)));
  });
  const peak = Math.max(...hourly);
  const zones = signal
    ? [
        { name: `${signal.country} · ${signal.region}`, intensity: peak, eta: 0 },
        { name: "Secondary cluster (200km radius)", intensity: peak * 0.72, eta: 18 },
        { name: "Tertiary spread (regional hub)",    intensity: peak * 0.48, eta: 42 },
        { name: "Long-haul migration node",           intensity: peak * 0.31, eta: 66 },
      ]
    : [{ name: "Global baseline", intensity: 0.2, eta: 0 }];
  const tier1 = Math.floor(40 + peak * 50);
  const tier2 = Math.floor(25 + peak * 40);
  const icu   = Math.floor(15 + peak * 65);
  return {
    kind: "simulation",
    signal: signal?.name ?? "Global surface",
    hours,
    strategy: strategyKey,
    spreadZones: zones,
    hourly,
    hospital: { tier1, tier2, icu, bedsHit: icu > 70 ? "T+36h" : "T+54h" },
    recommendation:
      icu > 70
        ? "Deploy mobile diagnostics within 6h; pre-position ICU surge capacity; advisory to regional authority."
        : "Monitor closely; activate tier-1 hospital alerts; queue supply routing for T+24h decision point.",
  };
}

export const LEVEL_RANK: Record<string, number> = { low: 0, unknown: 1, medium: 2, high: 3, critical: 4 };
