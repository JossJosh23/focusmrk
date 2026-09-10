import test from "node:test";
import assert from "node:assert/strict";
import { dateKey, emptyPublication, isPublication, monthDays, parseDate, readPublications, validDate } from "../lib/calendar.ts";

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

test("storage preserves multiple posts on one date and their complete contents", () => {
  const second = { ...first, id: "b", title: "Otra publicación", format: "Historia" };
  const restored = readPublications(JSON.stringify([first, second]));
  assert.deepEqual(restored, [first, second]);
  assert.deepEqual(readPublications(null), []);
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
