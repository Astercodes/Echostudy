import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  validateBackup,
  validateGoal,
  goalProgress,
} from "../src/model.js";
import {
  createDefaultLifeAreas,
  migrateWorkspace,
  LEGACY_GOAL_AREAS,
  validateLifeArea,
} from "../src/life-areas.js";

test("16 areas contain all 291 supplied sub-areas, preserving repeated names across areas", () => {
  const areas = createDefaultLifeAreas();
  assert.equal(areas.length, 16);
  assert.equal(
    areas.reduce((n, a) => n + a.subAreas.length, 0),
    291,
  );
  assert.ok(
    areas.every(
      (a) =>
        a.subAreas.length && a.subAreas.every((s) => s.id.startsWith(a.id)),
    ),
  );
  assert.ok(
    areas.filter((a) => a.subAreas.some((s) => s.name === "Communication"))
      .length > 1,
  );
  assert.ok(
    areas
      .find((a) => a.id === "mind")
      .subAreas.some((s) => s.name === "Learning how to learn"),
  );
  assert.ok(
    areas
      .find((a) => a.id === "purpose")
      .subAreas.some((s) => s.name === "What you want to leave behind"),
  );
});

test("old workspace migration preserves goals, progress, relationships, sessions, and notes", () => {
  const current = initialState();
  const old = { ...current, version: 1 };
  delete old.lifeAreas;
  old.goals = current.goals.map(({ areaId, subAreaId, ...g }) => ({
    ...g,
    domain: LEGACY_GOAL_AREAS.indexOf(areaId),
  }));
  old.goals[0].progress = 35;
  old.notes = [{ id: "n1", text: "Keep this note", concepts: ["c3"] }];
  old.sessions = [{ id: "s1", goalId: "g5", actualMs: 12345 }];
  assert.equal(validateBackup(old), true);
  const next = migrateWorkspace(old);
  assert.equal(validateBackup(next), true);
  assert.equal(next.version, 2);
  assert.equal(next.goals[0].id, "g1");
  assert.equal(next.goals[0].progress, 35);
  assert.equal(next.goals[0].areaId, "knowledge");
  assert.equal(next.goals.find((g) => g.id === "g7").areaId, "faith");
  assert.equal(next.goals.find((g) => g.id === "g5").parent, "g4");
  assert.deepEqual(next.sessions, old.sessions);
  assert.deepEqual(next.notes, old.notes);
  assert.deepEqual(next.concepts, old.concepts);
  assert.deepEqual(next.plans, old.plans);
  assert.equal(old.version, 1);
  assert.equal(old.lifeAreas, undefined);
});

test("custom areas and multiple goals at every horizon survive JSON backup round trips", () => {
  const state = initialState();
  const custom = {
    id: "custom-area",
    name: "Leadership & influence",
    color: "#B00C60",
    subAreas: [{ id: "sub-1", name: "Public service" }],
  };
  state.lifeAreas.push(custom);
  for (let chain = 0; chain < 2; chain++)
    for (const [i, level] of [
      "Year",
      "Quarter",
      "Month",
      "Week",
      "Day",
    ].entries()) {
      const g = {
        id: `goal-${chain}-${i}`,
        title: `Goal ${chain} ${level}`,
        areaId: custom.id,
        subAreaId: "sub-1",
        level,
        parent: i ? `goal-${chain}-${i - 1}` : "",
        progress: chain ? 80 : 20,
      };
      assert.equal(validateGoal(g, state.goals, state.lifeAreas), "");
      state.goals.push(g);
    }
  const restored = migrateWorkspace(JSON.parse(JSON.stringify(state)));
  assert.equal(validateBackup(restored), true);
  assert.equal(restored.lifeAreas.length, 17);
  assert.equal(restored.goals.filter((g) => g.areaId === custom.id).length, 10);
  assert.equal(goalProgress("goal-0-0", restored.goals), 20);
  assert.equal(goalProgress("goal-1-0", restored.goals), 80);
  assert.deepEqual(migrateWorkspace(restored), restored);
});

test("area and sub-area renames preserve goal links and never reseed edited areas", () => {
  const state = initialState(),
    area = state.lifeAreas[0];
  const g = state.goals.find((g) => g.areaId === area.id);
  g.subAreaId = area.subAreas[0].id;
  area.name = "My spiritual life";
  area.subAreas[0].name = "Beliefs & convictions";
  const restored = migrateWorkspace(JSON.parse(JSON.stringify(state)));
  assert.equal(validateBackup(restored), true);
  assert.equal(restored.lifeAreas[0].name, "My spiritual life");
  assert.equal(
    restored.goals.find((x) => x.id === g.id).subAreaId,
    area.subAreas[0].id,
  );
  restored.lifeAreas[0].subAreas = [];
  assert.equal(validateBackup(restored), false);
});

test("invalid parent, sub-area, horizon and duplicate area names are rejected", () => {
  const state = initialState();
  const leaf = { ...state.goals.find((g) => g.id === "g5") };
  assert.match(
    validateGoal({ ...leaf, areaId: "faith" }, state.goals, state.lifeAreas),
    /same life area/,
  );
  assert.match(
    validateGoal(
      { ...leaf, subAreaId: "faith-1" },
      state.goals,
      state.lifeAreas,
    ),
    /sub-area/,
  );
  assert.match(
    validateGoal({ ...leaf, parent: leaf.id }, state.goals, state.lifeAreas),
    /longer-horizon/,
  );
  assert.match(
    validateGoal({ ...leaf, level: "Year" }, state.goals, state.lifeAreas),
    /longer-horizon/,
  );
  assert.match(
    validateLifeArea(
      { ...state.lifeAreas[0], id: "new", name: " FAITH & SPIRITUALITY " },
      state.lifeAreas,
    ),
    /already exists/,
  );
  assert.match(
    validateLifeArea(
      {
        id: "a",
        name: "Area",
        color: "#B00C60",
        subAreas: [
          { id: "s1", name: "focus" },
          { id: "s2", name: "Focus" },
        ],
      },
      [],
    ),
    /different name/,
  );
  assert.match(
    validateGoal({ ...leaf, title: "   " }, state.goals, state.lifeAreas),
    /title/,
  );
});
