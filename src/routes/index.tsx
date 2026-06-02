import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SIGNALS, type OutbreakSignal } from "@/lib/atlas-data";
import { TopBar } from "@/components/atlas/TopBar";
import { GlobalMap } from "@/components/atlas/GlobalMap";
import { SignalFeed } from "@/components/atlas/SignalFeed";
import { OutbreakTimeline } from "@/components/atlas/OutbreakTimeline";
import { ResponseBar } from "@/components/atlas/ResponseBar";
import { AICopilot } from "@/components/atlas/AICopilot";

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
  const [selectedId, setSelectedId] = useState<string | null>(SIGNALS[0].id);
  const selected: OutbreakSignal | null = SIGNALS.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-background bg-grid">
      <TopBar />

      <main className="flex-1 min-h-0 grid gap-3 p-3 grid-cols-1 lg:grid-cols-[320px_1fr_360px]">
        <div className="min-h-0 hidden lg:block">
          <SignalFeed selectedId={selectedId} onSelect={(s) => setSelectedId(s.id)} />
        </div>

        <div className="min-h-0 flex flex-col gap-3">
          <div className="flex-1 min-h-0">
            <GlobalMap selectedId={selectedId} onSelect={(s) => setSelectedId(s.id)} />
          </div>
          <ResponseBar signal={selected} />
        </div>

        <div className="min-h-0 hidden lg:block">
          {selected && <OutbreakTimeline signal={selected} />}
        </div>

        {/* Mobile stacks */}
        <div className="lg:hidden min-h-0 grid gap-3">
          <div className="h-[60vh]"><SignalFeed selectedId={selectedId} onSelect={(s) => setSelectedId(s.id)} /></div>
          {selected && <div className="h-[60vh]"><OutbreakTimeline signal={selected} /></div>}
        </div>
      </main>

      <AICopilot signal={selected} />
    </div>
  );
}
