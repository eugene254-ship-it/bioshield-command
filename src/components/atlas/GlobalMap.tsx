import { useMemo, useState } from "react";
import { RISK_META, type OutbreakSignal } from "@/lib/atlas-data";

const W = 1000;
const H = 500;
function project(lon: number, lat: number) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return { x, y };
}

const TRAVEL_HUBS: Array<[string, number, number]> = [
  ["LHR", -0.45, 51.47], ["JFK", -73.78, 40.64], ["DXB", 55.36, 25.25],
  ["SIN", 103.99, 1.36], ["HKG", 113.91, 22.31], ["GRU", -46.48, -23.43],
  ["JNB", 28.24, -26.13], ["NRT", 140.39, 35.77], ["FRA", 8.57, 50.03],
];
const TRAVEL_ARCS: Array<[number, number]> = [
  [0,1],[0,2],[1,2],[2,3],[2,4],[3,4],[1,5],[5,6],[2,7],[0,8],[8,5],[7,4],
];

function useDotField() {
  return useMemo(() => {
    const land = [
      { lonMin: -168, lonMax: -52, latMin: 8, latMax: 72, density: 0.55 },
      { lonMin: -82, lonMax: -34, latMin: -56, latMax: 12, density: 0.55 },
      { lonMin: -18, lonMax: 52, latMin: -36, latMax: 38, density: 0.6 },
      { lonMin: -12, lonMax: 40, latMin: 36, latMax: 70, density: 0.55 },
      { lonMin: 40, lonMax: 180, latMin: 0, latMax: 75, density: 0.5 },
      { lonMin: 112, lonMax: 154, latMin: -44, latMax: -10, density: 0.55 },
    ];
    const dots: Array<{ x: number; y: number }> = [];
    let seed = 7;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (const box of land) {
      const area = (box.lonMax - box.lonMin) * (box.latMax - box.latMin);
      const n = Math.floor(area * box.density * 0.9);
      for (let i = 0; i < n; i++) {
        const lon = box.lonMin + rand() * (box.lonMax - box.lonMin);
        const lat = box.latMin + rand() * (box.latMax - box.latMin);
        if (lon > -100 && lon < -85 && lat > 18 && lat < 30 && rand() < 0.7) continue;
        if (lon > 40 && lon < 60 && lat > 12 && lat < 30 && rand() < 0.5) continue;
        dots.push(project(lon, lat));
      }
    }
    return dots;
  }, []);
}

type LayerKey = "infection" | "travel" | "agri" | "wastewater";
const LAYERS: { key: LayerKey; label: string; color: string }[] = [
  { key: "infection",  label: "Infection",  color: "var(--risk-critical)" },
  { key: "travel",     label: "Travel",     color: "var(--color-primary)" },
  { key: "agri",       label: "Agri",       color: "var(--risk-low)" },
  { key: "wastewater", label: "Wastewater", color: "var(--risk-unknown)" },
];

interface Props {
  signals: OutbreakSignal[];
  selectedId: string | null;
  onSelect: (s: OutbreakSignal) => void;
}

