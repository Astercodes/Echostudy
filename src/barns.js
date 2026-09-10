import {
  harvestEntries,
  HARVEST_TYPES,
  validatePlanHierarchy,
} from "./stretch-plans.js";
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
  const stretches = (data.stretches || []).filter(
    (s) =>
      s.status === "completed" &&
      s.capacityIds.includes(id) &&
      (!areaId || s.areaId === areaId) &&
      (!subAreaId || s.subAreaId === subAreaId),
  );
  const practiceUnits = stretches.reduce((n, s) => n + s.completion / 100, 0);
  const practice = Math.min(60, (practiceUnits / 10) * 60);
  const study = Math.min(20, (studyUnits / 10) * 20);
  const goal = Math.min(20, (goalUnits / 5) * 20);
  return {
    ...summary,
    goals,
    goalUnits,
    studyUnits,
    study,
    goal,
    stretches,
    practiceUnits,
    practice,
    practiceMinutes: stretches.reduce((n, s) => n + s.actualMinutes, 0),
    percent: Math.round(study + goal + practice),
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
    harvestEvidence: harvestEntries(data).filter(
      (h) =>
        h.type === "capability" && h.capacityIds?.includes(id) && context(h),
    ),
    minutes: Math.round(
      sessions.reduce((sum, s) => sum + Math.max(0, s.actualMs || 0), 0) /
        60000,
    ),
  };
}
export function validateBarns(data) {
  if (data.stretches !== undefined) {
    if (
      !Array.isArray(data.stretches) ||
      new Set(data.stretches.map((s) => s?.id)).size !== data.stretches.length
    )
      return false;
    if (
      !data.stretches.every(
        (s) =>
          s &&
          typeof s.id === "string" &&
          ["planned", "active", "completed"].includes(s.status) &&
          typeof s.title === "string" &&
          s.title.trim() &&
          typeof s.objective === "string" &&
          s.objective.trim() &&
          typeof s.success === "string" &&
          s.success.trim() &&
          validCapacityIds(s.capacityIds) &&
          (!s.goalId || data.goals.some((g) => g.id === s.goalId)) &&
          (!s.areaId
            ? !s.subAreaId
            : data.lifeAreas?.some(
                (a) =>
                  a.id === s.areaId &&
                  (!s.subAreaId ||
                    a.subAreas.some((sub) => sub.id === s.subAreaId)),
              )) &&
          (s.knowledgeIds === undefined ||
            (Array.isArray(s.knowledgeIds) &&
              s.knowledgeIds.every((id) => typeof id === "string"))) &&
          (s.environment === undefined ||
            ["internal", "simulated", "social", "real"].includes(
              s.environment,
            )) &&
          (s.source === undefined ||
            ["knowledge", "gap", "goal", "life", "user"].includes(s.source)) &&
          (s.challenge === undefined ||
            (Number.isInteger(s.challenge) &&
              s.challenge >= 1 &&
              s.challenge <= 4)) &&
          (s.repeat === undefined ||
            ["once", "daily", "weekly"].includes(s.repeat)) &&
          ["studyGap", "evidence", "harvest", "opportunity"].every(
            (key) => s[key] === undefined || typeof s[key] === "string",
          ) &&
          (s.practiceMs === undefined ||
            (Number.isFinite(s.practiceMs) && s.practiceMs >= 0)) &&
          (!s.practiceStartedAt ||
            (typeof s.practiceStartedAt === "string" &&
              Number.isFinite(Date.parse(s.practiceStartedAt)))) &&
          ["practiceResponses", "rubric"].every(
            (key) =>
              s[key] === undefined ||
              (s[key] &&
                typeof s[key] === "object" &&
                !Array.isArray(s[key]) &&
                Object.values(s[key]).every((v) => typeof v === "string")),
          ) &&
          /^\d{4}-\d{2}-\d{2}$/.test(s.date) &&
          Number.isFinite(s.planned) &&
          s.planned > 0 &&
          s.planned <= 1440 &&
          Number.isFinite(s.actualMinutes) &&
          s.actualMinutes >= 0 &&
          s.actualMinutes <= 1440 &&
          Number.isFinite(s.completion) &&
          s.completion >= 0 &&
          s.completion <= 100 &&
          typeof s.outcome === "string" &&
          !validatePlanHierarchy(data.stretches, s) &&
          (s.applyAction === undefined || typeof s.applyAction === "string") &&
          (s.harvests === undefined ||
            (Array.isArray(s.harvests) &&
              new Set(s.harvests.map((h) => h?.id)).size ===
                s.harvests.length &&
              s.harvests.every(
                (h) =>
                  h &&
                  typeof h.id === "string" &&
                  HARVEST_TYPES[h.type] &&
                  typeof h.title === "string" &&
                  h.title.trim() &&
                  typeof h.description === "string" &&
                  h.description.trim() &&
                  typeof h.evidence === "string" &&
                  /^\d{4}-\d{2}-\d{2}$/.test(h.date) &&
                  [h.knowledgeIds, h.resourceIds].every(
                    (ids) =>
                      Array.isArray(ids) &&
                      ids.every((id) => typeof id === "string"),
                  ) &&
                  validCapacityIds(h.capacityIds),
              ))) &&
          (s.status !== "completed" || s.outcome.trim()),
      )
    )
      return false;
  }
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
