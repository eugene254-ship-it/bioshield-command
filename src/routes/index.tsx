import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { type OutbreakSignal } from "@/lib/atlas-data";
import { LEVEL_RANK } from "@/lib/atlas-sim";
import { TopBar } from "@/components/atlas/TopBar";
import { GlobalMap } from "@/components/atlas/GlobalMap";
import { SignalFeed } from "@/components/atlas/SignalFeed";
import { OutbreakTimeline } from "@/components/atlas/OutbreakTimeline";
import { ResponseBar } from "@/components/atlas/ResponseBar";
import { AICopilot } from "@/components/atlas/AICopilot";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { loadRules, type AlertRule } from "@/components/atlas/AlertRulesDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas BioShield — Global Bio-Risk Command Surface" },
      { name: "description", content: "Live planetary bio-risk command center: see what is happening, where, how fast, and what to do next." },
      { property: "og:title", content: "Atlas BioShield — Planetary Nervous System" },
      { property: "og:description", content: "Real-time global outbreak surveillance, AI copilot, and response orchestration." },
    ],
  }),
  component: AtlasDashboard,
});

function AtlasDashboard() {
  const { signals, events, addSignal } = useLiveFeed();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => { setRules(loadRules()); }, []);
  useEffect(() => {
    if (!selectedId && signals[0]) setSelectedId(signals[0].id);
  }, [signals, selectedId]);

  // Alert engine — fire toast when a signal newly crosses a rule threshold
  useEffect(() => {
    const active = rules.filter((r) => r.enabled);
    if (active.length === 0) return;
    for (const s of signals) {
      const sRank = LEVEL_RANK[s.level] ?? 0;
      for (const r of active) {
        if (r.region !== "*" && r.region !== s.region) continue;
        const tRank = LEVEL_RANK[r.threshold] ?? 99;
        if (sRank >= tRank) {
          const key = `${r.id}:${s.id}:${s.level}`;
          if (!firedRef.current.has(key)) {
            firedRef.current.add(key);
            toast.warning(`${s.level.toUpperCase()} threshold crossed`, {
              description: `${s.name} — ${s.country} · ${s.region}`,
              action: { label: "View", onClick: () => setSelectedId(s.id) },
            });
          }
        }
      }
    }
  }, [signals, rules]);

  const regions = useMemo(() => Array.from(new Set(signals.map((s) => s.region))).sort(), [signals]);
  const selected: OutbreakSignal | null = signals.find((s) => s.id === selectedId) ?? signals[0] ?? null;

  return (
    <div className="flex h-screen flex-col bg-background bg-grid">
      <TopBar
        signals={signals}
        regions={regions}
        rules={rules}
        setRules={setRules}
        onIntake={(inc) => {
          const ns = addSignal(inc);
          setSelectedId(ns.id);
          toast.success("Incident filed", { description: `${ns.name} plotted on the map.` });
        }}
      />

      <main className="flex-1 min-h-0 grid gap-3 p-3 grid-cols-1 lg:grid-cols-[320px_1fr_360px]">
        <div className="min-h-0 hidden lg:block">
          <SignalFeed signals={signals} events={events} selectedId={selectedId} onSelect={(s) => setSelectedId(s.id)} />
        </div>

        <div className="min-h-0 flex flex-col gap-3">
          <div className="flex-1 min-h-0">
            <GlobalMap signals={signals} selectedId={selectedId} onSelect={(s) => setSelectedId(s.id)} />
          </div>
          <ResponseBar signal={selected} />
        </div>

        <div className="min-h-0 hidden lg:block">
          {selected && <OutbreakTimeline signal={selected} />}
        </div>

        <div className="lg:hidden min-h-0 grid gap-3">
          <div className="h-[60vh]">
            <SignalFeed signals={signals} events={events} selectedId={selectedId} onSelect={(s) => setSelectedId(s.id)} />
          </div>
          {selected && <div className="h-[60vh]"><OutbreakTimeline signal={selected} /></div>}
        </div>
      </main>

      <AICopilot signal={selected} />
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}
