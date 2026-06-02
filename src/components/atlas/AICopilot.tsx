import { useState } from "react";
import { Sparkles, Send, X, Brain } from "lucide-react";
import type { OutbreakSignal } from "@/lib/atlas-data";

interface Msg { role: "user" | "ai"; text: string }

const SUGGESTIONS = [
  "Simulate spread in 72 hours",
  "Compare with past influenza patterns",
  "Recommend containment strategy",
  "Is this real or noise?",
];

function generateReply(q: string, signal: OutbreakSignal | null): string {
  const ctx = signal ? `${signal.name} (${signal.country})` : "global surface";
  if (/spread/i.test(q)) return `Projected 72h spread for ${ctx}: 3 secondary clusters likely within 600km radius. R-effective 2.1 ± 0.3. Confidence ${signal ? (signal.confidence * 100).toFixed(0) : 70}%.`;
  if (/influenza|past|history|compare/i.test(q)) return `Pattern match: 71% similarity to 2009 H1N1 early-window signature. Velocity profile diverges after T+48h — atypical.`;
  if (/contain|strategy|recommend/i.test(q)) return `Recommended: 1) deploy mobile diagnostics within 200km, 2) alert tier-1 hospitals, 3) pre-position antivirals via supply chain route A-4, 4) advisory to regional authority within 6h.`;
  if (/real|noise|false/i.test(q)) return `Signal triangulation indicates 78% probability of true positive. Multi-source corroboration (clinical + wastewater) reduces false-alarm risk to <8%.`;
  return `Analyzing ${ctx}… cross-referencing 14 data layers. Provide a more specific query or use a suggestion below.`;
}

export function AICopilot({ signal }: { signal: OutbreakSignal | null }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Atlas Copilot online. Monitoring 247 signal streams. What do you need to know?" },
  ]);

  function send(text: string) {
    const t = text.trim(); if (!t) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setTimeout(() => setMsgs((m) => [...m, { role: "ai", text: generateReply(t, signal) }]), 400);
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
        <div className="fixed bottom-40 right-6 z-40 flex w-[380px] max-w-[calc(100vw-3rem)] flex-col rounded-lg panel shadow-2xl glow-primary"
             style={{ height: "min(520px, 70vh)" }}>
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

          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`text-[13px] leading-relaxed ${m.role === "user" ? "text-right" : ""}`}>
                {m.role === "ai" && (
                  <div className="text-[9px] uppercase tracking-wider text-primary/80 mb-1">Atlas</div>
                )}
                <div className={m.role === "user"
                  ? "inline-block rounded-lg bg-primary/15 border border-primary/30 px-3 py-2 text-foreground"
                  : "rounded-lg bg-card/60 border border-border px-3 py-2"}>
                  {m.text}
                </div>
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
