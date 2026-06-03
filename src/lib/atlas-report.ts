import jsPDF from "jspdf";
import type { OutbreakSignal } from "@/lib/atlas-data";
import { simulate, STRATEGIES } from "@/lib/atlas-sim";
import { auditHash, sourceDetail } from "@/hooks/useLiveFeed";

export function exportSignalReport(signal: OutbreakSignal) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  let y = M;

  const sim = simulate(signal, 72, "none");
  const simMitigated = simulate(signal, 72, "diagnostics");
  const hash = auditHash(signal.id + signal.name);

  // Header
  doc.setFillColor(15, 20, 32);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(120, 220, 255);
  doc.setFontSize(10);
  doc.text("ATLAS BIOSHIELD · CONFIDENTIAL", M, 28);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Outbreak Intelligence Report", M, 50);
  doc.setFontSize(9);
  doc.setTextColor(180, 200, 220);
  doc.text(new Date().toUTCString(), W - M, 28, { align: "right" });
  y = 90;

  doc.setTextColor(20, 20, 30);
  doc.setFontSize(14);
  doc.text(signal.name, M, y); y += 16;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 100);
  doc.text(`${signal.country} · ${signal.region}  ·  ID ${signal.id.toUpperCase()}  ·  Level: ${signal.level.toUpperCase()}`, M, y); y += 14;
  doc.text(`Type: ${signal.type}  ·  Severity: ${(signal.severity * 100).toFixed(0)}  ·  Velocity: ${signal.velocity.toFixed(2)}x  ·  Confidence: ${(signal.confidence * 100).toFixed(0)}%`, M, y); y += 18;

  // Description
  doc.setTextColor(20, 20, 30);
  doc.setFontSize(11);
  doc.text("Summary", M, y); y += 14;
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 70);
  const wrapped = doc.splitTextToSize(signal.description, W - M * 2);
  doc.text(wrapped, M, y); y += wrapped.length * 11 + 8;

  // Timeline
  doc.setTextColor(20, 20, 30); doc.setFontSize(11);
  doc.text("Verified Timeline", M, y); y += 14;
  doc.setFontSize(9); doc.setTextColor(50, 50, 70);
  signal.timeline.forEach((ev) => {
    doc.text(`T+${ev.hour}h  ·  [${ev.stage.toUpperCase()}]  ${ev.label}`, M, y); y += 11;
    const sub = doc.splitTextToSize(`     ${ev.detail}`, W - M * 2);
    doc.text(sub, M, y); y += sub.length * 11 + 4;
  });
  y += 6;

  // Sources
  doc.setTextColor(20, 20, 30); doc.setFontSize(11);
  doc.text("Sources & Trust Chain", M, y); y += 14;
  doc.setFontSize(9); doc.setTextColor(50, 50, 70);
  signal.sources.forEach((src) => {
    const d = sourceDetail(src, signal.id);
    doc.text(`• ${src}   —  reliability ${d.reliability}%, latency ${d.latency}ms, hash ${d.hash}`, M, y);
    y += 11;
  });
  y += 4;
  doc.setFontSize(8); doc.setTextColor(100, 100, 130);
  doc.text(`Audit hash: ${hash}`, M, y); y += 16;

  if (y > 680) { doc.addPage(); y = M; }

  // 72h Simulation
  doc.setTextColor(20, 20, 30); doc.setFontSize(11);
  doc.text("72-Hour Spread Simulation (Baseline)", M, y); y += 14;
  drawHourlyChart(doc, M, y, W - M * 2, 90, sim.hourly, [220, 60, 50]); y += 100;

  doc.setFontSize(9); doc.setTextColor(50, 50, 70);
  doc.text("Predicted Spread Zones", M, y); y += 12;
  sim.spreadZones.forEach((z) => {
    doc.text(`T+${z.eta}h  ·  ${z.name}  ·  intensity ${(z.intensity * 100).toFixed(0)}`, M, y); y += 11;
  });
  y += 6;

  doc.setTextColor(20, 20, 30); doc.setFontSize(11);
  doc.text("Hospital Load Projection", M, y); y += 14;
  doc.setFontSize(9); doc.setTextColor(50, 50, 70);
  doc.text(`Tier-1: ${sim.hospital.tier1}%   ·   Tier-2: ${sim.hospital.tier2}%   ·   ICU: ${sim.hospital.icu}%   ·   Capacity threshold: ${sim.hospital.bedsHit}`, M, y); y += 14;

  // Mitigation comparison
  if (y > 720) { doc.addPage(); y = M; }
  doc.setTextColor(20, 20, 30); doc.setFontSize(11);
  doc.text("Mitigation Comparison: Mobile Diagnostics", M, y); y += 14;
  drawHourlyChart(doc, M, y, W - M * 2, 70, simMitigated.hourly, [60, 160, 220]); y += 80;
  doc.setFontSize(9); doc.setTextColor(50, 50, 70);
  const dIcu = simMitigated.hospital.icu - sim.hospital.icu;
  doc.text(`ICU delta vs baseline: ${dIcu >= 0 ? "+" : ""}${dIcu}%   ·   ${STRATEGIES.diagnostics.sub}`, M, y); y += 14;

  // Recommendation
  doc.setTextColor(20, 20, 30); doc.setFontSize(11);
  doc.text("AI Recommendation", M, y); y += 14;
  doc.setFontSize(9); doc.setTextColor(50, 50, 70);
  const rec = doc.splitTextToSize(sim.recommendation, W - M * 2);
  doc.text(rec, M, y); y += rec.length * 11 + 8;

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(140, 140, 160);
    doc.text(`Atlas BioShield · Planetary Nervous System · page ${i}/${pages}`, M, doc.internal.pageSize.getHeight() - 18);
    doc.text(hash.slice(0, 22), W - M, doc.internal.pageSize.getHeight() - 18, { align: "right" });
  }

  doc.save(`atlas-${signal.id}-report.pdf`);
}

function drawHourlyChart(doc: jsPDF, x: number, y: number, w: number, h: number, hourly: number[], rgb: [number, number, number]) {
  doc.setDrawColor(220, 220, 230);
  doc.rect(x, y, w, h);
  const max = Math.max(...hourly, 0.01);
  const bw = w / hourly.length;
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  hourly.forEach((v, i) => {
    const bh = (v / max) * (h - 6);
    doc.rect(x + i * bw + 1, y + h - bh - 2, bw - 2, bh, "F");
  });
  doc.setFontSize(7); doc.setTextColor(120, 120, 140);
  doc.text("T+0", x, y + h + 10);
  doc.text(`T+${Math.floor(hourly.length * 3)}h`, x + w / 2, y + h + 10, { align: "center" });
  doc.text(`T+${hourly.length * 6}h`, x + w, y + h + 10, { align: "right" });
}
