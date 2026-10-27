import test from "node:test";
import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import { dateKey, emptyPublication, isIdea, isOverdue, isPublication, matchesFormat, monthDays, weekDays, parseDate, postMediaIds, readPublications, validDate } from "../lib/calendar.ts";
import { readTemplates, templateCopy } from "../lib/templates.ts";
import { scheduleCounts, scheduleSummary } from "../lib/schedule-summary.ts";

test("important markers round-trip while existing publications stay compatible", () => {
  const post = { ...emptyPublication("2026-09-10"), id: "important", title: "Lanzamiento" };
  for (const important of [true, false]) {
    const marked = { ...post, important };
    assert.deepEqual(readPublications(JSON.stringify([marked])), [marked]);
  }
  assert.deepEqual(readPublications(JSON.stringify([post])), [post]);
  assert.equal(isPublication({ ...post, important: "yes" }), false);
});

test("per-network caption overrides are optional, round-trip and reject unknown networks or non-text values", () => {
  const post = { ...emptyPublication("2026-09-10"), id: "captions", title: "Plato del mes", copy: "Texto base" };
  assert.ok(isPublication(post), "Publications without overrides stay valid");
  const custom = { ...post, captionOverrides: { instagram: "Solo IG", tiktok: "" } };
  assert.deepEqual(readPublications(JSON.stringify([custom])), [custom]);
  assert.ok(!isPublication({ ...post, captionOverrides: { twitter: "x" } }));
  assert.ok(!isPublication({ ...post, captionOverrides: { instagram: 5 } }));
  assert.ok(!isPublication({ ...post, captionOverrides: ["Solo IG"] }));
});

test("schedule summary counts selected formats and keeps paid promotion overlapping", () => {
  const posts = ["Post", "Reel orgánico", "Reel trend", "Reel", "Carrusel"].map((format, index) => ({
    ...emptyPublication("2026-09-10"), id: String(index), title: "Contenido", format, paid: index < 2,
  }));
  assert.deepEqual(scheduleCounts(readPublications(JSON.stringify(posts))).map(item => item.count), [1, 3, 2, 1]);
  assert.deepEqual(scheduleCounts(posts.slice(0, 1)).map(item => item.count), [1, 0, 1]);
  assert.deepEqual(scheduleCounts([]).map(item => item.count), [0, 0, 0]);
  const summary = scheduleSummary(posts, { campaign: " Temporada ", objective: "Generar consultas", importantDate: "2026-09-20", importantDateLabel: "Lanzamiento" });
  assert.ok(summary.includes("Campaña: Temporada"));
  assert.ok(summary.includes("Objetivo: Generar consultas"));
  assert.ok(summary.includes("20/09/2026 · Lanzamiento"));
  assert.ok(summary.includes("Con pauta: 2"));
  assert.equal(scheduleSummary([]).includes("undefined"), false);
});

test("weeks start on Monday and include adjacent months and years without mutating their anchor", () => {
  const anchor = parseDate("2026-01-01");
  assert.deepEqual(weekDays(anchor).map(dateKey), ["2025-12-29", "2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"]);
  assert.equal(dateKey(anchor), "2026-01-01");
  assert.equal(dateKey(weekDays(parseDate("2026-01-04"))[0]), "2025-12-29");
  assert.equal(dateKey(weekDays(parseDate("2026-01-05"))[0]), "2026-01-05");
});

test("February accounts for leap years and Monday-based complete weeks", () => {
  for (const [year, count] of [[2024, 29], [2025, 28], [2100, 28], [2000, 29]]) {
    const days = monthDays(new Date(year, 1, 1, 12));
    assert.equal(days.filter((day) => day.getMonth() === 1).length, count);
    assert.equal(days[0].getDay(), 1);
    assert.equal(days.at(-1).getDay(), 0);
    assert.equal(days.length % 7, 0);
    assert.equal(new Set(days.map(dateKey)).size, days.length);
  }
});

test("calendar spans year boundaries and six-week months", () => {
  const january = monthDays(new Date(2026, 0, 1, 12));
  assert.equal(dateKey(january[0]), "2025-12-29");
  assert.equal(dateKey(january.at(-1)), "2026-02-01");
  assert.equal(monthDays(new Date(2026, 2, 1, 12)).length, 42);
});

