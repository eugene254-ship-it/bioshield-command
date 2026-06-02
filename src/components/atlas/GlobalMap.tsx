import { useMemo } from "react";
import { SIGNALS, RISK_META, type OutbreakSignal } from "@/lib/atlas-data";

// Equirectangular projection: lon [-180,180] -> x [0,W]; lat [90,-90] -> y [0,H]
const W = 1000;
const H = 500;
function project(lon: number, lat: number) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return { x, y };
}

// Generate a dotted continent silhouette using a coarse landmask via a few polygons (approximation).
// We use a procedurally generated dot field weighted by continent bounding-ish regions.
function useDotField() {
  return useMemo(() => {
    const land: Array<{ lonMin: number; lonMax: number; latMin: number; latMax: number; density: number }> = [
      // very rough continental bounding boxes (decorative only)
      { lonMin: -168, lonMax: -52, latMin: 8, latMax: 72, density: 0.55 },   // N. America
      { lonMin: -82, lonMax: -34, latMin: -56, latMax: 12, density: 0.55 }, // S. America
      { lonMin: -18, lonMax: 52, latMin: -36, latMax: 38, density: 0.6 },   // Africa
      { lonMin: -12, lonMax: 40, latMin: 36, latMax: 70, density: 0.55 },   // Europe
      { lonMin: 40, lonMax: 180, latMin: 0, latMax: 75, density: 0.5 },     // Asia
      { lonMin: 112, lonMax: 154, latMin: -44, latMax: -10, density: 0.55 },// Australia
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
        // carve out some ocean: skip dots in obvious gulfs (rough)
        if (lon > -100 && lon < -85 && lat > 18 && lat < 30 && rand() < 0.7) continue; // gulf of mexico
        if (lon > 40 && lon < 60 && lat > 12 && lat < 30 && rand() < 0.5) continue;     // arabian
        const p = project(lon, lat);
        dots.push(p);
      }
    }
    return dots;
  }, []);
}

interface Props {
  selectedId: string | null;
  onSelect: (s: OutbreakSignal) => void;
}

export function GlobalMap({ selectedId, onSelect }: Props) {
  const dots = useDotField();

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg panel scan-sweep">
      {/* HUD corners */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <Corner className="top-2 left-2" />
        <Corner className="top-2 right-2 rotate-90" />
        <Corner className="bottom-2 right-2 rotate-180" />
        <Corner className="bottom-2 left-2 -rotate-90" />
      </div>

      {/* Layer label */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary glow-primary" />
        Global Bio-Risk Surface · Live
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
        </defs>

        <rect width={W} height={H} fill="url(#oceanGlow)" />

        {/* graticule */}
        <g stroke="oklch(0.30 0.03 235 / 0.35)" strokeWidth="0.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v${i}`} x1={(i * W) / 12} y1={0} x2={(i * W) / 12} y2={H} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={(i * H) / 6} x2={W} y2={(i * H) / 6} />
          ))}
        </g>

        {/* continent dots */}
        <g fill="oklch(0.55 0.04 200 / 0.55)">
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={0.9} />
          ))}
        </g>

        {/* signal nodes */}
        <g>
          {SIGNALS.map((s) => {
            const { x, y } = project(s.lon, s.lat);
            const meta = RISK_META[s.level];
            const r = 3 + s.severity * 5;
            const isSelected = selectedId === s.id;
            const pulses = s.level === "critical" || s.level === "high" || s.level === "unknown";
            return (
              <g
                key={s.id}
                style={{ cursor: "pointer" }}
                onClick={() => onSelect(s)}
              >
                {pulses && (
                  <circle
                    cx={x} cy={y} r={r}
                    fill={meta.color}
                    opacity={0.5}
                    style={{ transformOrigin: `${x}px ${y}px` }}
                    className="pulse-ring"
                  />
                )}
                <circle
                  cx={x} cy={y} r={r + (isSelected ? 4 : 0)}
                  fill={meta.color}
                  opacity={isSelected ? 0.25 : 0.18}
                  filter="url(#softGlow)"
                />
                <circle cx={x} cy={y} r={r} fill={meta.color} />
                <circle cx={x} cy={y} r={r * 0.45} fill="white" opacity={0.85} />
                {isSelected && (
                  <g stroke={meta.color} strokeWidth={1} fill="none">
                    <circle cx={x} cy={y} r={r + 8} strokeDasharray="2 3" />
                    <line x1={x - r - 14} y1={y} x2={x - r - 6} y2={y} />
                    <line x1={x + r + 6} y1={y} x2={x + r + 14} y2={y} />
                    <line x1={x} y1={y - r - 14} x2={x} y2={y - r - 6} />
                    <line x1={x} y1={y + r + 6} x2={x} y2={y + r + 14} />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        {(["critical","high","medium","low","unknown"] as const).map((l) => (
          <div key={l} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: RISK_META[l].color, boxShadow: `0 0 8px ${RISK_META[l].color}` }} />
            {RISK_META[l].label}
          </div>
        ))}
      </div>

      {/* Layer toggles (visual only) */}
      <div className="absolute bottom-3 right-3 z-20 flex gap-1 text-[10px] uppercase tracking-wider">
        {["Infection", "Travel", "Agri", "Wastewater"].map((l, i) => (
          <button
            key={l}
            className={`rounded border border-border bg-card/60 px-2 py-1 hover:border-primary/50 hover:text-primary ${i === 0 ? "border-primary/60 text-primary" : "text-muted-foreground"}`}
          >
            {l}
          </button>
        ))}
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
