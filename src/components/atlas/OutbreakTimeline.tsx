import { useEffect, useState } from "react";
import { RISK_META, type OutbreakSignal } from "@/lib/atlas-data";
import { ShieldCheck, FlaskConical, Radio, Siren, Lock, Play, Pause, RotateCcw, ChevronDown, ChevronRight, Copy, Check, FileDown } from "lucide-react";
import { auditHash, sourceDetail } from "@/hooks/useLiveFeed";
import { exportSignalReport } from "@/lib/atlas-report";


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
  const [playing, setPlaying] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setHour(maxHour); setPlaying(false); }, [signal.id, maxHour]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setHour((h) => {
        if (h >= maxHour) { setPlaying(false); return maxHour; }
        return h + 1;
      });
    }, 180);
    return () => clearInterval(id);
  }, [playing, maxHour]);

  const meta = RISK_META[signal.level];
  const activeEvents = signal.timeline.filter((t) => t.hour <= hour);
  const currentStage = activeEvents.at(-1)?.stage ?? "detected";
  const fullHash = auditHash(signal.id + signal.name);

  const copy = () => {
    navigator.clipboard?.writeText(fullHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col panel rounded-lg overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Outbreak Timeline</div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => exportSignalReport(signal)}
              className="flex items-center gap-1 rounded border border-primary/50 bg-primary/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-primary hover:bg-primary/20"
              title="Export PDF report (timeline + 72h simulation)"
            >
              <FileDown className="h-3 w-3" /> PDF
            </button>
            <span className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                  style={{ background: `${meta.color}22`, color: meta.color }}>
              {STAGE_META[currentStage].label}
            </span>
          </div>
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
              <div key={ev.hour} className={`relative pl-9 pb-4 transition-opacity ${active ? "" : "opacity-25"}`}>
                <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border"
                  style={{
                    background: active ? `${S.color}22` : "transparent",
                    borderColor: active ? S.color : "var(--color-border)",
                    boxShadow: active ? `0 0 12px ${S.color}55` : "none",
                  }}>
                  <S.icon className="h-3 w-3" style={{ color: active ? S.color : "var(--color-muted-foreground)" }} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium flex items-center gap-1.5">
                    {ev.label}
                    {active && (
                      <span className="rounded bg-risk-low/15 px-1 py-0.5 text-[8px] uppercase tracking-wider text-risk-low">
                        verified
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">T+{ev.hour}h</div>
                </div>
                <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{ev.detail}</div>
              </div>
            );
          })}
        </div>

        {/* Trust & Verification */}
        <div className="mt-2 rounded border border-border bg-card/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Trust & Verification</div>
            <span className="rounded bg-risk-low/15 px-1.5 py-0.5 text-[9px] uppercase text-risk-low">chain-of-custody</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <Badge label="Sources" value={`${signal.sources.length} verified`} ok />
            <Badge label="Lab" value={signal.level === "unknown" ? "BSL-3 Pending" : "Confirmed"} ok={signal.level !== "unknown"} />
            <Badge label="AI Conf" value={`${(signal.confidence * 100).toFixed(0)}%`} ok={signal.confidence > 0.6} />
            <Badge label="Stage" value={STAGE_META[currentStage].label} ok />
          </div>

          <div className="mt-3 rounded border border-border/60 bg-background/40 p-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              <span>Audit Hash</span>
              <button onClick={copy} className="flex items-center gap-1 hover:text-primary">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "copied" : "copy"}
              </button>
            </div>
            <div className="font-mono text-[10px] break-all text-foreground/80 leading-relaxed">
              {fullHash}
            </div>
          </div>

          <button
            onClick={() => setSourcesOpen((o) => !o)}
            className="mt-3 flex w-full items-center justify-between rounded border border-border/60 bg-background/40 px-2 py-1.5 text-[11px] hover:border-primary/40"
          >
            <span className="text-muted-foreground">Source Details · {signal.sources.length}</span>
            {sourcesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {sourcesOpen && (
            <div className="mt-2 space-y-1.5">
              {signal.sources.map((src) => {
                const d = sourceDetail(src, signal.id);
                const ok = d.reliability >= 80;
                return (
                  <div key={src} className="rounded border border-border/50 bg-background/30 p-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{src}</span>
                      <span className={ok ? "text-risk-low" : "text-risk-medium"}>● {ok ? "ONLINE" : "DEGRADED"}</span>
                    </div>
                    <div className="mt-1 grid grid-cols-3 gap-2 font-mono text-[10px] text-muted-foreground">
                      <span>lat {d.latency}ms</span>
                      <span>rel {d.reliability}%</span>
                      <span className="truncate">{d.hash}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Time scrubber with play/pause */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          <span>Time Scrubber</span>
          <span className="font-mono text-primary">T+{hour}h</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (hour >= maxHour) setHour(0); setPlaying((p) => !p); }}
            className="flex h-7 w-7 items-center justify-center rounded border border-primary/60 bg-primary/15 text-primary hover:bg-primary/25"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
          <button
            onClick={() => { setHour(0); setPlaying(false); }}
            className="flex h-7 w-7 items-center justify-center rounded border border-border bg-card/60 text-muted-foreground hover:text-foreground"
            aria-label="Reset"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <input
            type="range" min={0} max={maxHour} value={hour}
            onChange={(e) => { setHour(Number(e.target.value)); setPlaying(false); }}
            className="flex-1 accent-primary"
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
          <span>T+0</span><span>T+{Math.floor(maxHour / 2)}h</span><span>T+{maxHour}h</span>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  const color = ok ? "var(--risk-low)" : "var(--risk-medium)";
  return (
    <div className="flex items-center justify-between rounded border border-border/70 px-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
  );
}