test("dates round-trip locally and impossible dates are rejected", () => {
  for (const value of ["2026-09-10", "2024-02-29", "0100-01-01", "9999-12-31"]) {
    assert.ok(validDate(value));
    assert.equal(dateKey(parseDate(value)), value);
  }
  for (const value of ["2025-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "bad", "2026-9-1", "0000-01-01"]) assert.equal(validDate(value), false);
});

const first = { ...emptyPublication("2026-09-10"), id: "a", title: "Nueva colección", networks: ["Instagram", "TikTok", "Facebook"], paid: true, copy: "Conoce más\n#marca", footer: "Centro\n+593 999999999" };

test("legacy reel classifications and retired Historia merge without losing publications or paid flags", () => {
  const posts = ["Post", "Reel", "Reel orgánico", "Reel trend", "Historia"].flatMap((format, index) =>
    [false, true].map(paid => ({ ...first, id: `${index}-${paid}`, format, paid })));
  const restored = readPublications(JSON.stringify(posts));
  assert.deepEqual(restored, posts.map(post => ({ ...post, format: post.format.startsWith("Reel") ? "Reel" : post.format === "Historia" ? "Post" : post.format })));
  assert.equal(restored.filter(post => matchesFormat(post, "Reels")).length, 6);
  assert.equal(restored.filter(post => matchesFormat(post, "Post")).length, 4);
  assert.equal(restored.filter(post => matchesFormat(post, "Carrusel")).length, 0);
  assert.equal(restored.filter(post => matchesFormat(post, "Todos")).length, 10);
  assert.equal(restored.filter(post => post.paid).length, 5);
});

test("editor planning fields survive storage and older posts migrate", () => {
  const post = { ...first, objective: "Generar interacción", production: "Carrusel de dos imágenes\nUsar colores de marca" };
  assert.deepEqual(readPublications(JSON.stringify([post])), [post]);
  const legacy = { ...first };
  delete legacy.objective;
  delete legacy.production;
  assert.deepEqual(readPublications(JSON.stringify([legacy])), [first]);
  assert.throws(() => readPublications(JSON.stringify([{ ...post, production: 123 }])));
});

test("storage preserves multiple posts on one date and their complete contents", () => {
  const second = { ...first, id: "b", title: "Otra publicación", format: "Carrusel", mediaId: "m1", mediaIds: ["m1", "m2", "m3"] };
  const restored = readPublications(JSON.stringify([first, second]));
  assert.deepEqual(restored, [first, second]);
  assert.deepEqual(readPublications(null), []);
});

test("carousel files are optional, ordered, start with the cover and reject bad lists", () => {
  const post = { ...first, format: "Carrusel", mediaId: "a", mediaIds: ["a", "b"] };
  assert.ok(isPublication(post));
  assert.deepEqual(postMediaIds(post), ["a", "b"]);
  assert.deepEqual(postMediaIds({ mediaId: "a" }), ["a"]);
  assert.deepEqual(postMediaIds({ mediaId: "" }), []);
  for (const mediaIds of [[], ["b", "a"], ["a", "a"], ["a", 5], "a", Array.from({ length: 21 }, (_, i) => i ? `m${i}` : "a")]) {
    assert.ok(!isPublication({ ...post, mediaIds }), JSON.stringify(mediaIds));
  }
  assert.ok(!isPublication({ ...first, format: "Historia" }), "Historia is no longer a format");
});

test("corrupt storage is rejected rather than replaced with empty data", () => {
  for (const raw of ["{broken", "{}", "null", '[{"id":"a"}]', JSON.stringify([first, first])]) {
    assert.throws(() => readPublications(raw));
  }
  for (const change of [{ networks: [] }, { networks: ["Unknown"] }, { networks: ["Instagram", "Instagram"] }, { title: " " }, { date: "2026-02-30" }, { time: "24:01" }, { paid: "yes" }, { status: "Unknown" }, { format: "Unknown" }]) {
    assert.equal(isPublication({ ...first, ...change }), false);
  }
});

test("legacy statuses and missing references migrate without losing content", () => {
  const legacy = { ...first };
  delete legacy.referenceUrl;
  const [restored] = readPublications(JSON.stringify([{ ...legacy, status: "Listo" }]));
  assert.deepEqual(restored, { ...first, status: "Aprobado", referenceUrl: "" });
});

test("workflow and visual references survive storage and unsafe links are rejected", () => {
  for (const status of ["Borrador", "En revisión", "Aprobado", "Publicado"]) {
    const post = { ...first, status, referenceUrl: "https://www.canva.com/design/example/view" };
    assert.deepEqual(readPublications(JSON.stringify([post])), [post]);
  }
  for (const referenceUrl of ["javascript:alert(1)", "data:text/html,test", "not a url", null, "https://user:password@example.com"]) {
    assert.throws(() => readPublications(JSON.stringify([{ ...first, referenceUrl }])));
  }
});

test("agenda sorts by date before time, including month and year boundaries", async () => {
  const { comparePublications } = await import("../lib/calendar.ts");
  const posts = [
    { ...first, id: "c", date: "2027-01-01", time: "08:00" },
    { ...first, id: "b", date: "2026-12-31", time: "16:00" },
    { ...first, id: "a", date: "2026-12-31", time: "09:00" },
  ];
  assert.deepEqual(posts.sort(comparePublications).map((post) => post.id), ["a", "b", "c"]);
});

test("visual preview URL migrates safely and rejects executable schemes", () => {
  const old = { ...first };
  delete old.imageUrl;
  assert.equal(readPublications(JSON.stringify([old]))[0].imageUrl, "");
  const withImage = { ...first, imageUrl: "https://example.test/post.jpg" };
  assert.deepEqual(readPublications(JSON.stringify([withImage]))[0], withImage);
  assert.equal(isPublication({ ...first, imageUrl: "javascript:alert(1)" }), false);
});

test("templates preserve multiline copy, hashtags and contacts and reject corrupted data", () => {
  const t = { id: "template-a", name: "Promoción", copy: "Conoce la colección\nVisítanos", hashtags: "#Marca #Novedades", footer: "Centro\nWhatsApp: 0999999999" };
  assert.deepEqual(readTemplates(JSON.stringify([t])), [t]);
  assert.equal(templateCopy(t), `${t.copy}\n\n${t.hashtags}`);
  assert.equal(templateCopy({ ...t, hashtags: " " }), t.copy);
  for (const value of ["{}", "null", "invalid", JSON.stringify([t, t]), JSON.stringify([{ ...t, name: " " }])]) assert.throws(() => readTemplates(value));
});

test("overdue excludes published posts, today and future dates", () => {
  const post = { ...emptyPublication("2026-09-27"), id: "late", title: "Pendiente" };
  assert.equal(isOverdue(post, "2026-09-28"), true);
  assert.equal(isOverdue({ ...post, status: "Publicado" }, "2026-09-28"), false);
  assert.equal(isOverdue(post, "2026-09-27"), false);
  assert.equal(isOverdue(post, "2026-09-26"), false);
  assert.equal(isOverdue(post, ""), false);
});

test("ideas have no date: they validate, are never overdue and never trigger reminders", () => {
  const idea = { ...emptyPublication(""), id: "idea", title: "Reel de temporada" };
  assert.ok(isPublication(idea) && isIdea(idea));
  assert.deepEqual(readPublications(JSON.stringify([idea])), [idea]);
  assert.equal(isOverdue(idea, "2026-10-26"), false);
  assert.equal(isPublication({ ...idea, date: "2026-13-01" }), false);
  const { plan, defaults } = createRequire(import.meta.url)("../scripts/notification-plan.cjs");
  assert.deepEqual(plan([idea], defaults, "2026-10-26", "08:30"), []);
});

test("brand guide: logo colours ignore the background and old company profiles stay valid", async () => {
  const { dominantColors } = await import("../lib/brand-colors.ts");
  const { emptyCompanyProfile, validCompanyProfile } = await import("../lib/company-profile.ts");
  const px = (rgba, count) => Array.from({ length: count }, () => rgba).flat();
  // 60% white background, 30% red, 8% blue, 1% stray green, plus transparent pixels.
  const pixels = [...px([255, 255, 255, 255], 600), ...px([220, 30, 40, 255], 300), ...px([225, 35, 45, 255], 20), ...px([20, 60, 200, 255], 80), ...px([0, 200, 0, 255], 4), ...px([0, 0, 0, 0], 200)];
  const colors = dominantColors(pixels);
  assert.equal(colors.length, 2);
  assert.match(colors[0], /^#D[0-9A-F]1[0-9A-F]2[0-9A-F]$/);
  assert.equal(colors[1], "#143CC8");
  const profile = emptyCompanyProfile("Manabiche");
  assert.ok(validCompanyProfile(profile));
  assert.ok(validCompanyProfile({ ...profile, brandColors: ["#E11D48"], voice: "Cercano", products: "Encebollado" }));
  assert.equal(validCompanyProfile({ ...profile, brandColors: ["rojo"] }), false);
  assert.equal(validCompanyProfile({ ...profile, voice: "x".repeat(2001) }), false);
});

registerHooks({ resolve(specifier, context, next) {
  if (/\/lib\/calendar-(import|template)\.ts$/.test(context.parentURL || "") && /^\.\/[a-z-]+$/.test(specifier)) return next(`${specifier}.ts`, context);
  return next(specifier, context);
} });

test("calendar import: the template round-trips and every bad cell is reported by line", async () => {
  const { calendarTemplate } = await import("../lib/calendar-template.ts");
  const { parseCsv, parseXlsx, readImportRows } = await import("../lib/calendar-import.ts");
  let id = 0;
  const options = { company: "Manabiche", companies: null, existing: [], newId: () => `n${++id}` };
  const template = await parseXlsx(await (await calendarTemplate()).arrayBuffer());
  const fromTemplate = readImportRows(template, options);
  assert.deepEqual(fromTemplate.missingColumns, []);
  assert.equal(fromTemplate.rows.length, 1);
  assert.deepEqual(fromTemplate.rows[0].errors, []);
  assert.deepEqual({ ...fromTemplate.rows[0].post, id: "x" }, { ...fromTemplate.rows[0].post, id: "x", date: "2026-11-02", time: "18:30", format: "Reel", networks: ["Instagram", "TikTok"], status: "Borrador", important: true, paid: false, brand: "Manabiche" });

  // Excel in Spanish: ";" separator, DD/MM/AAAA dates, quoted copy with a line break, aliases and a blank row.
  const csv = "﻿Título;Fecha;Hora;Formato;Redes;Estado;Pauta;Copy\n" +
    "Promo;02/11/2026;6:30 pm;carrusel;IG, fb;programado;sí;\"Línea 1\nLínea 2; con punto y coma\"\n\n" +
    "Idea suelta;;;;;;;\n" +
    ";31/02/2026;25:00;historia;Twitter;listo;quizá;\n";
  const result = readImportRows(parseCsv(csv), { ...options, existing: [{ brand: "Manabiche", date: "", time: "09:00", title: "idea suelta" }] });
  assert.equal(result.rows.length, 3);
  const [promo, idea, bad] = result.rows;
  assert.deepEqual([promo.post.date, promo.post.time, promo.post.format, promo.post.networks, promo.post.status, promo.post.paid, promo.post.copy], ["2026-11-02", "18:30", "Carrusel", ["Instagram", "Facebook"], "Aprobado", true, "Línea 1\nLínea 2; con punto y coma"]);
  assert.equal(idea.post.date, "");
  assert.equal(idea.duplicate, true);
  assert.equal(bad.line, 5);
  assert.equal(bad.errors.length, 7);

  // Excel serial date and time fraction; missing Título column; unassigned company.
  assert.equal(readImportRows([["Título", "Fecha", "Hora"], ["A", 46328, 0.75]], options).rows[0].post.date, "2026-11-02");
  assert.equal(readImportRows([["Título", "Fecha", "Hora"], ["A", 46328, 0.75]], options).rows[0].post.time, "18:00");
  assert.deepEqual(readImportRows([["Fecha"], ["2026-11-02"]], options).missingColumns, ["Título"]);
  assert.match(readImportRows([["Título", "Empresa"], ["A", "Otra"]], { ...options, companies: ["Manabiche"] }).rows[0].errors[0], /no está asignada/);
});
