import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
registerHooks({ resolve(specifier, context, next) {
  if (/\/lib\/(schedules|schedule-visual)\.ts$/.test(context.parentURL || "") && /^\.\/[a-z-]+$/.test(specifier)) return next(`${specifier}.ts`, context);
  return next(specifier, context);
} });
const { defaultScheduleOptions, readSchedules, validSchedule, scheduleSelection } = await import("../lib/schedules.ts");
const { emptyPublication } = await import("../lib/calendar.ts");
const { buildSchedulePages, wrapScheduleText } = await import("../lib/schedule-visual.ts");
const plan = { id: "plan", title: "Cronograma de contenido", start: "2026-09-01", end: "2026-09-30", campaign: "Plato del mes", objective: "Visitas y canjes", dates: [{ date: "2026-09-20", label: "Lanzamiento" }], selectedIds: ["post"], options: { ...defaultScheduleOptions } };
const post = { ...emptyPublication("2026-09-02"), id: "post", title: "PLATO DEL MES", objective: "Visitas y canjes", copy: "Disfruta del plato del mes con 25% de descuento.", production: "Fotografía real del plato", brand: "Manabiche", paid: true };
test("saved schedules validate dates, options and exact selection without losing optional fields", () => {
  assert.deepEqual(readSchedules(JSON.parse(JSON.stringify([plan]))), [plan]);
  for (const invalid of [{ dates: [{ date: "2026-02-30", label: "Fecha" }] }, { options: {} }, { end: "2026-08-01" }, { selectedIds: ["post", "post"] }, { title: " " }]) assert.equal(validSchedule({ ...plan, ...invalid }), false);
  assert.throws(() => readSchedules([plan, plan]));
  assert.deepEqual(scheduleSelection([post, { ...post, id: "new" }], plan), [post]);
  assert.deepEqual(scheduleSelection([{ ...post, date: "2026-10-01" }], plan), []);
});
test("visual schedule preserves long content, hides excluded fields and escapes markup", () => {
  const visuals = { logo: "", images: {}, warnings: [] };
  const pages = buildSchedulePages([post], plan, "Manabiche", visuals);
  assert.equal(pages.length, 3);
  assert.ok(pages[2].includes("PLATO DEL MES"));
  const long = buildSchedulePages([{ ...post, production: "", copy: "Texto extenso ".repeat(600) + "FINALDELTEXTO" }], plan, "Manabiche", visuals);
  assert.ok(long.length > 3);
  assert.ok(long.at(-1).includes("FINALDELTEXTO"));
  const hidden = buildSchedulePages([{ ...post, copy: "SECRETO", title: "<script>alert(1)</script>" }], { ...plan, options: { ...plan.options, copy: false } }, "Manabiche", visuals).join("");
  assert.equal(hidden.includes("SECRETO"), false);
  assert.equal(hidden.includes("<script>"), false);
  assert.ok(hidden.includes("&lt;script&gt;"));
  assert.ok(wrapScheduleText("a".repeat(500), 58).every(line => line.length <= 58));
});
