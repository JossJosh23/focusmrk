export function periodBounds(start: string, end: string) {
  const valid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
  if (!valid(start) || !valid(end) || start > end) throw new Error("Selecciona un periodo válido.");
  const from = Date.parse(start + "T00:00:00-05:00"), until = Date.parse(end + "T00:00:00-05:00") + 86400000;
  if (until - from > 366 * 86400000) throw new Error("Selecciona un periodo de hasta un año.");
  return { from, until };
}
