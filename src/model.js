import { migrateWorkspace, validateLifeArea } from "./life-areas.js";
import { validateBarns } from "./barns.js";
export { migrateWorkspace } from "./life-areas.js";

export const COLORS = [
  "#009cde",
  "#173dc5",
  "#07529a",
  "#ff7900",
  "#dcefff",
  "#ffd7b0",
  "#ffd43b",
  "#df352d",
];
export const readableAccent = (color) =>
  ({
    "#009cde": "#006596",
    "#a9c5e5": "#526b8c",
    "#07529a": "#073d75",
    "#ff7900": "#984400",
    "#dcefff": "#164c7e",
    "#ffd7b0": "#8a450e",
    "#ffd43b": "#765600",
    "#df352d": "#b4231c",
  })[color?.toLowerCase()] || color;
export const DOMAINS = [
  "Mind & expertise",
  "Spirit & faith",
  "Health & energy",
  "Career & craft",
  "Relationships",
  "Life & finances",
];
export const LEVELS = ["Year", "Quarter", "Month", "Week", "Day"];
export const uid = () => crypto.randomUUID();
export const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
export const minutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const clock = (m) =>
  String(Math.floor(m / 60)).padStart(2, "0") +
  ":" +
  String(m % 60).padStart(2, "0");
export const duration = (m) =>
  m >= 60
    ? Math.floor(m / 60) + "h" + (m % 60 ? " " + Math.round(m % 60) + "m" : "")
    : Math.round(m) + "m";
