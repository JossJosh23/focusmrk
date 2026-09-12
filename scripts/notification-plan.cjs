const defaults = { start: '08:00', end: '20:00', rules: { summary: { intensity: 'gentle', time: '08:00' }, today: { intensity: 'normal', time: '10:00' }, review: { intensity: 'off', time: '09:00' }, overdue: { intensity: 'off', time: '11:00' } } };
const offsets = { off: [], gentle: [0], normal: [0,240], intense: [0,120,240,360] };
const minutes = value => Number(value.slice(0,2))*60 + Number(value.slice(3));
function plan(posts, settings, date, time) {
  const current = minutes(time);
  if (current < minutes(settings.start) || current >= minutes(settings.end)) return [];
  const pending = posts.filter(p => p.status !== 'Publicado');
  const groups = {
    summary: pending.filter(p => p.date <= date),
    today: pending.filter(p => p.date === date),
    review: pending.filter(p => p.date <= date && p.status === 'En revisión'),
    overdue: pending.filter(p => p.date < date),
  };
  const titles = { summary: 'Tu plan para hoy', today: 'Pendientes de hoy', review: 'Contenido por revisar', overdue: 'Publicaciones atrasadas' };
  const events = [];
  for (const kind of Object.keys(groups)) {
    const rule = settings.rules[kind]; const items = groups[kind];
    if (!items.length || !rule || !offsets[rule.intensity]) continue;
    for (const offset of offsets[rule.intensity]) {
      const slot = minutes(rule.time) + offset;
      // A missed slot has a one-hour retry window; never replay a whole day's alerts.
      if (slot < minutes(settings.start) || slot >= minutes(settings.end) || current < slot || current >= slot + 60) continue;
      events.push({ key: JSON.stringify(['daily-v1', date, kind, slot]), payload: {
        title: `${rule.intensity === 'intense' ? 'Prioridad · ' : ''}${titles[kind]}`,
        body: `${items.length} pendiente${items.length === 1 ? '' : 's'} · ${items.slice(0,2).map(p => `${String(p.brand).slice(0,40)}: ${String(p.title).slice(0,70)}`).join(' · ')}${items.length > 2 ? '…' : ''}`,
        tag: `focusmrk-${kind}-${date}`, url: '/?module=notifications', badge: groups.summary.length,
      }, ttl: Math.min(3600, (minutes(settings.end) - current) * 60) });
    }
  }
  return events;
}
module.exports = { plan, defaults };
