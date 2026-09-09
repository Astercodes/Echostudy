import test from "node:test";
import assert from "node:assert/strict";
import { knowledgeIntelligence } from "../src/knowledge-intelligence.js";
const now = Date.parse("2026-09-09T12:00:00Z");
const node = (id, title, extra = {}) => ({
  id,
  title,
  areaId: "a",
  subAreaId: "",
  parent: "",
  kind: "concept",
  status: "Growing",
  links: [],
  prerequisites: [],
  ...extra,
});
const data = (concepts) => ({
  lifeAreas: [
    { id: "a", name: "First forest", subAreas: [] },
    { id: "b", name: "Second forest", subAreas: [] },
  ],
  concepts,
  notes: [],
  resources: [],
  goals: [],
  sessions: [],
});
const findings = (d, opts = {}) =>
  knowledgeIntelligence(d, { now, ...opts }).suggestions;
test("global prerequisite resolution respects aliases and focus; archived matches do not satisfy gaps", () => {
  const d = data([
    node("n", "Bayesian inference", {
      prerequisites: ["Conditional probability"],
    }),
    node("p", "Probability given evidence", {
      areaId: "b",
      aliases: ["conditional probability"],
      status: "Confident",
    }),
  ]);
  assert(
    !findings(d, { focusIds: ["n"] }).some((s) => s.kind === "prerequisite"),
  );
  d.concepts[1].trashedAt = "2026-09-01";
  assert(
    findings(d, { focusIds: ["n"] }).some(
      (s) => s.topic === "Conditional probability" && s.action === "plant",
    ),
  );
});
test("latest result per question clears old failures while unresolved questions still prescribe the right action", () => {
  const d = data([
    node("n", "Reasoning", {
      learning: {
        test: {
          attempts: [
            {
              questionId: "q",
              at: "2026-09-01",
              accuracy: 20,
              result: "Misconception",
              gap: "Reasoning gaps",
            },
            {
              questionId: "q",
              at: "2026-09-08",
              accuracy: 95,
              result: "Correct",
              gap: "Reasoning gaps",
            },
            {
              questionId: "r",
              at: "2026-09-08",
              accuracy: 30,
              result: "Knowledge gap",
              gap: "Recall gaps",
              confidence: 95,
            },
          ],
        },
      },
    }),
  ]);
  const out = findings(d);
  assert(!out.some((s) => s.topic === "Reasoning gaps"));
  assert(
    out.some((s) => s.topic === "Recall gaps" && s.action === "regurgitate"),
  );
  assert(out.some((s) => s.kind === "calibration"));
});
test("explicit content mentions identify cross-forest graft candidates; existing links suppress duplicates", () => {
  const d = data([
    node("n", "Inflation", {
      description: "Monetary policy affects inflation.",
    }),
    node("m", "Monetary policy", { areaId: "b" }),
  ]);
  assert(
    findings(d, { focusIds: ["n"] }).some(
      (s) => s.kind === "connection" && s.targetId === "m" && s.candidate,
    ),
  );
  d.concepts[1].links = ["n"];
  assert(
    !findings(d, { focusIds: ["n"] }).some(
      (s) => s.kind === "connection" && s.targetId === "m",
    ),
  );
});
test("never-reviewed study, documentation gaps and missing sources are evidence gaps, not asserted ignorance", () => {
  const d = data([
    node("n", "A concept", { description: "My learning notes" }),
  ]);
  d.sessions = [{ conceptId: "n", completedAt: "2026-08-01", actualMs: 10000 }];
  const out = findings(d);
  assert(out.some((s) => s.kind === "review"));
  assert(out.some((s) => s.basis === "Documentation gap"));
  assert(out.some((s) => s.kind === "evidence"));
  assert(!out.some((s) => s.kind === "understanding"));
});
test("prerequisite cycles are reported without recursion loops; fresh correct evidence avoids overdue review", () => {
  const d = data([
    node("a1", "First", { prerequisites: ["Second"], reviewed: "2026-09-08" }),
    node("b1", "Second", { prerequisites: ["First"] }),
  ]);
  assert(findings(d).some((s) => s.kind === "structure"));
  assert(!findings(d).some((s) => s.kind === "review"));
});
test("findings do not mutate notes, graph, or test history", () => {
  const d = data([
    node("n", "Topic", {
      description: "Unanswered question",
      learning: { squeeze: { questions: "How does this work?" } },
    }),
  ]);
  const before = JSON.stringify(d);
  findings(d);
  assert.equal(JSON.stringify(d), before);
});
test("named topics in a source outline become missing-coverage candidates without inventing topics",()=>{
  const d=data([node("n","Economics",{description:"## Purchasing power\nMy notes",learning:{peel:{components:"- Monetary policy\n- This is a long explanation that should not be treated as a named topic in the outline"}}})]);
  const out=findings(d);
  assert(out.some(s=>s.topic==="Purchasing power"&&s.action==="plant"));
  assert(out.some(s=>s.topic==="Monetary policy"&&s.basis==="Topic named in your study outline"));
  assert(!out.some(s=>s.topic?.startsWith("This is")));
});
