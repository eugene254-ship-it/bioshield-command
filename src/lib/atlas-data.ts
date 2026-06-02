export type RiskLevel = "critical" | "high" | "medium" | "low" | "unknown";
export type SignalType = "human" | "animal" | "crop" | "unknown";

export interface OutbreakSignal {
  id: string;
  name: string;
  region: string;
  country: string;
  // lon/lat in degrees
  lon: number;
  lat: number;
  type: SignalType;
  level: RiskLevel;
  severity: number; // 0-1
  velocity: number; // multiplier 48h
  confidence: number; // 0-1
  sources: string[];
  description: string;
  detectedAgo: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  hour: number;
  stage: "detected" | "verifying" | "spreading" | "intervening" | "contained";
  label: string;
  detail: string;
}

export const SIGNALS: OutbreakSignal[] = [
  {
    id: "sig-001",
    name: "Nairobi East Cluster",
    region: "East Africa",
    country: "Kenya",
    lon: 36.82, lat: -1.29,
    type: "human", level: "critical",
    severity: 0.86, velocity: 2.4, confidence: 0.78,
    sources: ["3 clinics", "Wastewater sensor KE-04", "Mobile diagnostic unit"],
    description: "Respiratory anomaly spike. Atypical pathogen signature; no match in known viral library.",
    detectedAgo: "14h",
    timeline: [
      { hour: 0, stage: "detected", label: "First anomaly", detail: "Clinic intake spike +340% vs baseline" },
      { hour: 6, stage: "verifying", label: "Lab verification", detail: "Wastewater RNA fragments confirmed" },
      { hour: 14, stage: "spreading", label: "Spread modeled", detail: "R₀ estimate 2.1 — 4 secondary zones predicted" },
      { hour: 24, stage: "intervening", label: "Response prepped", detail: "Mobile diagnostics queued, hospitals on standby" },
      { hour: 48, stage: "contained", label: "Containment target", detail: "Projected containment window if action <12h" },
    ],
  },
  {
    id: "sig-002",
    name: "Mekong Delta Avian Signal",
    region: "Southeast Asia",
    country: "Vietnam",
    lon: 105.78, lat: 10.03,
    type: "animal", level: "high",
    severity: 0.62, velocity: 1.7, confidence: 0.84,
    sources: ["Farm sensor net", "Provincial vet lab"],
    description: "H-strain avian influenza re-emergence across 12 poultry farms.",
    detectedAgo: "2d",
    timeline: [
      { hour: 0, stage: "detected", label: "Farm sensor alert", detail: "Mortality spike across 12 farms" },
      { hour: 12, stage: "verifying", label: "Vet lab match", detail: "Strain matches H5N1 variant K" },
      { hour: 36, stage: "spreading", label: "Migratory risk", detail: "Wild bird corridors active" },
      { hour: 48, stage: "intervening", label: "Quarantine zone", detail: "5km radius enforced" },
    ],
  },
  {
    id: "sig-003",
    name: "Andean Wheat Rust",
    region: "South America",
    country: "Peru",
    lon: -75.02, lat: -9.19,
    type: "crop", level: "medium",
    severity: 0.45, velocity: 1.3, confidence: 0.71,
    sources: ["Satellite NDVI", "Field agronomist reports"],
    description: "Stem rust signature across 18,400 hectares of wheat.",
    detectedAgo: "5d",
    timeline: [
      { hour: 0, stage: "detected", label: "NDVI anomaly", detail: "Satellite flagged chlorosis pattern" },
      { hour: 24, stage: "verifying", label: "Field confirmation", detail: "Ug99 lineage probable" },
      { hour: 72, stage: "intervening", label: "Fungicide routing", detail: "Supply chain notified" },
    ],
  },
  {
    id: "sig-004",
    name: "Reykjavík Unknown Signal",
    region: "North Atlantic",
    country: "Iceland",
    lon: -21.94, lat: 64.13,
    type: "unknown", level: "unknown",
    severity: 0.31, velocity: 1.1, confidence: 0.42,
    sources: ["AI anomaly detector", "Wastewater sensor IS-01"],
    description: "Unidentified pathogen marker — no library match. Investigating.",
    detectedAgo: "6h",
    timeline: [
      { hour: 0, stage: "detected", label: "AI anomaly flag", detail: "Novel marker, low confidence" },
      { hour: 6, stage: "verifying", label: "Sample escalation", detail: "Routed to BSL-3 lab" },
    ],
  },
  {
    id: "sig-005",
    name: "São Paulo Arbovirus",
    region: "South America",
    country: "Brazil",
    lon: -46.63, lat: -23.55,
    type: "human", level: "high",
    severity: 0.68, velocity: 1.9, confidence: 0.81,
    sources: ["7 clinics", "Vector surveillance"],
    description: "Dengue-like arbovirus surge ahead of seasonal expectation.",
    detectedAgo: "1d",
    timeline: [
      { hour: 0, stage: "detected", label: "Clinic spike", detail: "ER admissions +180%" },
      { hour: 12, stage: "verifying", label: "Serotype check", detail: "DENV-3 confirmed" },
      { hour: 24, stage: "spreading", label: "Vector mapping", detail: "Aedes density above threshold" },
    ],
  },
  {
    id: "sig-006",
    name: "Berlin Stable Region",
    region: "Central Europe",
    country: "Germany",
    lon: 13.40, lat: 52.52,
    type: "human", level: "low",
    severity: 0.12, velocity: 0.9, confidence: 0.95,
    sources: ["National surveillance grid"],
    description: "Baseline normal. Routine surveillance.",
    detectedAgo: "—",
    timeline: [{ hour: 0, stage: "contained", label: "Stable", detail: "No active signals" }],
  },
  {
    id: "sig-007",
    name: "Mumbai Wastewater Spike",
    region: "South Asia",
    country: "India",
    lon: 72.87, lat: 19.07,
    type: "human", level: "medium",
    severity: 0.51, velocity: 1.5, confidence: 0.74,
    sources: ["Wastewater sensors x6", "Public health intake"],
    description: "Enteric pathogen load rising in 6 sectors.",
    detectedAgo: "18h",
    timeline: [
      { hour: 0, stage: "detected", label: "Sensor spike", detail: "Norovirus marker rising" },
      { hour: 18, stage: "verifying", label: "Cross-check", detail: "Clinic intake correlating" },
    ],
  },
  {
    id: "sig-008",
    name: "Manitoba Swine Cluster",
    region: "North America",
    country: "Canada",
    lon: -97.14, lat: 49.89,
    type: "animal", level: "medium",
    severity: 0.40, velocity: 1.2, confidence: 0.69,
    sources: ["Farm vet network"],
    description: "Atypical swine respiratory cluster.",
    detectedAgo: "3d",
    timeline: [
      { hour: 0, stage: "detected", label: "Vet report", detail: "Coughing herd, 3 farms" },
      { hour: 24, stage: "verifying", label: "PCR pending", detail: "Samples in transit" },
    ],
  },
];

export const RISK_META: Record<RiskLevel, { label: string; color: string; ring: string }> = {
  critical: { label: "Critical", color: "var(--risk-critical)", ring: "oklch(0.65 0.25 25 / 50%)" },
  high:     { label: "High",     color: "var(--risk-high)",     ring: "oklch(0.72 0.19 55 / 45%)" },
  medium:   { label: "Medium",   color: "var(--risk-medium)",   ring: "oklch(0.85 0.17 95 / 40%)" },
  low:      { label: "Stable",   color: "var(--risk-low)",      ring: "oklch(0.72 0.19 155 / 35%)" },
  unknown:  { label: "Unknown",  color: "var(--risk-unknown)",  ring: "oklch(0.70 0.20 295 / 55%)" },
};
