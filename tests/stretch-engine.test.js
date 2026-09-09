import test from "node:test";
import assert from "node:assert/strict";
import { initialState, validateBackup } from "../src/model.js";
import { practiceNodes, knowledgeStretch, gapStretches, nextPracticeDate } from "../src/stretch-engine.js";
import { knowledgeIntelligence } from "../src/knowledge-intelligence.js";

test("every ecosystem level supports immediate practice without readiness gates", () => {
  const d = initialState();
  for (const kind of ["life-area", "sub-area", "tree", "foundation", "stem", "branch", "sub-branch", "leaf", "fruit", "seed"]) {
    const node = { id: `new-${kind}`, kind, title: `New ${kind}`, areaId: "knowledge", status: "Growing" };
    for (const environment of ["internal", "simulated", "social", "real"]) {
      const draft = knowledgeStretch(d, node, environment, 3);
      assert.deepEqual(draft.knowledgeIds, [node.id]);
      assert.equal(draft.environment, environment);
      assert.match(draft.objective, /constraint/);
      assert(draft.title.includes(node.title));
    }
  }
  const forest = knowledgeStretch(d, { id: "f", kind: "life-area", title: "Leadership", areaId: "knowledge" });
  const leaf = knowledgeStretch(d, { id: "l", kind: "leaf", title: "SBI", areaId: "knowledge" });
  assert(forest.planned > leaf.planned);
  assert.match(forest.objective, /several groves/);
  assert.match(leaf.title, /micropractice/);
});
test("pruned ancestors exclude suggestions, while unresolved practice gaps return to Study", () => {
  const d = initialState();
  d.concepts.push({ id: "practice-source", kind: "fruit", title: "Feedback", areaId: "knowledge", links: [] });
  d.stretches = [{ id: "attempt", title: "Mock conversation", status: "completed", knowledgeIds: ["practice-source"], studyGap: "I could not separate observation from interpretation" }];
  assert(knowledgeIntelligence(d).suggestions.some(s => s.kind === "practice-gap"));
  assert(gapStretches(d).some(s => s.knowledgeIds.includes("practice-source")));
  d.stretches[0].gapResolved = true;
  assert(!knowledgeIntelligence(d).suggestions.some(s => s.kind === "practice-gap"));
  d.concepts.push({ id: "archived", kind: "branch", areaId: "knowledge", trashedAt: "today" });
  d.concepts.find(n => n.id === "practice-source").parent = "archived";
  assert(!practiceNodes(d).some(n => n.id === "practice-source"));
});
test("new practice metadata survives backup validation and weekly repeats keep the weekday", () => {
  const d = initialState();
  d.stretches = [{ id: "practice", title: "Rehearse", objective: "Explain clearly", success: "A clear explanation", status: "planned", goalId: "", areaId: "", subAreaId: "", capacityIds: [], date: "2026-09-11", planned: 5, actualMinutes: 0, completion: 100, outcome: "", knowledgeIds: [], environment: "internal", challenge: 1, source: "user", repeat: "weekly", studyGap: "", harvest: "", evidence: "" }];
  assert.equal(validateBackup(JSON.parse(JSON.stringify(d))), true);
  assert.equal(nextPracticeDate("2026-09-11", "weekly"), "2026-09-18");
  assert.equal(nextPracticeDate("2026-12-31", "daily"), "2027-01-01");
  d.stretches[0].environment = "invalid";
  assert.equal(validateBackup(d), false);
});
