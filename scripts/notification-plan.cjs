const defaults = { start: '08:00', end: '20:00', dailyLimit: 4, rules: { summary: { intensity: 'gentle', time: '08:00' }, today: { intensity: 'normal', time: '10:00' }, review: { intensity: 'off', time: '09:00' }, overdue: { intensity: 'off', time: '11:00' } } };
const offsets = { off: [], gentle: [0], normal: [0,240], intense: [0,120,240,360] };
const minutes = value => Number(value.slice(0,2))*60 + Number(value.slice(3));
function plan(posts, settings, date, time, tasks = [], now = Date.now()) {
  const current = minutes(time);
  if (current < minutes(settings.start) || current >= minutes(settings.end)) return [];
  const pending = posts.filter(p => p.status !== 'Publicado' && p.date <= date).map(p => ({ ...p, itemId: `post:${p.id}`, priority: 'important' }));
  const work = tasks.filter(t => !t.done && t.date <= date && (!t.snoozedUntil || Date.parse(t.snoozedUntil) <= now)).map(t => ({ ...t, itemId: `task:${t.id}`, brand: 'Tarea' }));
  const groups = {
    summary: [...pending, ...work],
    today: pending.filter(p => p.date === date && (p.status !== 'En revisión' || settings.rules.review.intensity === 'off')),
    review: pending.filter(p => p.status === 'En revisión'),
    overdue: pending.filter(p => p.date < date && (p.status !== 'En revisión' || settings.rules.review.intensity === 'off')),
  };
  const slots = new Map();
  function add(slot, items, summary = false) {
    if (!items.length || slot < minutes(settings.start) || slot >= minutes(settings.end) || current < slot || current >= slot + 60) return;
    const event = slots.get(slot) || { slot, summary: false, items: new Map() };
    event.summary ||= summary;
    for (const item of items) event.items.set(item.itemId, item);
    slots.set(slot, event);
  }
  for (const kind of Object.keys(groups)) {
    const rule = settings.rules[kind];
    if (!rule || !offsets[rule.intensity]) continue;
    for (const offset of offsets[rule.intensity]) add(minutes(rule.time) + offset, groups[kind], kind === 'summary');
  }
  // Priority controls task follow-ups; Today is the master switch for these reminders.
  if (settings.rules.today.intensity !== 'off') {
    for (const task of work) {
      const schedule = task.priority === 'urgent' ? offsets.intense : task.priority === 'important' ? offsets.normal : [];
      for (const offset of schedule) add(minutes(settings.rules.today.time) + offset, [task]);
    }
  }
  return [...slots.values()].sort((a,b) => a.slot - b.slot).map(event => {
    const rank = { urgent: 0, important: 1, normal: 2 };
    const items = [...event.items.values()].sort((a,b) => rank[a.priority] - rank[b.priority]);
    return { key: JSON.stringify(['daily-v2', date, event.slot]), payload: {
      title: event.summary ? 'Tu plan para hoy' : items.some(i => i.priority === 'urgent') ? 'Prioridad · Tu siguiente paso' : 'Pendientes de hoy',
      body: `${items.length} pendiente${items.length === 1 ? '' : 's'} · ${items.slice(0,2).map(p => `${String(p.brand).slice(0,40)}: ${String(p.title).slice(0,70)}`).join(' · ')}${items.length > 2 ? '…' : ''}`,
      tag: `focusmrk-day-${date}`, url: '/?module=day', badge: pending.length + tasks.filter(t => !t.done && t.date <= date).length,
    }, ttl: Math.min(3600, (minutes(settings.end) - current) * 60) };
  });
}
module.exports = { plan, defaults };
