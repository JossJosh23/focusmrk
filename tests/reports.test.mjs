import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
registerHooks({ resolve(s, c, next) {
  if (/\/lib\/(reports|report-visual|schedule-visual)\.ts$/.test(c.parentURL || "") && /^\.\/[a-z-]+$/.test(s)) return next(`${s}.ts`, c);
  return next(s, c);
} });
const { newReport, validReport, readReports, metricChange, followerGrowth } = await import("../lib/reports.ts");
const { buildReportPages } = await import("../lib/report-visual.ts");
const report = { ...newReport("2026-01-15"), id: "report" };
test("reports preserve missing metrics and calendar-year comparisons", () => {
  assert.equal(report.previousStart, "2025-12-01");
  assert.equal(report.previousEnd, "2025-12-31");
  assert.equal(validReport(report), true);
  assert.deepEqual(readReports(JSON.parse(JSON.stringify([report]))), [report]);
  assert.equal(report.networks[0].current.reach, null);
  const filled = structuredClone(report); filled.networks[0].current.reach = 0;
  assert.equal(validReport(filled), true);
  for (const bad of [-1, 1.5, Infinity, "100", undefined]) { filled.networks[0].current.reach = bad; assert.equal(validReport(filled), false); }
  assert.equal(validReport({ ...report, previousEnd: report.start }), false);
  assert.equal(validReport({ ...report, networks: [] }), false);
  assert.throws(() => readReports([report, report]));
});
test("comparisons do not fabricate growth for missing or zero baselines", () => {
  assert.equal(metricChange(null, 2), "Sin comparación");
  assert.equal(metricChange(3, 0), "Base anterior: 0");
  assert.equal(metricChange(0, 0), "Sin cambio");
  assert.equal(metricChange(150, 100), "+50%");
  assert.equal(metricChange(50, 100), "-50%");
  assert.equal(followerGrowth(report.networks[0].current), null);
  assert.equal(followerGrowth({ followersStart: 100, followersEnd: 90 }), -10);
});
test("report pages separate networks and preserve long conclusions and escaped text", () => {
  const pages = buildReportPages({ ...report, conclusions: "Contenido ".repeat(1000) + "FINCONCLUSION", nextSteps: "<script>" }, "Empresa", { logo: "", images: {}, warnings: [] });
  assert.ok(pages[0].includes("SOCIAL MEDIA REPORT"));
  assert.ok(pages[1].includes("Resumen del periodo"));
  assert.ok(pages[6].includes("INSTAGRAM"));
  assert.ok(pages[7].includes("TIKTOK"));
  assert.ok(pages[8].includes("FACEBOOK"));
  assert.ok(pages[1].includes("Sin datos"));
  assert.ok(pages.join("").includes("FINCONCLUSION"));
  assert.equal(pages.join("").includes("<script>"), false);
});
