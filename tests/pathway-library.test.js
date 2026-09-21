import test from "node:test";
import assert from "node:assert/strict";
import { pathwayCards, changePathway } from "../src/pathway-library.js";
const data = () => ({
  goals: [
    { id: "g", title: "Goal" },
    { id: "other", title: "Other" },
  ],
  learningPlanner: [
    { id: "a", pathwayId: "p", goalId: "g", goalIds: ["g"], title: "A" },
    { id: "b", pathwayId: "q", goalId: "g", goalIds: ["g"], title: "B" },
  ],
  sessions: [{ id: "s", pathwayStepId: "a" }],
  concepts: [{ id: "n", sourceLessonId: "a" }],
  plans: { today: [{ id: "block", pathwayStepId: "a" }] },
});
test("actions target one pathway, preserve evidence and keep reordering persistent", () => {
  let d = data();
  assert.equal(pathwayCards(d).length, 2);
  d = changePathway(d, "p", "edit", "A compact route");
  assert.equal(pathwayCards(d)[0].title, "A compact route");
  assert.equal(d.goals[0].title, "Goal");
  d = changePathway(d, "p", "down");
  assert.deepEqual(
    pathwayCards(d).map((x) => x.id),
    ["q", "p"],
  );
  d = changePathway(d, "p", "move", "other");
  assert.equal(d.learningPlanner[0].goalId, "other");
  assert.equal(d.learningPlanner[1].goalId, "g");
  d = changePathway(d, "p", "delete");
  assert.deepEqual(
    d.learningPlanner.map((x) => x.id),
    ["b"],
  );
  assert.equal(d.sessions.length, 1);
  assert.equal(d.concepts.length, 1);
  assert.equal(d.plans.today.length, 1);
  assert.throws(() => changePathway(d, "q", "move", "missing"));
});
test("legacy pathway retains its identity when moved", () => {
  const d = data();
  delete d.learningPlanner[0].pathwayId;
  const moved = changePathway(d, "legacy:g", "move", "other");
  assert.ok(
    pathwayCards(moved).some(
      (p) => p.id === "legacy:g" && p.goalId === "other",
    ),
  );
});
