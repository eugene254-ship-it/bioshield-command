import { useEffect, useState } from "react";
import { RISK_META, type OutbreakSignal } from "@/lib/atlas-data";
import { ShieldCheck, FlaskConical, Radio, Siren, Lock } from "lucide-react";

const STAGE_META = {
  detected:    { label: "Detected",    icon: Radio,        color: "var(--risk-high)" },
  verifying:   { label: "Verifying",   icon: FlaskConical, color: "var(--risk-medium)" },
  spreading:   { label: "Spreading",   icon: Siren,        color: "var(--risk-critical)" },
  intervening: { label: "Intervening", icon: ShieldCheck,  color: "var(--color-primary)" },
  contained:   { label: "Contained",   icon: Lock,         color: "var(--risk-low)" },
} as const;

interface Props { signal: OutbreakSignal }

export function OutbreakTimeline({ signal }: Props) {
  const maxHour = Math.max(72, ...signal.timeline.map((t) => t.hour));
  const [hour, setHour] = useState(maxHour);
  useEffect(() => { setHour(maxHour); }, [signal.id, maxHour]);
  const meta = RISK_META[signal.level];
  const activeEvents = signal.timeline.filter((t) => t.hour <= hour);
  const currentStage = activeEvents.at(-1)?.stage ?? "detected";

  return (
    <div className="flex h-full flex-col panel rounded-lg overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Outbreak Timeline</div>
          <span className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                style={{ background: `${meta.color}22`, color: meta.color }}>
            {STAGE_META[currentStage].label}
          </span>
        </div>
        <div className="mt-1 text-sm font-medium">{signal.name}</div>
        <div className="text-[11px] text-muted-foreground">{signal.country} · ID {signal.id.toUpperCase()}</div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        <div className="relative">
          <div className="absolute left-3 top-1 bottom-1 w-px bg-border" />
          {signal.timeline.map((ev) => {
            const S = STAGE_META[ev.stage];
            const active = ev.hour <= hour;
            return (
              <div key={ev.hour} className={`relative pl-9 pb-4 ${active ? "" : "opacity-30"}`}>
                <div
                  className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border"
                  style={{
                    background: active ? `${S.color}22` : "transparent",
                    borderColor: active ? S.color : "var(--color-border)",
                    boxShadow: active ? `0 0 12px ${S.color}55` : "none",
                  }}
                >
                  <S.icon className="h-3 w-3" style={{ color: active ? S.color : "var(--color-muted-foreground)" }} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium">{ev.label}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">T+{ev.hour}h</div>
                </div>
                <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{ev.detail}</div>
              </div>
            );
          })}
        </div>

        {/* Verification badges */}
        <div className="mt-2 rounded border border-border bg-card/50 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Trust & Verification</div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <Badge label="Source" value={`${signal.sources.length} verified`} ok />
            <Badge label="Lab" value={signal.level === "unknown" ? "Pending" : "Confirmed"} ok={signal.level !== "unknown"} />
            <Badge label="AI Conf" value={`${(signal.confidence * 100).toFixed(0)}%`} ok={signal.confidence > 0.6} />
            <Badge label="Audit" value={`0x${signal.id.slice(-3)}a${signal.id.slice(-3)}f`} ok mono />
          </div>
        </div>
      </div>

      {/* Time scrubber */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          <span>Time Scrubber</span>
          <span className="font-mono text-primary">T+{hour}h</span>
        </div>
        <input
          type="range" min={0} max={maxHour} value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
          <span>T+0</span><span>T+{Math.floor(maxHour / 2)}h</span><span>T+{maxHour}h</span>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, value, ok, mono }: { label: string; value: string; ok?: boolean; mono?: boolean }) {
  const color = ok ? "var(--risk-low)" : "var(--risk-medium)";
  return (
    <div className="flex items-center justify-between rounded border border-border/70 px-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono" : ""} style={{ color }}>{value}</span>
    </div>
  );
}