export function validateBlock(block, blocks) {
  if (!block.title.trim()) return "Give this block a name.";
  if (
    !Number.isFinite(block.start) ||
    !Number.isFinite(block.end) ||
    block.start < 0 ||
    block.end > 1440 ||
    block.end <= block.start
  )
    return "Choose an end time after the start, within this day. Split overnight blocks at midnight.";
  if (
    blocks.some(
      (b) => b.id !== block.id && block.start < b.end && block.end > b.start,
    )
  )
    return "This overlaps another block. Choose an open window.";
  return "";
}
export function fillStudyWindows(blocks, requested, goalId) {
  const fixed = blocks
    .filter((b) => b.kind !== "deep" && b.kind !== "light")
    .sort((a, b) => a.start - b.start);
  let remaining = requested,
    result = [...fixed],
    cursor = 0;
  const gaps = [];
  for (const b of [...fixed, { start: 1440, end: 1440 }]) {
    if (b.start > cursor) gaps.push([cursor, b.start]);
    cursor = Math.max(cursor, b.end);
  }
  for (const [a, b] of gaps) {
    let start = Math.max(a, 360),
      end = Math.min(b, 1380);
    while (remaining > 0 && end - start >= 25) {
      const length = Math.min(remaining, 90, end - start);
      if (length < 25) break;
      result.push({
        id: uid(),
        title: length >= 45 ? "Deep study" : "Light review",
        kind: length >= 45 ? "deep" : "light",
        start,
        end: start + length,
        goalId,
        objective: "",
      });
      remaining -= length;
      start += length;
      if (end - start >= 15) {
        result.push({
          id: uid(),
          title: "Reset & recharge",
          kind: "recovery",
          start,
          end: start + 15,
        });
        start += 15;
      }
    }
  }
  return {
    blocks: result.sort((a, b) => a.start - b.start),
    unplaced: remaining,
  };
}
export function ancestors(goalId, goals) {
  const chain = [],
    seen = new Set();
  let g = goals.find((g) => g.id === goalId);
  while (g && !seen.has(g.id)) {
    chain.unshift(g);
    seen.add(g.id);
    g = goals.find((p) => p.id === g.parent);
  }
  return chain;
}
export function goalProgress(id, goals) {
  const children = goals.filter((g) => g.parent === id);
  return children.length
    ? Math.round(
        children.reduce((n, g) => n + goalProgress(g.id, goals), 0) /
          children.length,
      )
    : goals.find((g) => g.id === id)?.progress || 0;
}
export function focusedMs(timer, now = Date.now()) {
  return timer
    ? timer.elapsed + (timer.started ? Math.max(0, now - timer.started) : 0)
    : 0;
}
export function insights(concepts) {
  concepts = concepts.filter(c => !c.trashedAt);
  const out = [];
  for (const c of concepts) {
    if (c.parent && c.status === "Growing")
      out.push({
        id: c.id + "-weak",
        concept: c.id,
        type: "Strengthen a branch",
        title: "Build confidence in " + c.title,
        body: "This concept is still growing. Explain it in your own words and work through one example.",
      });
    const missing = (c.prerequisites || []).filter(
      (p) =>
        !concepts.some(
          (x) =>
            x.title.toLowerCase() === p.toLowerCase() &&
            x.status === "Confident",
        ),
    );
    if (missing.length)
      out.unshift({
        id: c.id + "-pre",
        concept: c.id,
        type: "Prerequisite gap",
        title: "Before " + c.title,
        body:
          "Review " +
          missing.join(", ") +
          ". These prerequisites are missing or not yet marked confident.",
      });
    if (c.parent && !(c.links || []).length)
      out.push({
        id: c.id + "-link",
        concept: c.id,
        type: "Make a connection",
        title: "Connect " + c.title,
        body: "This concept has no cross-links yet. Connect it to an idea in another branch.",
      });
    if (c.status === "Confident" && !c.applied)
      out.push({
        id: c.id + "-apply",
        concept: c.id,
        type: "Put it into practice",
        title: "Apply " + c.title,
        body: "You marked this confident, but have not recorded an application. Try a small real-world exercise.",
      });
    if (
      c.reviewed &&
      Date.now() - new Date(c.reviewed).getTime() > 7 * 86400000
    )
      out.push({
        id: c.id + "-review",
        concept: c.id,
        type: "Time to revisit",
        title: "Recall " + c.title,
        body: "It has been over a week since your last review. Test your recall before rereading.",
      });
  }
  return out;
}
export function initialState() {
  const goals = [
    {
      id: "g1",
      title: "Develop deep expertise in energy systems",
      level: "Year",
      domain: 0,
      parent: "",
      progress: 0,
    },
    {
      id: "g2",
      title: "Understand power systems fundamentals",
      level: "Quarter",
      domain: 0,
      parent: "g1",
      progress: 0,
    },
    {
      id: "g3",
      title: "Master generation, transmission & distribution",
      level: "Month",
      domain: 0,
      parent: "g2",
      progress: 0,
    },
    {
      id: "g4",
      title: "Understand electrical grid architecture",
      level: "Week",
      domain: 0,
      parent: "g3",
      progress: 0,
    },
    {
      id: "g5",
      title: "Explain transformers and substations",
      level: "Day",
      domain: 0,
      parent: "g4",
      progress: 0,
    },
    {
      id: "g6",
      title: "Build a grounded, consistent spiritual life",
      level: "Year",
      domain: 1,
      parent: "",
      progress: 0,
    },
    {
      id: "g7",
      title: "Study and reflect on wisdom each day",
      level: "Week",
      domain: 1,
      parent: "g6",
      progress: 0,
    },
  ];
  const concepts = [
    {
      id: "root",
      title: "My growing mind",
      parent: "",
      domain: 0,
      status: "Growing",
      links: [],
      prerequisites: [],
    },
    ...DOMAINS.map((title, i) => ({
      id: "d" + i,
      title,
      parent: "root",
      domain: i,
      status: "Growing",
      links: [],
      prerequisites: [],
    })),
    {
      id: "c1",
      title: "Energy systems",
      parent: "d0",
      domain: 0,
      status: "Growing",
      links: [],
      prerequisites: [],
    },
    {
      id: "c2",
      title: "Electrical grids",
      parent: "c1",
      domain: 0,
      status: "Growing",
      links: [],
      prerequisites: [],
    },
    {
      id: "c3",
      title: "Transformers",
      parent: "c2",
      domain: 0,
      status: "Growing",
      links: ["c6"],
      prerequisites: ["Electromagnetic induction"],
    },
    {
      id: "c4",
      title: "Wisdom",
      parent: "d1",
      domain: 1,
      status: "Growing",
      links: ["c8"],
      prerequisites: [],
    },
    {
      id: "c5",
      title: "Rest & recovery",
      parent: "d2",
      domain: 2,
      status: "Growing",
      links: [],
      prerequisites: [],
    },
    {
      id: "c6",
      title: "Systems thinking",
      parent: "d3",
      domain: 3,
      status: "Growing",
      links: ["c1"],
      prerequisites: [],
    },
    {
      id: "c7",
      title: "Active listening",
      parent: "d4",
      domain: 4,
      status: "Growing",
      links: [],
      prerequisites: [],
    },
    {
      id: "c8",
      title: "Decision making",
      parent: "d5",
      domain: 5,
      status: "Growing",
      links: ["c6"],
      prerequisites: [],
    },
  ];
  const blocks = [
    ["Sleep", 0, 420, "recovery"],
    ["Prayer & stillness", 420, 450, "reflection", "g7"],
    ["Move, breakfast & prepare", 450, 510, "life"],
    [
      "Deep study: energy systems",
      510,
      540,
      "deep",
      "g5",
      "Explain how a transformer changes voltage.",
    ],
    ["Work & responsibilities", 540, 1020, "fixed"],
    ["Walk & decompress", 1020, 1050, "recovery"],
    ["Dinner & relationships", 1050, 1110, "life"],
    [
      "Power systems fundamentals",
      1110,
      1200,
      "deep",
      "g5",
      "Explain transformers and substations using a simple grid diagram.",
    ],
    ["Rest your mind", 1200, 1215, "recovery"],
    [
      "Read, connect & review",
      1215,
      1275,
      "light",
      "g4",
      "Connect electrical grids to systems thinking.",
    ],
    ["Prayer & daily reflection", 1275, 1305, "reflection", "g7"],
    ["Life, chores & wind down", 1305, 1440, "life"],
  ].map(([title, start, end, kind, goalId = "", objective = ""]) => ({
    id: uid(),
    title,
    start,
    end,
    kind,
    goalId,
    objective,
  }));
  return migrateWorkspace({
    version: 1,
    onboarded: false,
    goals,
    concepts,
    plans: { [today()]: blocks },
    sessions: [],
    notes: [],
    resources: [],
    reflections: {},
    timer: null,
  });
}
export function validateBackup(s) {
  if (
    !s ||
    ![1, 2].includes(s.version) ||
    !Array.isArray(s.goals) ||
    !Array.isArray(s.concepts) ||
    !s.plans ||
    !Array.isArray(s.sessions) ||
    !Array.isArray(s.notes) ||
    !Array.isArray(s.resources)
  )
    return false;
  const unique = (a) =>
    a.every((x) => x && typeof x.id === "string") &&
    new Set(a.map((x) => x.id)).size === a.length;
  if (![s.goals, s.concepts, s.sessions, s.notes, s.resources].every(unique))
    return false;
  if (!validateBarns(s)) return false;
  if (s.version === 2) {
    if (
      !Array.isArray(s.lifeAreas) ||
      !s.lifeAreas.length ||
      !unique(s.lifeAreas)
    )
      return false;
    for (const area of s.lifeAreas) {
      if (
        typeof area.name !== "string" ||
        !Array.isArray(area.subAreas) ||
        !unique(area.subAreas) ||
        area.subAreas.some((sub) => typeof sub.name !== "string") ||
        validateLifeArea(area, s.lifeAreas)
      )
        return false;
    }
  }
  if (
    s.goals.some(
      (g) =>
        typeof g.title !== "string" ||
        !LEVELS.includes(g.level) ||
        (s.version === 1 &&
          (!Number.isInteger(g.domain) || g.domain < 0 || g.domain > 5)) ||
        (s.version === 2 && validateGoal(g, s.goals, s.lifeAreas)) ||
        !Number.isFinite(g.progress) ||
        g.progress < 0 ||
        g.progress > 100,
    )
  )
    return false;
  for (const list of [s.goals, s.concepts])
    for (const x of list) {
      let p = x,
        seen = new Set();
      while (p) {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        if (p.parent && !list.some((y) => y.id === p.parent)) return false;
        p = list.find((y) => y.id === p.parent);
      }
    }
  if (
    s.concepts.some(
      (c) =>
        typeof c.title !== "string" ||
        !Array.isArray(c.links) ||
        !Array.isArray(c.prerequisites),
    )
  )
    return false;
  for (const blocks of Object.values(s.plans)) {
    if (
      !Array.isArray(blocks) ||
      !unique(blocks) ||
      blocks.some(
        (b) => typeof b.title !== "string" || validateBlock(b, blocks),
      )
    )
      return false;
  }
  return true;
}

