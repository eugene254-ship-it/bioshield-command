import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, Brain } from "lucide-react";
import type { OutbreakSignal } from "@/lib/atlas-data";
import { simulate, type RichSim } from "@/lib/atlas-sim";

interface Msg { role: "user" | "ai"; text?: string; rich?: RichSim }

const SUGGESTIONS = [
  "Run 72h spread simulation",
  "Compare with past influenza patterns",
  "Recommend containment strategy",
  "Is this real or noise?",
];


function textReply(q: string, signal: OutbreakSignal | null): string {
  const ctx = signal ? `${signal.name} (${signal.country})` : "global surface";
  if (/influenza|past|history|compare/i.test(q))
    return `Pattern match: 71% similarity to 2009 H1N1 early-window signature for ${ctx}. Velocity profile diverges after T+48h — atypical.`;
  if (/contain|strategy|recommend/i.test(q))
    return `Recommended for ${ctx}: 1) mobile diagnostics within 200km, 2) tier-1 hospital alerts, 3) pre-position antivirals via route A-4, 4) advisory to regional authority within 6h.`;
  if (/real|noise|false/i.test(q))
    return `Signal triangulation indicates ${signal ? (signal.confidence * 100).toFixed(0) : 78}% true-positive probability. Multi-source corroboration reduces false-alarm risk to <8%.`;
  return `Analyzing ${ctx}… cross-referencing 14 data layers. Try a specific query or use a suggestion below.`;
}

export function AICopilot({ signal }: { signal: OutbreakSignal | null }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Atlas Copilot online. Monitoring 247 signal streams. What do you need to know?" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  function send(text: string) {
    const t = text.trim(); if (!t) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");

    setTimeout(() => {
      if (/simulat|spread|72h|projection|heatmap|hospital/i.test(t)) {
        const hours = /48h/i.test(t) ? 48 : /24h/i.test(t) ? 24 : 72;
        const sim = simulate(signal, hours);
        setMsgs((m) => [
          ...m,
          { role: "ai", text: `Running ${hours}h spread simulation for ${sim.signal}…` },
          { role: "ai", rich: sim },
        ]);
      } else {
        setMsgs((m) => [...m, { role: "ai", text: textReply(t, signal) }]);
      }
    }, 350);
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-primary/60 bg-card/90 backdrop-blur glow-primary hover:scale-105 transition"
        aria-label="AI Copilot"
      >
        <Brain className="h-5 w-5 text-primary" />
      </button>

      {open && (
        <div className="fixed bottom-40 right-6 z-40 flex w-[420px] max-w-[calc(100vw-3rem)] flex-col rounded-lg panel shadow-2xl glow-primary"
             style={{ height: "min(600px, 80vh)" }}>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-medium">Atlas Copilot</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {signal ? `Context: ${signal.name}` : "Global context"}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`text-[13px] leading-relaxed ${m.role === "user" ? "text-right" : ""}`}>
                {m.role === "ai" && !m.rich && (
                  <div className="text-[9px] uppercase tracking-wider text-primary/80 mb-1">Atlas</div>
                )}
                {m.rich ? (
                  <SimCard sim={m.rich} />
                ) : (
                  <div className={m.role === "user"
                    ? "inline-block rounded-lg bg-primary/15 border border-primary/30 px-3 py-2 text-foreground"
                    : "rounded-lg bg-card/60 border border-border px-3 py-2"}>
                    {m.text}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border px-3 py-2">
            <div className="flex flex-wrap gap-1 mb-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                        className="rounded border border-border bg-card/40 px-2 py-1 text-[10px] text-muted-foreground hover:border-primary/50 hover:text-primary">
                  {s}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the bio-intelligence layer…"
                className="flex-1 rounded border border-border bg-input/50 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button type="submit" className="rounded bg-primary px-3 text-primary-foreground hover:opacity-90">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SimCard({ sim }: { sim: RichSim }) {
  const max = Math.max(...sim.hourly);
  return (
    <div className="rounded-lg border border-primary/40 bg-card/80 p-3 space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-primary">Spread Simulation · {sim.hours}h</div>
        <div className="text-[10px] font-mono text-muted-foreground">{sim.signal}</div>
      </div>

      {/* Heatmap bars */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Infection Load · 6h buckets</div>
        <div className="flex items-end gap-0.5 h-16">
          {sim.hourly.map((v, i) => {
            const hue = 25 + (1 - v / max) * 130; // red → yellow → green
            return (
              <div key={i} className="flex-1 rounded-sm transition-all"
                   style={{ height: `${10 + (v / max) * 90}%`, background: `oklch(0.70 0.22 ${hue})` }} />
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1">
          <span>T+0</span><span>T+{Math.floor(sim.hours / 2)}h</span><span>T+{sim.hours}h</span>
        </div>
      </div>

      {/* Spread zones */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Predicted Zones</div>
        <div className="space-y-1">
          {sim.spreadZones.map((z) => (
            <div key={z.name} className="flex items-center gap-2 text-[11px]">
              <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                <div className="h-full bg-risk-critical" style={{ width: `${z.intensity * 100}%` }} />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground w-12 text-right">T+{z.eta}h</span>
            </div>
          ))}
          <div className="space-y-0.5">
            {sim.spreadZones.map((z) => (
              <div key={`${z.name}-l`} className="text-[10px] text-foreground/75 truncate">{z.name}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Hospital load */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Hospital Load Projection</div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <Stat label="Tier-1" value={sim.hospital.tier1} />
          <Stat label="Tier-2" value={sim.hospital.tier2} />
          <Stat label="ICU"    value={sim.hospital.icu} critical={sim.hospital.icu > 70} />
        </div>
        <div className="text-[10px] text-muted-foreground mt-1 font-mono">
          Capacity threshold reached: <span className="text-risk-critical">{sim.hospital.bedsHit}</span>
        </div>
      </div>

      <div className="rounded border border-primary/30 bg-primary/10 p-2 text-[11px] leading-snug">
        <span className="text-[9px] uppercase tracking-wider text-primary mr-1">REC</span>
        {sim.recommendation}
      </div>
    </div>
  );
}

function Stat({ label, value, critical }: { label: string; value: number; critical?: boolean }) {
  const color = critical ? "var(--risk-critical)" : "var(--color-primary)";
  return (
    <div className="rounded border border-border/60 bg-background/40 p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-sm" style={{ color }}>{value}</span>
        <span className="text-[9px] text-muted-foreground">% util</span>
      </div>
    </div>
  );
}
