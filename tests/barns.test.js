import test from "node:test";
import assert from "node:assert/strict";
import { initialState, validateBackup } from "../src/model.js";
import { CAPACITIES, capacitySummary, capacityProgress } from "../src/barns.js";
test("automatic percentage uses partial study and leaf goal progress without double counting", () => {
  const d = initialState();
  d.goals = [
    {
      id: "parent",
      capacityIds: ["learning"],
      areaId: "knowledge",
      progress: 100,
    },
    { id: "leaf", parent: "parent", areaId: "knowledge", progress: 50 },
  ];
  d.sessions = [
    {
      id: "s",
      capacityIds: ["learning"],
      areaId: "knowledge",
      planned: 60,
      actualMs: 30 * 60000,
    },
  ];
  let s = capacityProgress(d, "learning");
  assert.equal(s.study, 1);
  assert.equal(s.goal, 2);
  assert.equal(s.percent, 3);
  assert.equal(s.goals.length, 1);
  assert.equal(capacityProgress(d, "learning", "faith").percent, 0);
  d.sessions[0].actualMs = 120 * 60000;
  assert.equal(capacityProgress(d, "learning").study, 2);
  d.goals[1].progress = 100;
  assert.equal(capacityProgress(d, "learning").percent, 6);
  d.sessions = Array.from({ length: 15 }, (_, i) => ({
    ...d.sessions[0],
    id: "s" + i,
  }));
  d.goals = Array.from({ length: 8 }, (_, i) => ({
    id: "g" + i,
    capacityIds: ["learning"],
    areaId: "knowledge",
    progress: 100,
  }));
  assert.equal(capacityProgress(d, "learning").percent, 40);
  d.stretches = Array.from({ length: 10 }, (_, i) => ({
    id: "p" + i,
    status: "completed",
    capacityIds: ["learning"],
    areaId: "knowledge",
    completion: 100,
    actualMinutes: 20,
  }));
  assert.equal(capacityProgress(d, "learning").percent, 100);
});
test("practical credit requires recorded completion and persists in backups", () => {
  const d = initialState();
  const s = {
    id: "practice",
    title: "Explain a grid",
    objective: "Communicate clearly",
    success: "Listener explains it back",
    goalId: "g5",
    areaId: "knowledge",
    subAreaId: "",
    capacityIds: ["communication"],
    date: "2026-09-07",
    status: "planned",
    planned: 30,
    actualMinutes: 20,
    completion: 50,
    outcome: "They explained two of four steps",
  };
  d.stretches = [s];
  assert.equal(validateBackup(d), true);
  assert.equal(capacityProgress(d, "communication").practice, 0);
  s.status = "active";
  assert.equal(capacityProgress(d, "communication").practice, 0);
  s.status = "completed";
  assert.equal(capacityProgress(d, "communication").practice, 3);
  assert.equal(capacityProgress(d, "communication", "faith").practice, 0);
  assert.equal(validateBackup(JSON.parse(JSON.stringify(d))), true);
  s.completion = 101;
  assert.equal(validateBackup(d), false);
  s.completion = 50;
  s.outcome = "";
  assert.equal(validateBackup(d), false);
});
test("Barns preserves older workspaces and separates effort from assessed capacity", () => {
  const d = initialState();
  assert.equal(validateBackup(d), true);
  assert.equal(CAPACITIES.length, 16);
  d.sessions = [
    {
      id: "s",
      goalId: "g5",
      actualMs: 600000,
      capacityIds: ["intellectual", "learning"],
      areaId: "knowledge",
      subAreaId: "",
    },
  ];
  assert.equal(capacitySummary(d, "learning").minutes, 10);
  assert.equal(capacitySummary(d, "intellectual").minutes, 10);
  assert.equal(capacitySummary(d, "learning").evidence.length, 0);
  assert.equal(capacitySummary(d, "learning", "faith").minutes, 0);
  d.goals.find((g) => g.id === "g5").areaId = "career";
  assert.equal(capacitySummary(d, "learning", "knowledge").minutes, 10);
});
test("contextual evidence survives backup and rejects invalid dimensions and references", () => {
  const d = initialState();
  d.capacityEvidence = [
    {
      id: "e",
      capacityId: "emotional",
      areaId: "marriage",
      subAreaId: "",
      stage: 2,
      date: "2026-09-06",
      createdAt: "2026-09-06T12:00:00Z",
      evidence: "Listened through a disagreement without interrupting.",
      sessionId: "",
    },
  ];
  assert.equal(validateBackup(JSON.parse(JSON.stringify(d))), true);
  assert.equal(capacitySummary(d, "emotional", "marriage").evidence.length, 1);
  assert.equal(capacitySummary(d, "emotional", "career").evidence.length, 0);
  d.capacityEvidence[0].stage = 8;
  assert.equal(validateBackup(d), false);
  d.capacityEvidence[0].stage = 2;
  d.capacityEvidence[0].subAreaId = "missing";
  assert.equal(validateBackup(d), false);
  d.capacityEvidence[0].subAreaId = "";
  d.goals[0].capacityIds = ["invented"];
  assert.equal(validateBackup(d), false);
});
