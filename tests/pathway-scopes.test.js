import test from "node:test";
import assert from "node:assert/strict";
import { scopeFor, saveScope, growScope } from "../src/pathway-scopes.js";
import { integrateLearning } from "../src/learning-integration.js";
import { saveStudySchedule } from "../src/study-scheduling.js";
const data = () => ({
  goals: [{ id: "g" }],
  lifeAreas: [{ id: "a", name: "Area", subAreas: [] }],
  concepts: [],
  resources: [],
  sessions: [],
  stretches: [],
  plans: {},
  learningPlanner: ["one", "two", "three"].map((title, i) => ({
    id: title,
    title,
    pathwayId: "p",
    goalId: "g",
    levelOrder: 0,
    moduleOrder: i === 2 ? 1 : 0,
    moduleTitle: i === 2 ? "Second" : "First",
    lessonOrder: i,
    topics: ["Concept " + i],
    curriculumLesson: true,
    resourceIds: [],
  })),
});
test("selection scopes have stable identities but distinguish Study actions and Stretch", () => {
  let d = data();
  const scope = scopeFor(d, d.learningPlanner.slice(0, 2), "First");
  d = saveScope(d, scope);
  assert.equal(
    scopeFor(d, d.learningPlanner.slice(0, 2), "First").id,
    scope.id,
  );
  assert.notEqual(
    scopeFor(d, d.learningPlanner.slice(0, 2), "First", { type: "stretch" }).id,
    scope.id,
  );
  assert.notEqual(
    scopeFor(d, d.learningPlanner.slice(0, 2), "First", { action: "Chew" }).id,
    scope.id,
  );
  assert.deepEqual(scope.pathwayStepIds, ["one", "two"]);
});
test("grouped study is linked only to selected lessons without marking them complete", () => {
  let d = data();
  const s = scopeFor(d, d.learningPlanner.slice(0, 2), "First");
  d = saveStudySchedule(
    d,
    {
      blockId: "b",
      pathwayStepId: s.id,
      pathwayStepIds: s.pathwayStepIds,
      planned: 25,
      goalId: "g",
      topic: "First",
      objective: "Understand",
    },
    { date: "2026-09-21", start: 480 },
    false,
  );
  assert.deepEqual(d.plans["2026-09-21"][0].pathwayStepIds, ["one", "two"]);
  d.sessions = [
    {
      id: "session",
      pathwayStepId: s.id,
      pathwayStepIds: s.pathwayStepIds,
      goalId: "g",
    },
  ];
  d = integrateLearning(d);
  assert.equal(d.learningPlanner[0].status, "in progress");
  assert.equal(d.learningPlanner[1].status, "in progress");
  assert.equal(d.learningPlanner[2].status, "planned");
});
test("growing a selection preserves hierarchy and reuses existing lesson knowledge", () => {
  let d = data(),
    scope = scopeFor(d, d.learningPlanner.slice(0, 2), "First");
  let result = growScope(d, scope, { areaId: "a" });
  const count = result.data.concepts.length;
  assert.equal(
    result.data.concepts.filter((n) => n.sourceLessonId === "one").length,
    1,
  );
  assert.equal(result.data.concepts.filter((n) => n.kind === "leaf").length, 2);
  result = growScope(result.data, scope, { areaId: "a" });
  assert.equal(result.data.concepts.length, count);
  assert.equal(result.data.pathwayScopes[0].conceptId, result.id);
  assert.equal(result.data.learningPlanner[2].conceptId, undefined);
});

test("different study actions on the same selection reuse its ecosystem source", () => {
  const d = data(),
    steps = d.learningPlanner.slice(0, 2),
    peel = scopeFor(d, steps, "First");
  const first = growScope(d, peel, { areaId: "a" });
  const chew = scopeFor(first.data, steps, "First", { action: "Chew" });
  const second = growScope(first.data, chew, { areaId: "a" });
  assert.equal(first.id, second.id);
  assert.equal(first.data.concepts.length, second.data.concepts.length);
});
