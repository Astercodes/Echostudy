const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const goalForDay = (g, day) => g.repeat && g.repeat !== 'none'
  ? Boolean(g.periodStart && g.periodStart <= day && day <= g.due)
  : g.due ? g.due === day : g.level === 'Day';
export function goalPeriod(repeat, day) {
  const start = new Date(day + 'T12:00:00');
  if (repeat === 'weekly') start.setDate(start.getDate() - (start.getDay()+6)%7);
  if (repeat === 'monthly') start.setDate(1);
  if (repeat === 'yearly') start.setMonth(0,1);
  const end = new Date(start);
  if (repeat === 'weekly') end.setDate(end.getDate()+6);
  if (repeat === 'monthly') { end.setMonth(end.getMonth()+1); end.setDate(0); }
  if (repeat === 'yearly') end.setMonth(11,31);
  return { start: localDate(start), end: localDate(end) };
}
export function refreshRecurringGoals(goals, day) {
  let changed = false;
  const next = goals.map(g => {
    if (!['daily','weekly','monthly','yearly'].includes(g.repeat)) return g;
    const period = goalPeriod(g.repeat, day);
    if (g.periodStart === period.start) return g;
    changed = true;
    return { ...g, periodStart: period.start, due: period.end, progress: 0,
      periodHistory: g.periodStart ? [...(g.periodHistory || []), { start: g.periodStart, end: g.due, progress: g.progress }] : (g.periodHistory || []) };
  });
  return changed ? next : goals;
}
const themes = [
  [/bible|scripture|prayer|worship|god|spiritual|meditat/i, 'faith spiritual scripture prayer', ['spiritual']],
  [/present|public speak|communicat|speech|feedback/i, 'communication public speaking', ['communication']],
  [/manager|management|lead|delegat|team/i, 'leadership management', ['leadership','professional']],
  [/budget|saving|save money|invest|debt|financ/i, 'financial money', ['financial']],
  [/exercise|workout|run |fitness|strength|sleep/i, 'physical health fitness', ['physical']],
  [/marriage|spouse|relationship|friend/i, 'relationships marriage family', ['relational','emotional']],
  [/paint|design|write|music|creat/i, 'creative creativity', ['creative']],
  [/study|learn|read|course|master/i, 'intellectual learning education', ['learning','intellectual']],
];
export function suggestGoal(title, areas) {
  const hits = themes.filter(([pattern]) => pattern.test(title));
  const words = (s) => s.toLowerCase().split(/[^a-z]+/).filter(w => w.length > 3);
  const direct = words(title);
  const hints = words(hits.map(x => x[1]).join(' '));
  const score = name => words(name).reduce((n,w) => n + (direct.includes(w) ? 4 : hints.includes(w) ? 1 : 0),0);
  const ranked = areas.map(a => ({ a, score: score(a.name)*3 + Math.max(0,...a.subAreas.map(s => score(s.name))) })).sort((a,b)=>b.score-a.score);
  const area = ranked[0]?.score > 0 ? ranked[0].a : null;
  const sub = area?.subAreas.map(s => ({s,score:score(s.name)})).sort((a,b)=>b.score-a.score)[0];
  return { areaId: area?.id || '', subAreaId: sub?.score > 0 ? sub.s.id : '', capacityIds: [...new Set(hits.flatMap(x=>x[2]))].slice(0,4) };
}
