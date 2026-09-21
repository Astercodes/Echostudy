import test from "node:test";
import assert from "node:assert/strict";
import {
  curriculumPathway,
  energyCurriculum,
  growLesson,
  outlinePathway,
  upgradeEnergyPathways,
} from "../src/curriculum-pathway.js";
import { acceptPathway } from "../src/growth-pathway.js";
import { integrateLearning } from "../src/learning-integration.js";
const base = () => ({
  lifeAreas: [
    {
      id: "career",
      name: "Career",
      subAreas: [{ id: "energy", name: "Energy" }],
    },
  ],
  goals: [
    {
      id: "g",
      title:
        "Develop deep expertise in strategy and innovation in the energy industry",
      areaId: "career",
      subAreaId: "energy",
    },
  ],
  concepts: [],
  notes: [],
  resources: [],
  sessions: [],
  stretches: [],
  plans: {},
  learningPlanner: [],
});
test("supplied curriculum preserves business topic plus all 80 energy concept groups and 15-question applied lesson", () => {
  const d = base(),
    p = curriculumPathway(d, d.goals[0], "", [], []);
  assert.equal(energyCurriculum.levels.length, 21);
  assert.equal(
    p.steps.filter((s) => s.levelOrder === 1 && s.type === "study").length,
    80,
  );
  const applied = p.steps.find((s) => s.title === "Map an Energy Company");
  assert.equal(applied.topics.length, 15);
  assert.equal(applied.type, "stretch");
  assert.equal(
    p.steps.find((s) => s.moduleTitle === "Strategic Management Fundamentals")
      .levelOrder,
    15,
  );
  assert.ok(p.steps.at(-1).objective.includes("$5 billion"));
  assert.ok(p.steps.every((s) => s.curriculumLesson));
});
test("one lesson grows once, retains lineage and does not replace existing knowledge", () => {
  let d = base();
  d.concepts = [
    {
      id: "old",
      title: "Existing knowledge",
      kind: "tree",
      areaId: "career",
      subAreaId: "energy",
      parent: "",
    },
  ];
  d = acceptPathway(
    d,
    d.goals[0],
    curriculumPathway(d, d.goals[0], "", [], []),
  );
  const lesson = d.learningPlanner[0];
  const result = growLesson(d, lesson, {
    areaId: "career",
    subAreaId: "energy",
    parentId: "old",
  });
  assert.equal(
    result.data.concepts.find((n) => n.id === result.id).parent,
    "old",
  );
  assert.equal(result.data.concepts.length, 2 + lesson.topics.length);
  assert.equal(result.data.learningPlanner[0].conceptId, result.id);
  const again = growLesson(result.data, lesson, {
    areaId: "career",
    subAreaId: "energy",
  });
  assert.equal(again.id, result.id);
  assert.equal(again.data.concepts.length, result.data.concepts.length);
});
test("one focus session records progress without claiming lesson completion", () => {
  let d = base();
  d = acceptPathway(
    d,
    d.goals[0],
    curriculumPathway(d, d.goals[0], "", [], []),
  );
  d.sessions = [
    { id: "s", pathwayStepId: d.learningPlanner[0].id, goalId: "g" },
  ];
  d = integrateLearning(d);
  assert.equal(d.learningPlanner[0].status, "in progress");
  d.learningPlanner[0].lessonCompletedAt = new Date().toISOString();
  assert.equal(integrateLearning(d).learningPlanner[0].status, "completed");
});
test("custom curriculum supports levels and topics for other goals without losing lines", () => {
  const p = outlinePathway(
    "# Foundations\n## Prayer\nContext\nInterpretation\n# Practice\nDaily reflection",
    { title: "Study Scripture" },
  );
  assert.equal(p.steps.length, 3);
  assert.equal(p.steps[1].moduleTitle, "Prayer");
  assert.equal(p.steps[2].levelOrder, 1);
  assert.throws(() => outlinePathway("# Empty", { title: "Goal" }));
});

