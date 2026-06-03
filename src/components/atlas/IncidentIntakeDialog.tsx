import { useState } from "react";
import { PlusCircle, X, ShieldAlert } from "lucide-react";
import type { RiskLevel, SignalType } from "@/lib/atlas-data";
import type { ManualIncident } from "@/hooks/useLiveFeed";

interface Props {
  onSubmit: (incident: ManualIncident) => void;
}

const TYPES: SignalType[] = ["human", "animal", "crop", "unknown"];
const LEVELS: RiskLevel[] = ["unknown", "low", "medium", "high", "critical"];

export function IncidentIntakeDialog({ onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [type, setType] = useState<SignalType>("human");
  const [level, setLevel] = useState<RiskLevel>("medium");
  const [severity, setSeverity] = useState(0.5);
  const [velocity, setVelocity] = useState(1.4);
  const [confidence, setConfidence] = useState(0.7);
  const [sources, setSources] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName(""); setCountry(""); setRegion(""); setLat(""); setLon("");
    setType("human"); setLevel("medium"); setSeverity(0.5); setVelocity(1.4); setConfidence(0.7);
    setSources(""); setDescription(""); setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !country.trim() || !region.trim() || !description.trim()) {
      setError("Name, country, region, and description are required."); return;
    }
    const la = parseFloat(lat), lo = parseFloat(lon);
    if (isNaN(la) || la < -90 || la > 90 || isNaN(lo) || lo < -180 || lo > 180) {
      setError("Provide valid lat (-90..90) and lon (-180..180)."); return;
    }
    const srcs = sources.split(",").map((s) => s.trim()).filter(Boolean);
    if (srcs.length === 0) { setError("Provide at least one source (comma-separated)."); return; }

    onSubmit({
      name: name.trim().slice(0, 120),
      country: country.trim().slice(0, 80),
      region: region.trim().slice(0, 80),
      lat: la, lon: lo,
      type, level,
      severity: Math.max(0, Math.min(1, severity)),
      velocity: Math.max(0.5, Math.min(5, velocity)),
      confidence: Math.max(0, Math.min(1, confidence)),
      sources: srcs.slice(0, 8),
      description: description.trim().slice(0, 500),
    });
    reset();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded border border-primary/60 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20"
      >
        <PlusCircle className="h-3 w-3" /> File Incident
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg panel shadow-2xl glow-primary"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Manual Incident Intake</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Operator-verified signal</div>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-5 py-4">
              <Field label="Incident Name" col2>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inp} maxLength={120} placeholder="e.g. Bogotá Respiratory Cluster" />
              </Field>
              <Field label="Country">
                <input value={country} onChange={(e) => setCountry(e.target.value)} className={inp} maxLength={80} />
              </Field>
              <Field label="Region">
                <input value={region} onChange={(e) => setRegion(e.target.value)} className={inp} maxLength={80} placeholder="e.g. South America" />
              </Field>
              <Field label="Latitude">
                <input value={lat} onChange={(e) => setLat(e.target.value)} className={inp} placeholder="-90..90" inputMode="decimal" />
              </Field>
              <Field label="Longitude">
                <input value={lon} onChange={(e) => setLon(e.target.value)} className={inp} placeholder="-180..180" inputMode="decimal" />
              </Field>
              <Field label="Type">
                <select value={type} onChange={(e) => setType(e.target.value as SignalType)} className={inp}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Level">
                <select value={level} onChange={(e) => setLevel(e.target.value as RiskLevel)} className={inp}>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>

              <Range label={`Severity · ${(severity * 100).toFixed(0)}`} value={severity} step={0.01} min={0} max={1} onChange={setSeverity} />
              <Range label={`Velocity · ${velocity.toFixed(2)}x`} value={velocity} step={0.05} min={0.5} max={5} onChange={setVelocity} />
              <Range label={`Confidence · ${(confidence * 100).toFixed(0)}%`} value={confidence} step={0.01} min={0} max={1} onChange={setConfidence} />

              <Field label="Sources (comma-separated)" col2>
                <input value={sources} onChange={(e) => setSources(e.target.value)} className={inp} placeholder="Clinic CO-12, Wastewater BO-04" />
              </Field>
              <Field label="Description" col2>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inp} min-h-[80px] resize-y`} maxLength={500} />
              </Field>
            </div>

            {error && <div className="mx-5 mb-3 rounded border border-risk-critical/50 bg-risk-critical/10 px-3 py-2 text-xs text-risk-critical">{error}</div>}

            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded border border-border bg-card/60 px-3 py-1.5 text-xs hover:bg-card">
                Cancel
              </button>
              <button type="submit" className="rounded bg-primary px-4 py-1.5 text-xs text-primary-foreground hover:opacity-90">
                File & Plot on Map
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

const inp = "w-full rounded border border-border bg-card/60 px-2 py-1.5 text-xs outline-none focus:border-primary";

function Field({ label, children, col2 }: { label: string; children: React.ReactNode; col2?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${col2 ? "md:col-span-2" : ""}`}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Range({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="accent-primary" />
    </label>
  );
}
