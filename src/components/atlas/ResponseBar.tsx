import { useState } from "react";
import { Truck, Hospital, Boxes, Bell, Syringe } from "lucide-react";
import type { OutbreakSignal } from "@/lib/atlas-data";
import { ScenarioCompare } from "@/components/atlas/ScenarioCompare";

const ACTIONS = [
  { id: "diag",   icon: Truck,    label: "Deploy Diagnostics", sub: "Mobile units" },
  { id: "hosp",   icon: Hospital, label: "Alert Hospitals",    sub: "Tier 1 + 2" },
  { id: "supply", icon: Boxes,    label: "Supply Routing",     sub: "Activate route A-4" },
  { id: "auth",   icon: Bell,     label: "Notify Authority",   sub: "Regional ministry" },
  { id: "vacc",   icon: Syringe,  label: "Vaccine Pipeline",   sub: "Trigger readiness" },
];

export function ResponseBar({ signal }: { signal: OutbreakSignal | null }) {
  const [active, setActive] = useState<Record<string, boolean>>({});
  return (
    <div className="panel rounded-lg px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Response Orchestration</div>
          <div className="text-xs text-foreground/80">
            {signal ? <>Target: <span className="text-primary">{signal.name}</span></> : "Select a signal to direct response"}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
          <span className="rounded border border-border bg-card/60 px-2 py-1 text-muted-foreground">DigitalTwin: <span className="text-foreground">Off</span></span>
          <ScenarioCompare signal={signal} />
          <button className="rounded border border-primary/60 bg-primary/15 px-2 py-1 text-primary hover:bg-primary/25">
            Switch to Simulation
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {ACTIONS.map((a) => {
          const on = active[a.id];
          return (
            <button
              key={a.id}
              disabled={!signal}
              onClick={() => setActive((s) => ({ ...s, [a.id]: !s[a.id] }))}
              className={`group flex items-center gap-3 rounded border px-3 py-2 text-left transition disabled:opacity-40 disabled:cursor-not-allowed
                ${on
                  ? "border-primary bg-primary/15 text-foreground glow-primary"
                  : "border-border bg-card/40 hover:border-primary/50 hover:bg-card/70"}`}
            >
              <a.icon className={`h-4 w-4 ${on ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{a.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {on ? "● ACTIVE" : a.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