test("business headings and concept ordering exactly follow the supplied hierarchy", () => {
  const b = energyCurriculum.levels[0];
  assert.equal(b.title, "Introduction to Business");
  assert.equal(b.stageTitle, "Energy business foundations");
  assert.deepEqual(
    b.modules.map((m) => m.title),
    [
      "What is Business?",
      "Why Businesses Exist",
      "Evolution of Business",
      "Characteristics of Businesses",
      "Business Objectives",
      "Business vs Nonprofit Organizations",
      "Business Ecosystems",
      "Business Life Cycle",
    ],
  );
  assert.equal(b.modules.flatMap((m) => m.lessons).length, 29);
  assert.equal(b.modules[0].lessons[0].title, "Definition of Business");
  assert.deepEqual(b.modules[0].lessons[0].topics, [
    "Business",
    "Enterprise",
    "Organization",
    "Commercial Activity",
    "Economic Activity",
    "Exchange",
    "Goods",
    "Services",
    "Customers",
    "Markets",
  ]);
  assert.equal(b.modules[7].lessons[3].title, "Decline & Renewal");
  assert.ok(
    energyCurriculum.levels.slice(1).every((t) => t.title === t.legacyTitle),
  );
});
test("existing pathways update once and preserve identifiers, customized content and evidence", () => {
  const d = base();
  d.learningPlanner = [
    {
      id: "old",
      pathwayId: "p",
      goalId: "g",
      blueprint: "energy-strategy-v1",
      levelOrder: 0,
      moduleOrder: 0,
      lessonOrder: 0,
      title: "Energy, work & power",
      topics: ["Energy"],
      objective: "My saved objective",
      conceptId: "node",
      evidenceIds: ["session"],
      lessonCompletedAt: "2026-09-20",
    },
    {
      id: "custom",
      pathwayId: "p",
      goalId: "g",
      blueprint: "energy-strategy-v1",
      levelOrder: 0,
      moduleOrder: 0,
      lessonOrder: 1,
      title: "My renamed lesson",
      objective: "My notes",
    },
  ];
  const next = upgradeEnergyPathways(d);
  assert.equal(next.learningPlanner.length, 31);
  assert.equal(next.learningPlanner[0].title, "");
  assert.equal(next.learningPlanner[0].conceptId, "node");
  assert.equal(next.learningPlanner[0].objective, "My saved objective");
  assert.deepEqual(next.learningPlanner[0].evidenceIds, ["session"]);
  assert.equal(next.learningPlanner[1].title, "My renamed lesson");
  assert.equal(upgradeEnergyPathways(next), next);
});
test("markdown topic, subtopic, lesson and concept headings stay distinct", () => {
  const p = outlinePathway(
    "Topic 1 — Introduction to Business\n## Subtopic 1 — What is Business?\n### Lesson 1 — Definition of Business\n#### Concepts\n- Business\n- Enterprise\n### Lesson 2 — Components of a Business\n- Inputs",
    { title: "Business" },
  );
  assert.equal(p.steps.length, 2);
  assert.equal(p.steps[0].levelTitle, "Introduction to Business");
  assert.equal(p.steps[0].moduleTitle, "What is Business?");
  assert.equal(p.steps[0].title, "Definition of Business");
  assert.deepEqual(p.steps[0].topics, ["Business", "Enterprise"]);
  assert.equal(p.steps[1].lessonOrder, 1);
});

test("saved unnamed topics recover names without adding lessons or changing user content", () => {
  let d = base();
  const p = curriculumPathway(d, d.goals[0], "", [], []);
  d = acceptPathway(d, d.goals[0], p);
  d.learningPlanner = d.learningPlanner.map((s) =>
    s.levelOrder > 0 ? { ...s, levelTitle: "" } : s,
  );
  const target = d.learningPlanner.find((s) => s.levelOrder === 15);
  d.growthPlannerFocus = {
    g: { lesson: target.id, level: "15:", batch: target.pathwayId },
  };
  const upgraded = upgradeEnergyPathways(d);
  assert.equal(upgraded.learningPlanner.length, d.learningPlanner.length);
  assert.equal(
    upgraded.learningPlanner.find((s) => s.id === target.id).levelTitle,
    "Strategy",
  );
  assert.equal(upgraded.growthPlannerFocus.g.level, "15:Strategy");
  assert.deepEqual(
    upgraded.learningPlanner.map((s) => s.id),
    d.learningPlanner.map((s) => s.id),
  );
  assert.equal(upgradeEnergyPathways(upgraded), upgraded);
});
