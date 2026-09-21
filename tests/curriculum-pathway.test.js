import test from "node:test";
import assert from "node:assert/strict";
import {
  curriculumPathway,
  energyCurriculum,
  growLesson,
  outlinePathway,
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
test("supplied curriculum preserves 20 levels, all 80 foundation concept groups and 15-question applied lesson", () => {
  const d = base(),
    p = curriculumPathway(d, d.goals[0], "", [], []);
  assert.equal(energyCurriculum.levels.length, 20);
  assert.equal(
    p.steps.filter((s) => s.levelOrder === 0 && s.type === "study").length,
    80,
  );
  const applied = p.steps.find((s) => s.title === "Map an Energy Company");
  assert.equal(applied.topics.length, 15);
  assert.equal(applied.type, "stretch");
  assert.equal(
    p.steps.find((s) => s.title === "Strategic Management Fundamentals")
      .levelOrder,
    14,
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
