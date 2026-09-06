import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  validateBlock,
  fillStudyWindows,
  ancestors,
  goalProgress,
  focusedMs,
  insights,
  validateBackup,
} from "../src/model.js";
test("initial plan covers exactly 24 hours without overlap", () => {
  const s = initialState(),
    b = Object.values(s.plans)[0];
  assert.equal(
    b.reduce((n, x) => n + x.end - x.start, 0),
    1440,
  );
  assert.ok(b.every((x) => !validateBlock(x, b)));
  assert.ok(validateBackup(s));
});
test("overlaps rejected, adjacent blocks accepted", () => {
  const b = [{ id: "a", title: "Work", start: 540, end: 1020 }];
  assert.match(
    validateBlock({ id: "b", title: "Study", start: 1000, end: 1080 }, b),
    /overlaps/,
  );
  assert.equal(
    validateBlock({ id: "b", title: "Study", start: 1020, end: 1080 }, b),
    "",
  );
  assert.match(
    validateBlock({ id: "c", title: "Night", start: 1380, end: 420 }, []),
    /after/,
  );
});
test("planner preserves commitments, prevents overlap, and reports impossible requests", () => {
  const fixed = [
    { id: "a", title: "Sleep", start: 0, end: 420, kind: "recovery" },
    { id: "b", title: "Work", start: 540, end: 1020, kind: "fixed" },
  ];
  const r = fillStudyWindows(fixed, 900, "g");
  assert.ok(r.unplaced > 0);
  assert.ok(r.blocks.every((b) => !validateBlock(b, r.blocks)));
  assert.ok(
    r.blocks
      .filter((b) => b.kind === "deep")
      .every((b) => b.end - b.start <= 90),
  );
  assert.deepEqual(
    r.blocks.find((b) => b.id === "b"),
    fixed[1],
  );
  assert.equal(
    r.blocks
      .filter((b) => ["deep", "light"].includes(b.kind))
      .reduce((n, b) => n + b.end - b.start, 0) + r.unplaced,
    900,
  );
});
test("goal ancestry and progress aggregate through the hierarchy", () => {
  const s = initialState();
  s.goals.find((g) => g.id === "g5").progress = 60;
  assert.equal(ancestors("g5", s.goals).length, 5);
  assert.equal(goalProgress("g1", s.goals), 60);
});
test("focused time counts only active time and survives timestamp recovery", () => {
  assert.equal(focusedMs({ elapsed: 1000, started: 5000 }, 8000), 4000);
  assert.equal(focusedMs({ elapsed: 4000, started: null }, 9000), 4000);
  assert.equal(focusedMs({ elapsed: 4000, started: 10000 }, 9000), 4000);
});
test("intelligence identifies missing prerequisites from actual graph state", () => {
  const s = initialState();
  assert.ok(
    insights(s.concepts).some((i) =>
      i.body.includes("Electromagnetic induction"),
    ),
  );
  s.concepts.push({
    id: "ind",
    title: "Electromagnetic induction",
    status: "Confident",
    links: [],
    prerequisites: [],
  });
  assert.ok(!insights(s.concepts).some((i) => i.id === "c3-pre"));
});
test("restore validation rejects cycles, duplicate ids and invalid blocks", () => {
  const a = initialState();
  a.goals[0].parent = "g5";
  assert.equal(validateBackup(a), false);
  const b = initialState();
  b.concepts.push(b.concepts[0]);
  assert.equal(validateBackup(b), false);
  const c = initialState();
  Object.values(c.plans)[0][0].end = 1500;
  assert.equal(validateBackup(c), false);
});
