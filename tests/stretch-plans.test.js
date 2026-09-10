import test from "node:test";
import assert from "node:assert/strict";
import { HORIZONS, HARVEST_TYPES, saveHarvest, validatePlanHierarchy } from "../src/stretch-plans.js";

test("practice horizons form a broad-to-specific hierarchy", () => {
  const plans = [{ id: "year", horizon: "yearly" }, { id: "month", horizon: "monthly", parentStretchId: "year" }, { id: "day", horizon: "daily", parentStretchId: "month" }];
  assert.equal(validatePlanHierarchy(plans, plans[1]), "");
  assert.equal(validatePlanHierarchy(plans, plans[2]), "");
  assert.match(validatePlanHierarchy(plans, { id: "bad", horizon: "yearly", parentStretchId: "month" }), /broader/);
  assert.match(validatePlanHierarchy(plans, { id: "bad", horizon: "daily", targetDate: "2026-01-01", date: "2026-02-01" }), /on or after/);
  assert.deepEqual(Object.keys(HORIZONS), ["daily", "weekly", "monthly", "quarterly", "yearly"]);
});

test("Harvest is explicit, typed, evidenced, and does not infer production from completion", () => {
  const data = { stretches: [{ id: "plan", title: "Apply feedback", status: "completed" }], resources: [] };
  assert.equal(data.stretches[0].harvests, undefined);
  assert.throws(() => saveHarvest(data, "plan", { id: "h", type: "capability", title: "Can do it", description: "Now I can" }), /observation|reference/);
  assert.throws(() => saveHarvest(data, "plan", { id: "h", type: "knowledge", title: "New insight", description: "SBI changed under pressure", evidence: "Reflection", knowledgeIds: [] , capacityIds: [], resourceIds: [] }), /Study source/);
  const next = saveHarvest(data, "plan", { id: "h", type: "knowledge", title: "New insight", description: "SBI changed under pressure", evidence: "Reflection", knowledgeIds: ["source"], capacityIds: [], resourceIds: [] , date: "2026-09-12" });
  assert.equal(next.stretches[0].harvests[0].type, "knowledge");
  assert.equal(data.stretches[0].harvests, undefined);
  assert.equal(Object.keys(HARVEST_TYPES).length, 8);
});
