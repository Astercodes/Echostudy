import {
  knowledgeEntries,
  knowledgeLabel,
  locationOf,
  isScaffold,
  scopeId,
} from "./knowledge-tree.js";
import { knowledgeIntelligence } from "./knowledge-intelligence.js";
import { contextualizePractice } from "./stretch-practice.js";
import { goalHorizon } from "./stretch-plans.js";

export const PRACTICE_ENVIRONMENTS = {
  internal: "Internal",
  simulated: "Simulated",
  social: "Social",
  real: "Real-world",
};
export const STRETCH_SOURCES = {
  knowledge: "Knowledge-driven",
  gap: "Gap-driven",
  goal: "Goal-driven",
  life: "Life-driven",
  user: "User-created",
};
export function practiceNodes(data) {
  const all = knowledgeEntries(data),
    byId = new Map(all.map((n) => [n.id, n]));
  return all.filter((n) => {
    if (isScaffold(n) || n.trashedAt) return false;
    const home = locationOf(n, data.concepts, data.lifeAreas);
    if (
      byId.get(scopeId(home.areaId))?.trashedAt ||
      byId.get(scopeId(home.areaId, home.subAreaId))?.trashedAt
    )
      return false;
    const seen = new Set();
    let parent = byId.get(n.parent);
    while (parent && !seen.has(parent.id)) {
      if (parent.trashedAt) return false;
      seen.add(parent.id);
      parent = byId.get(parent.parent);
    }
    return true;
  });
}
const scopes = {
  Forest: [
    "Plan and lead a meaningful initiative",
    "Combine ideas from several groves; identify people, responsibilities and a useful outcome.",
    90,
  ],
  Grove: [
    "Coordinate a small practical project",
    "Combine related skills, plan the work and review the result with those involved.",
    60,
  ],
  Tree: [
    "Practise a complete domain task",
    "Use several branches together and document which parts worked and which need study.",
    45,
  ],
  Root: [
    "Rehearse a foundation",
    "Practise one foundational behaviour three times, checking it against its core principle.",
    15,
  ],
  Stem: [
    "Exercise core principles",
    "Use the main principles together in one responsibility and explain your choices.",
    30,
  ],
  Branch: [
    "Practise a skill family",
    "Choose one task that uses this skill, set a measurable expectation and review your attempt.",
    25,
  ],
  "Sub-branch": [
    "Rehearse a specific skill",
    "Perform one focused task using this skill, then repeat with a changed constraint.",
    15,
  ],
  Leaf: [
    "Try a five-minute micropractice",
    "Use this definition, fact, formula or principle in three small examples and check your reasoning.",
    5,
  ],
  Fruit: [
    "Apply a specific idea",
    "Perform a realistic scenario using this idea and respond to one complication.",
    20,
  ],
  Seed: [
    "Explore a question through practice",
    "Try a small, reversible experiment and note what you need to learn next.",
    10,
  ],
};
export function knowledgeStretch(
  data,
  node,
  environment = "internal",
  challenge = 1,
) {
  const label = knowledgeLabel(node, data.concepts),
    spec = scopes[label] || scopes.Branch;
  const context = {
    internal:
      "Mentally rehearse the task and write out your decisions before trying it.",
    simulated:
      "Use a made-up case or mock scenario with clear constraints; record your performance.",
    social:
      "Practise with a willing peer or mentor and ask for specific feedback.",
    real: "Choose an appropriate real situation within your responsibility and document what happens.",
  }[environment];
  const demand =
    [
      "Start with one small, supported attempt.",
      "Repeat independently and compare three attempts.",
      "Add an unfamiliar constraint and explain your adaptations.",
      "Integrate related skills under realistic complexity and evaluate the result.",
    ][challenge - 1] || "";
  return contextualizePractice(data, node, {
    source: "knowledge",
    knowledgeIds: [node.id],
    sourceTitle: node.title,
    ...locationOf(node, data.concepts, data.lifeAreas),
    environment,
    challenge,
    title: `${spec[0]}: ${node.title}`,
    objective: `${spec[1]} ${context} ${demand}`,
    practiceDemand: demand,
    success:
      "Record what you did, the evidence of your performance, and one improvement or question for further study.",
    applyAction: `Perform the ${label.toLowerCase()} practice described here.`,
    planned: spec[2],
    rationale: `${label}-level practice: ${spec[1]}`,
  });
}
export function gapStretches(data, environment = "simulated", challenge = 1) {
  const nodes = new Map(practiceNodes(data).map((n) => [n.id, n]));
  return knowledgeIntelligence(data)
    .suggestions.filter((s) =>
      ["understanding", "recall", "calibration", "practice-gap"].includes(
        s.kind,
      ),
    )
    .slice(0, 12)
    .flatMap((s) => {
      const n = nodes.get(s.concept);
      if (!n) return [];
      const task =
        s.kind === "recall"
          ? `Explain ${n.title} without notes. Use it in one example, compare with your reference, then repeat from memory.`
          : s.kind === "calibration"
            ? `Predict how well you can use ${n.title}, perform one task, and compare your prediction with the result.`
            : `Use ${n.title} in three short scenarios. Compare your decisions with a trusted reference and repeat the weakest response.`;
      return [
        {
          ...knowledgeStretch(data, n, environment, challenge),
          source: "gap",
          title: `Work on a gap: ${n.title}`,
          objective: task,
          rationale: s.evidence || s.body,
          gapId: s.id,
          studyAction: s.action,
          success:
            "Record the initial difficulty, the corrected attempt and the evidence of improvement.",
        },
      ];
    });
}
export function goalStretch(goal) {
  return {
    source: "goal",
    goalId: goal.id,
    areaId: goal.areaId || "",
    subAreaId: goal.subAreaId || "",
    capacityIds: goal.capacityIds || [],
    environment: "real",
    challenge: 1,
    title: `Take one practical step: ${goal.title}`,
    objective: `Identify one capability needed for “${goal.title}”, then perform a small task that demonstrates it. Identify the supporting knowledge and link it below.`,
    success:
      "Produce one observable result that advances this goal; record evidence and what to improve.",
    applyAction:
      "Perform the smallest real task that demonstrates movement toward this goal.",
    horizon: goalHorizon(goal),
    planned: 30,
    rationale:
      "Working backward from your selected goal; edit this starting point to match your situation.",
  };
}
export function nextPracticeDate(date, repeat) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + (repeat === "daily" ? 1 : 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