export function validateGoal(goal, goals, areas) {
  if (typeof goal.title !== "string" || !goal.title.trim())
    return "Give this goal a clear title.";
  if (!LEVELS.includes(goal.level)) return "Choose a time horizon.";
  const area = areas.find((a) => a.id === goal.areaId);
  if (!area) return "Choose a life area.";
  if (goal.subAreaId && !area.subAreas.some((s) => s.id === goal.subAreaId))
    return "Choose a sub-area that belongs to this life area.";
  if (
    !Number.isFinite(goal.progress) ||
    goal.progress < 0 ||
    goal.progress > 100
  )
    return "Progress must be between 0 and 100.";
  if (goal.parent) {
    const parent = goals.find((g) => g.id === goal.parent);
    if (
      !parent ||
      parent.id === goal.id ||
      parent.areaId !== goal.areaId ||
      LEVELS.indexOf(parent.level) >= LEVELS.indexOf(goal.level)
    )
      return "Link to a longer-horizon goal in the same life area.";
  }
  if (
    goals.some(
      (g) =>
        g.parent === goal.id &&
        (g.areaId !== goal.areaId ||
          LEVELS.indexOf(g.level) <= LEVELS.indexOf(goal.level)),
    )
  )
    return "Keep this goal in the same life area and at a longer horizon than its child goals.";
  return "";
}
