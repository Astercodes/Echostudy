import { knowledgeLabel, locationOf } from "./knowledge-tree.js";

export const ENVIRONMENTS = {
  internal: {
    title: "Internal",
    subtitle: "Rehearse within",
    color: "#173dc5",
    description:
      "Mental rehearsal, decision walkthroughs, visualization, reflection and self-explanation.",
    prompts: [
      "Picture the situation. What is happening and what matters?",
      "Walk through your response. What would you do, and why?",
      "Take another perspective. What might you have missed?",
      "Rehearse again. What will you change in the next attempt?",
    ],
  },
  simulated: {
    title: "Simulated",
    subtitle: "Try a constructed challenge",
    color: "#009cde",
    description:
      "Cases, mock interviews, practice presentations, role-play and scenario challenges.",
    prompts: [
      "Respond to the opening scenario. Show what you would say or do.",
      "A constraint changes: you have half the time and someone challenges your approach. Respond.",
      "Explain the trade-off you made. What evidence would change your decision?",
      "Replay the weakest moment using a different approach.",
    ],
  },
  social: {
    title: "Social",
    subtitle: "Practise with someone",
    color: "#d49a00",
    description:
      "Peer practice, teaching, mentoring, collaboration and feedback without major stakes.",
    prompts: [
      "Agree roles with your partner. Who will practise and who will observe?",
      "Perform the task. Capture what you tried or taught.",
      "Ask for feedback: what was clear, what was difficult, and what should change?",
      "Switch roles or try again. What improved?",
    ],
  },
  real: {
    title: "Real-world",
    subtitle: "Use it where it matters",
    color: "#df352d",
    description:
      "Actual work, home, school, community, projects, relationships and creative practice.",
    prompts: [
      "Define the real situation, the people involved and the constraints.",
      "Take the action within your responsibility. Record what you actually did.",
      "Observe the outcome. What changed, and what evidence supports that?",
      "Review consequences and follow-up. What will you do or study next?",
    ],
  },
};
export const CHALLENGES = [
  "Supported attempt",
  "Independent repetition",
  "Adapt to constraints",
  "Integrated complexity",
];
const examples = [
  [
    /leadership|influence/i,
    "Forest",
    "Lead one meaningful initiative",
    "Choose an initiative involving at least three people. Agree a useful outcome, delegate responsibilities and review progress this quarter.",
    "A completed milestone, contributions from three people and a documented review.",
  ],
  [
    /^management$/i,
    "Grove",
    "Coordinate a small team initiative",
    "Plan, coordinate and review a small team initiative this month. Combine people management, communication and decision-making.",
    "A shared plan, named responsibilities and a review of the result.",
  ],
  [
    /people management/i,
    "Tree",
    "Conduct three structured 1:1 meetings",
    "Prepare and conduct three 1:1 meetings. Adapt your questions to each person and document what you learn about managing them.",
    "Three meeting records with agreed next steps and a reflection on the differences.",
  ],
  [
    /active listening/i,
    null,
    "Listen, summarize, then respond",
    "In three conversations, listen without interrupting and summarize what you heard before responding.",
    "Three examples where the other person confirms or corrects your summary.",
  ],
  [
    /core principles.*manag/i,
    "Stem",
    "Exercise expectation-setting, delegation and feedback",
    "For one week, use expectation-setting, delegation and feedback in one responsibility involving another person.",
    "Clear expectations, an agreed delegation and a recorded feedback conversation.",
  ],
  [
    /performance management/i,
    null,
    "Set and review a performance expectation",
    "Agree a measurable expectation with someone and set a follow-up point. Rehearse the discussion first if useful.",
    "An agreed measure, a follow-up date and a record of how progress will be reviewed.",
  ],
  [
    /^feedback$/i,
    null,
    "Give specific developmental feedback",
    "Choose one observable behaviour and practise giving developmental feedback with a clear example and an invitation to respond.",
    "A specific example, its impact, the other person's response and an agreed next step.",
  ],
  [
    /\bSBI\b|situation.behavio[u]?r.impact/i,
    null,
    "Rewrite three vague feedback statements",
    "Rewrite “be more professional”, “communicate better” and “you are unreliable” using Situation–Behavior–Impact. Separate observations from interpretation.",
    "Three statements with an observable situation, behaviour and impact; no personality labels.",
  ],
  [
    /corrective feedback/i,
    null,
    "Handle a defensive response to corrective feedback",
    "Rehearse a corrective-feedback conversation. Your partner says: “That is unfair—you only notice my mistakes.” Respond, clarify the behaviour and agree a next step.",
    "A calm acknowledgement, a specific example, an invitation to respond and a clear agreement.",
  ],
];
export function contextualizePractice(data, node, base) {
  const example = examples.find(
    ([pattern, level]) =>
      pattern.test(node.title) &&
      (!level || level === knowledgeLabel(node, data.concepts)),
  );
  if (!example) return base;
  return {
    ...base,
    title: example[2],
    objective: `${example[3]} ${ENVIRONMENTS[base.environment].subtitle}: adapt this activity to your chosen environment. ${base.practiceDemand || ""}`,
    success: example[4],
    applyAction: `Perform this practice: ${example[2]}.`,
    scenario: example[3],
  };
}
const words = (value) =>
  new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N} ]/gu, " ")
      .split(/\s+/)
      .filter(
        (w) =>
          w.length > 3 &&
          ![
            "with",
            "this",
            "that",
            "have",
            "will",
            "from",
            "what",
            "your",
            "want",
            "practice",
            "learn",
            "develop",
          ].includes(w),
      ),
  );
export function relatedPracticeKnowledge(data, nodes, text, areaId = "") {
  const tokens = words(text);
  return nodes
    .map((node) => {
      const haystack = words(`${node.title} ${(node.aliases || []).join(" ")}`);
      const shared = [...tokens].filter((w) => haystack.has(w));
      const home = locationOf(node, data.concepts, data.lifeAreas);
      return {
        node,
        shared,
        score: shared.length * 5 + (areaId && home.areaId === areaId ? 1 : 0),
      };
    })
    .filter((x) => x.shared.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}
export function practiceElapsed(record, now = Date.now()) {
  return (
    (record.practiceMs || 0) +
    (record.practiceStartedAt
      ? Math.max(0, now - Date.parse(record.practiceStartedAt))
      : 0)
  );
}
export function finishPracticeRecord(
  data,
  record,
  now = new Date().toISOString(),
) {
  const completed = {
    ...record,
    status: "completed",
    completedAt: record.completedAt || now,
    practiceMs: practiceElapsed(record, Date.parse(now)),
    practiceStartedAt: null,
  };
  const records = [
    ...(data.stretches || []).filter((s) => s.id !== record.id),
    completed,
  ];
  if (
    ["daily", "weekly"].includes(record.repeat) &&
    !records.some((s) => s.previousStretchId === record.id)
  ) {
    const date = new Date(`${record.date}T12:00:00`);
    date.setDate(date.getDate() + (record.repeat === "daily" ? 1 : 7));
    const nextDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    records.push({
      ...record,
      id: crypto.randomUUID(),
      previousStretchId: record.id,
      seriesId: record.seriesId || record.id,
      date: nextDate,
      status: "planned",
      completedAt: null,
      startedAt: null,
      practiceStartedAt: null,
      practiceMs: 0,
      actualMinutes: 0,
      completion: 100,
      outcome: "",
      harvest: "",
      harvests: [],
      evidence: "",
      studyGap: "",
      gapResolved: false,
      practiceResponses: {},
      rubric: {},
      nextStep: "",
    });
  }
  return { ...data, stretches: records };
}
