import { useEffect, useRef, useState, useCallback } from "react";
import { SIGNALS, type OutbreakSignal, type RiskLevel, type SignalType } from "@/lib/atlas-data";

export interface LiveEvent {
  id: string;
  kind: "new" | "escalation" | "verified";
  signalId: string;
  text: string;
  at: number;
}

const POTENTIAL_NEW: Array<Omit<OutbreakSignal, "id" | "detectedAgo" | "timeline">> = [
  { name: "Lagos Coastal Anomaly", region: "West Africa", country: "Nigeria", lon: 3.38, lat: 6.45, type: "human", level: "high", severity: 0.58, velocity: 1.6, confidence: 0.66, sources: ["Clinic intake LG-12", "Wastewater sensor NG-03"], description: "Sudden GI cluster, etiology under investigation." },
  { name: "Yangtze Aquaculture Signal", region: "East Asia", country: "China", lon: 121.47, lat: 31.23, type: "animal", level: "medium", severity: 0.42, velocity: 1.3, confidence: 0.71, sources: ["Aquaculture monitor", "Provincial vet"], description: "Mass die-off across 3 fisheries — bacterial profile abnormal." },
  { name: "Buenos Aires Vector Spike", region: "South America", country: "Argentina", lon: -58.38, lat: -34.61, type: "human", level: "medium", severity: 0.48, velocity: 1.4, confidence: 0.73, sources: ["Vector surveillance", "5 clinics"], description: "Aedes density above seasonal baseline; arbovirus suspected." },
  { name: "Cairo Wastewater Marker", region: "North Africa", country: "Egypt", lon: 31.24, lat: 30.04, type: "unknown", level: "unknown", severity: 0.34, velocity: 1.2, confidence: 0.48, sources: ["Wastewater EG-02", "AI anomaly"], description: "Novel RNA fragment — no library match." },
  { name: "Stockholm Avian Marker", region: "Northern Europe", country: "Sweden", lon: 18.07, lat: 59.33, type: "animal", level: "high", severity: 0.55, velocity: 1.5, confidence: 0.77, sources: ["Wildlife monitor", "Vet network"], description: "Wild waterfowl mortality, H-strain probable." },
];

let seq = 1000;

function buildTimeline(base: number): OutbreakSignal["timeline"] {
  return [
    { hour: 0, stage: "detected", label: "First anomaly", detail: `Initial spike +${(base * 220).toFixed(0)}% over baseline` },
    { hour: 6, stage: "verifying", label: "Verification", detail: "Cross-source corroboration in progress" },
  ];
}

export function useLiveFeed() {
  const [signals, setSignals] = useState<OutbreakSignal[]>(() => SIGNALS.map((s) => ({ ...s })));
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(true);
  const [lastTick, setLastTick] = useState(Date.now());
  const tickRef = useRef(0);

  const pushEvent = useCallback((e: Omit<LiveEvent, "id" | "at">) => {
    const ev: LiveEvent = { ...e, id: `ev-${++seq}`, at: Date.now() };
    setEvents((prev) => [ev, ...prev].slice(0, 8));
  }, []);

  useEffect(() => {
    // Simulated WebSocket — replace .start() with real socket when backend exists
    const interval = setInterval(() => {
      tickRef.current += 1;
      setLastTick(Date.now());

      setSignals((prev) => {
        let next = prev.map((s) => {
          // jitter velocity ±10%
          const vel = Math.max(0.5, +(s.velocity + (Math.random() - 0.5) * 0.15).toFixed(2));
          const conf = Math.min(0.99, Math.max(0.3, +(s.confidence + (Math.random() - 0.5) * 0.04).toFixed(2)));
          return { ...s, velocity: vel, confidence: conf };
        });

        // every ~4 ticks, escalate a non-critical signal
        if (tickRef.current % 4 === 0) {
          const i = Math.floor(Math.random() * next.length);
          const s = next[i];
          if (s.level === "medium" || s.level === "high") {
            const nextLevel: RiskLevel = s.level === "medium" ? "high" : "critical";
            next[i] = { ...s, level: nextLevel, severity: Math.min(0.95, s.severity + 0.1) };
            pushEvent({ kind: "escalation", signalId: s.id, text: `${s.name} escalated → ${nextLevel.toUpperCase()}` });
          }
        }

        // every ~6 ticks, inject a brand new signal from the pool
        if (tickRef.current % 6 === 0 && next.length < SIGNALS.length + POTENTIAL_NEW.length) {
          const pool = POTENTIAL_NEW.filter((p) => !next.some((s) => s.name === p.name));
          if (pool.length) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            const newSig: OutbreakSignal = {
              ...pick,
              id: `sig-${++seq}`,
              detectedAgo: "just now",
              timeline: buildTimeline(pick.severity),
            };
            next = [newSig, ...next];
            pushEvent({ kind: "new", signalId: newSig.id, text: `New signal: ${newSig.name}` });
          }
        }

        return next;
      });
    }, 4500);

    return () => {
      clearInterval(interval);
      setConnected(false);
    };
  }, [pushEvent]);

  return { signals, events, connected, lastTick };
}

// Deterministic SHA-like hash for audit trails (display only)
export function auditHash(seed: string): string {
  let h1 = 0x811c9dc5, h2 = 0xdeadbeef;
  for (let i = 0; i < seed.length; i++) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 ^ seed.charCodeAt(i), 2246822507);
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  return `0x${hex(h1)}${hex(h2)}${hex(h1 ^ h2)}${hex(h2 + 1)}`;
}

export function sourceDetail(name: string, signalId: string) {
  const h = auditHash(name + signalId);
  const latency = (parseInt(h.slice(2, 6), 16) % 240) + 12;
  const reliability = 70 + (parseInt(h.slice(6, 10), 16) % 28);
  return { latency, reliability, hash: h.slice(0, 14) };
}

export const SIGNAL_TYPE_LAYER: Record<SignalType, "infection" | "agri" | "wastewater" | "travel"> = {
  human: "infection",
  animal: "infection",
  crop: "agri",
  unknown: "wastewater",
};
