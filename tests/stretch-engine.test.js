import test from "node:test";
import assert from "node:assert/strict";
import { initialState, validateBackup } from "../src/model.js";
import {
  practiceNodes,
  knowledgeStretch,
  gapStretches,
  nextPracticeDate,
} from "../src/stretch-engine.js";
import { knowledgeIntelligence } from "../src/knowledge-intelligence.js";
import {
  finishPracticeRecord,
  practiceElapsed,
  relatedPracticeKnowledge,
} from "../src/stretch-practice.js";

test("every ecosystem level supports immediate practice without readiness gates", () => {
  const d = initialState();
  for (const kind of [
    "life-area",
    "sub-area",
    "tree",
    "foundation",
    "stem",
    "branch",
    "sub-branch",
    "leaf",
    "fruit",
    "seed",
  ]) {
    const node = {
      id: `new-${kind}`,
      kind,
      title: `New ${kind}`,
      areaId: "knowledge",
      status: "Growing",
    };
    for (const environment of ["internal", "simulated", "social", "real"]) {
      const draft = knowledgeStretch(d, node, environment, 3);
      assert.deepEqual(draft.knowledgeIds, [node.id]);
      assert.equal(draft.environment, environment);
      assert.match(draft.objective, /constraint/);
      assert(draft.title.includes(node.title));
    }
  }
  const forest = knowledgeStretch(d, {
    id: "f",
    kind: "life-area",
    title: "Leadership",
    areaId: "knowledge",
  });
  const leaf = knowledgeStretch(d, {
    id: "l",
    kind: "leaf",
    title: "SBI",
    areaId: "knowledge",
  });
  assert(forest.planned > leaf.planned);
  assert.match(forest.objective, /three people/);
  assert.match(leaf.title, /three vague feedback/);
});
test("pruned ancestors exclude suggestions, while unresolved practice gaps return to Study", () => {
  const d = initialState();
  d.concepts.push({
    id: "practice-source",
    kind: "fruit",
    title: "Feedback",
    areaId: "knowledge",
    links: [],
  });
  d.stretches = [
    {
      id: "attempt",
      title: "Mock conversation",
      status: "completed",
      knowledgeIds: ["practice-source"],
      studyGap: "I could not separate observation from interpretation",
    },
  ];
  assert(
    knowledgeIntelligence(d).suggestions.some((s) => s.kind === "practice-gap"),
  );
  assert(
    gapStretches(d).some((s) => s.knowledgeIds.includes("practice-source")),
  );
  d.stretches[0].gapResolved = true;
  assert(
    !knowledgeIntelligence(d).suggestions.some(
      (s) => s.kind === "practice-gap",
    ),
  );
  d.concepts.push({
    id: "archived",
    kind: "branch",
    areaId: "knowledge",
    trashedAt: "today",
  });
  d.concepts.find((n) => n.id === "practice-source").parent = "archived";
  assert(!practiceNodes(d).some((n) => n.id === "practice-source"));
});
test("new practice metadata survives backup validation and weekly repeats keep the weekday", () => {
  const d = initialState();
  d.stretches = [
    {
      id: "practice",
      title: "Rehearse",
      objective: "Explain clearly",
      success: "A clear explanation",
      status: "planned",
      goalId: "",
      areaId: "",
      subAreaId: "",
      capacityIds: [],
      date: "2026-09-11",
      planned: 5,
      actualMinutes: 0,
      completion: 100,
      outcome: "",
      knowledgeIds: [],
      environment: "internal",
      challenge: 1,
      source: "user",
      repeat: "weekly",
      studyGap: "",
      harvest: "",
      evidence: "",
    },
  ];
  assert.equal(validateBackup(JSON.parse(JSON.stringify(d))), true);
  assert.equal(nextPracticeDate("2026-09-11", "weekly"), "2026-09-18");
  assert.equal(nextPracticeDate("2026-12-31", "daily"), "2027-01-01");
  d.stretches[0].environment = "invalid";
  assert.equal(validateBackup(d), false);
});
test("a repeated practice creates exactly one next attempt and preserves the original evidence", () => {
  const record = {
    id: "one",
    title: "Feedback practice",
    date: "2026-09-11",
    repeat: "weekly",
    status: "active",
    practiceMs: 60000,
    practiceStartedAt: "2026-09-11T12:00:00Z",
    practiceResponses: { "social:0": "Partner agreed roles" },
    rubric: { Accuracy: "Developing" },
    harvest: "A better conversation",
    studyGap: "How to respond calmly",
    outcome: "Practised",
    knowledgeIds: ["source"],
    capacityIds: ["communication"],
  };
  const d = { stretches: [] };
  const next = finishPracticeRecord(d, record, "2026-09-11T12:04:00Z");
  assert.equal(practiceElapsed(next.stretches[0]), 300000);
  assert.equal(next.stretches[0].harvest, "A better conversation");
  assert.equal(next.stretches[1].date, "2026-09-18");
  assert.deepEqual(next.stretches[1].practiceResponses, {});
  assert.deepEqual(next.stretches[1].knowledgeIds, ["source"]);
  assert.equal(next.stretches[1].studyGap, "");
  assert.equal(
    finishPracticeRecord(next, next.stretches[0]).stretches.length,
    2,
  );
  assert.equal(record.status, "active");
});
test("Leadership examples yield concrete tasks and life suggestions explain title matches", () => {
  const d = initialState();
  const node = {
    id: "sbi",
    kind: "leaf",
    title: "SBI framework",
    areaId: "knowledge",
  };
  const draft = knowledgeStretch(d, node, "simulated");
  assert.equal(draft.title, "Rewrite three vague feedback statements");
  assert.match(draft.objective, /communicate better/);
  const matches = relatedPracticeKnowledge(
    d,
    [node, { ...node, id: "f", title: "Feedback conversation" }],
    "I have a feedback conversation Friday",
  );
  assert.equal(matches[0].node.id, "f");
  assert.deepEqual(matches[0].shared, ["feedback", "conversation"]);
});
