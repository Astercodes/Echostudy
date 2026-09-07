export const CAPACITIES = [
  ["spiritual", "Spiritual", "What can I carry spiritually?"],
  ["intellectual", "Intellectual", "How deeply and broadly can I understand?"],
  [
    "cognitive",
    "Cognitive",
    "How effectively can I reason, remember, focus and solve?",
  ],
  [
    "emotional",
    "Emotional",
    "What emotional complexity, pressure and responsibility can I carry?",
  ],
  ["physical", "Physical", "What can my body sustain?"],
  [
    "relational",
    "Relational",
    "How well can I build, maintain and steward relationships?",
  ],
  [
    "professional",
    "Professional",
    "What level of work and responsibility can I competently handle?",
  ],
  [
    "leadership",
    "Leadership",
    "How effectively can I influence, organize and lead others?",
  ],
  [
    "financial",
    "Financial",
    "How effectively can I create, manage and steward resources?",
  ],
  ["creative", "Creative", "What can I imagine and create?"],
  ["execution", "Execution", "How reliably can I turn intention into action?"],
  [
    "learning",
    "Learning",
    "How quickly and deeply can I acquire new competence?",
  ],
  [
    "communication",
    "Communication",
    "How effectively can I understand and transmit ideas?",
  ],
  [
    "responsibility",
    "Responsibility",
    "How much complexity and obligation can I steward without things collapsing?",
  ],
  ["impact", "Impact", "How much useful change can I create beyond myself?"],
  [
    "character",
    "Character",
    "Who am I becoming as my influence and resources increase?",
  ],
].map(([id, name, question]) => ({ id, name, question }));
export const STAGES = [
  "Beginning with support",
  "Practising with guidance",
  "Applying independently",
  "Sustaining under complexity",
  "Helping others develop",
];
export const validCapacityIds = (ids) =>
  Array.isArray(ids) &&
  new Set(ids).size === ids.length &&
  ids.every((id) => CAPACITIES.some((c) => c.id === id));
// A consistent first milestone, independent of manual self-assessment stages.
export function capacityProgress(data, id, areaId = "", subAreaId = "") {
  const summary = capacitySummary(data, id, areaId, subAreaId);
  const linked = (goal) => {
    const seen = new Set();
    while (goal && !seen.has(goal.id)) {
      if (goal.capacityIds?.includes(id)) return true;
      seen.add(goal.id);
      goal = data.goals.find((g) => g.id === goal.parent);
    }
    return false;
  };
  // Count only actionable leaves so a completed daily goal and its parents
  // cannot multiply the same achievement.
  const goals = data.goals.filter(
    (g) =>
      linked(g) &&
      !data.goals.some((child) => child.parent === g.id) &&
      (!areaId || g.areaId === areaId) &&
      (!subAreaId || g.subAreaId === subAreaId),
  );
  const goalUnits = goals.reduce(
    (n, g) => n + Math.min(100, Math.max(0, g.progress || 0)) / 100,
    0,
  );
  const studyUnits = summary.sessions.reduce(
    (n, s) =>
      n +
      (s.planned > 0
        ? Math.min(1, Math.max(0, s.actualMs || 0) / (s.planned * 60000))
        : 0),
    0,
  );
  const study = Math.min(50, (studyUnits / 10) * 50);
  const goal = Math.min(50, (goalUnits / 5) * 50);
  return {
    ...summary,
    goals,
    goalUnits,
    studyUnits,
    study,
    goal,
    percent: Math.round(study + goal),
    completedGoals: goals.filter((g) => g.progress >= 100).length,
  };
}
export function capacitySummary(data, id, areaId = "", subAreaId = "") {
  const context = (item) => {
    const goal = data.goals.find((g) => g.id === item.goalId);
    return (
      (!areaId || (item.areaId ?? goal?.areaId) === areaId) &&
      (!subAreaId || (item.subAreaId ?? goal?.subAreaId) === subAreaId)
    );
  };
  const sessions = data.sessions.filter(
    (s) => s.capacityIds?.includes(id) && context(s),
  );
  const evidence = (data.capacityEvidence || [])
    .filter((e) => e.capacityId === id && context(e))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    );
  return {
    sessions,
    evidence,
    minutes: Math.round(
      sessions.reduce((sum, s) => sum + Math.max(0, s.actualMs || 0), 0) /
        60000,
    ),
  };
}
export function validateBarns(data) {
  if (
    [...data.goals, ...data.sessions, ...(data.timer ? [data.timer] : [])].some(
      (x) => x.capacityIds !== undefined && !validCapacityIds(x.capacityIds),
    )
  )
    return false;
  if (data.capacityEvidence === undefined) return true;
  if (
    !Array.isArray(data.capacityEvidence) ||
    new Set(data.capacityEvidence.map((e) => e?.id)).size !==
      data.capacityEvidence.length
  )
    return false;
  return data.capacityEvidence.every(
    (e) =>
      e &&
      typeof e.id === "string" &&
      CAPACITIES.some((c) => c.id === e.capacityId) &&
      Number.isInteger(e.stage) &&
      e.stage >= 1 &&
      e.stage <= 5 &&
      typeof e.evidence === "string" &&
      e.evidence.trim() &&
      /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
      typeof e.createdAt === "string" &&
      data.lifeAreas?.some(
        (a) =>
          a.id === e.areaId &&
          (!e.subAreaId || a.subAreas.some((s) => s.id === e.subAreaId)),
      ) &&
      (!e.sessionId || data.sessions.some((s) => s.id === e.sessionId)),
  );
}