export function GlobalMap({ signals, selectedId, onSelect }: Props) {
  const dots = useDotField();
  const [active, setActive] = useState<Record<LayerKey, boolean>>({
    infection: true, travel: false, agri: false, wastewater: false,
  });
  const toggle = (k: LayerKey) => setActive((a) => ({ ...a, [k]: !a[k] }));

  const hubs = TRAVEL_HUBS.map(([code, lon, lat]) => ({ code, ...project(lon, lat) }));

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg panel scan-sweep">
      <div className="pointer-events-none absolute inset-0 z-10">
        <Corner className="top-2 left-2" />
        <Corner className="top-2 right-2 rotate-90" />
        <Corner className="bottom-2 right-2 rotate-180" />
        <Corner className="bottom-2 left-2 -rotate-90" />
      </div>

      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary glow-primary animate-pulse" />
        Global Bio-Risk Surface · Live · {signals.length} signals
      </div>
      <div className="absolute top-3 right-3 z-20 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
        EQUIRECT · WGS84
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="oceanGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="oklch(0.28 0.06 220 / 0.6)" />
            <stop offset="100%" stopColor="oklch(0.16 0.02 240 / 0)" />
          </radialGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="heatGrad">
            <stop offset="0%" stopColor="oklch(0.65 0.25 25 / 0.55)" />
            <stop offset="60%" stopColor="oklch(0.72 0.19 55 / 0.18)" />
            <stop offset="100%" stopColor="oklch(0.72 0.19 55 / 0)" />
          </radialGradient>
          <radialGradient id="agriGrad">
            <stop offset="0%" stopColor="oklch(0.72 0.19 155 / 0.45)" />
            <stop offset="100%" stopColor="oklch(0.72 0.19 155 / 0)" />
          </radialGradient>
          <radialGradient id="wasteGrad">
            <stop offset="0%" stopColor="oklch(0.70 0.20 295 / 0.55)" />
            <stop offset="100%" stopColor="oklch(0.70 0.20 295 / 0)" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill="url(#oceanGlow)" />

        <g stroke="oklch(0.30 0.03 235 / 0.35)" strokeWidth="0.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v${i}`} x1={(i * W) / 12} y1={0} x2={(i * W) / 12} y2={H} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={(i * H) / 6} x2={W} y2={(i * H) / 6} />
          ))}
        </g>

        <g fill="oklch(0.55 0.04 200 / 0.55)">
          {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={0.9} />)}
        </g>

        {/* Infection heat layer */}
        {active.infection && (
          <g>
            {signals.filter((s) => s.type === "human" || s.type === "animal").map((s) => {
              const { x, y } = project(s.lon, s.lat);
              const r = 30 + s.severity * 60;
              return <circle key={`h-${s.id}`} cx={x} cy={y} r={r} fill="url(#heatGrad)" opacity={0.7} />;
            })}
          </g>
        )}

        {/* Agriculture layer */}
        {active.agri && (
          <g>
            {signals.filter((s) => s.type === "crop").map((s) => {
              const { x, y } = project(s.lon, s.lat);
              const r = 40 + s.severity * 50;
              return <circle key={`a-${s.id}`} cx={x} cy={y} r={r} fill="url(#agriGrad)" />;
            })}
          </g>
        )}

        {/* Wastewater layer */}
        {active.wastewater && (
          <g>
            {signals.map((s) => {
              const { x, y } = project(s.lon, s.lat);
              return (
                <g key={`w-${s.id}`}>
                  <circle cx={x} cy={y} r={20} fill="url(#wasteGrad)" />
                  <circle cx={x} cy={y} r={3} fill="oklch(0.70 0.20 295)" opacity={0.7} />
                </g>
              );
            })}
          </g>
        )}

        {/* Travel layer — animated dashed arcs between hubs */}
        {active.travel && (
          <g stroke="var(--color-primary)" fill="none" opacity={0.8}>
            {TRAVEL_ARCS.map(([a, b], i) => {
              const A = hubs[a], B = hubs[b];
              const mx = (A.x + B.x) / 2;
              const my = (A.y + B.y) / 2 - Math.abs(B.x - A.x) * 0.18;
              return (
                <path key={i} d={`M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`}
                  strokeWidth={0.8} strokeDasharray="4 6" opacity={0.45}>
                  <animate attributeName="stroke-dashoffset" from="0" to="-200" dur="6s" repeatCount="indefinite" />
                </path>
              );
            })}
            {hubs.map((h) => (
              <g key={h.code}>
                <circle cx={h.x} cy={h.y} r={2.5} fill="var(--color-primary)" />
                <circle cx={h.x} cy={h.y} r={5} fill="none" strokeWidth={0.6} />
              </g>
            ))}
          </g>
        )}

        {/* Signal nodes */}
        <g>
          {signals.map((s) => {
            const { x, y } = project(s.lon, s.lat);
            const meta = RISK_META[s.level];
            const r = 3 + s.severity * 5;
            const isSelected = selectedId === s.id;
            const pulses = s.level === "critical" || s.level === "high" || s.level === "unknown";
            return (
              <g key={s.id} style={{ cursor: "pointer" }} onClick={() => onSelect(s)}>
                {pulses && (
                  <circle cx={x} cy={y} r={r} fill={meta.color} opacity={0.5}
                    style={{ transformOrigin: `${x}px ${y}px` }} className="pulse-ring" />
                )}
                <circle cx={x} cy={y} r={r + (isSelected ? 4 : 0)} fill={meta.color}
                  opacity={isSelected ? 0.25 : 0.18} filter="url(#softGlow)" />
                <circle cx={x} cy={y} r={r} fill={meta.color} />
                <circle cx={x} cy={y} r={r * 0.45} fill="white" opacity={0.85} />
                {isSelected && (
                  <g stroke={meta.color} strokeWidth={1} fill="none">
                    <circle cx={x} cy={y} r={r + 8} strokeDasharray="2 3" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        {(["critical","high","medium","low","unknown"] as const).map((l) => (
          <div key={l} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: RISK_META[l].color, boxShadow: `0 0 8px ${RISK_META[l].color}` }} />
            {RISK_META[l].label}
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex gap-1 text-[10px] uppercase tracking-wider">
        {LAYERS.map((l) => {
          const on = active[l.key];
          return (
            <button
              key={l.key}
              onClick={() => toggle(l.key)}
              className={`rounded border px-2 py-1 transition ${
                on ? "border-primary/70 bg-primary/15 text-primary glow-primary" : "border-border bg-card/60 text-muted-foreground hover:border-primary/40"
              }`}
              style={on ? { color: l.color, borderColor: `${l.color}99` } : {}}
            >
              {on ? "● " : "○ "}{l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Corner({ className = "" }: { className?: string }) {
  return (
    <svg className={`absolute h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="none">
      <path d="M2 8V2H8" stroke="var(--color-primary)" strokeWidth="1.2" opacity="0.7" />
    </svg>
  );
}
