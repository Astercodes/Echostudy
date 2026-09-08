import test from "node:test";
import assert from "node:assert/strict";
import { initialState, validateBackup } from "../src/model.js";
import { addManagementExample } from "../src/knowledge-example.js";
test("Management example is additive, correctly placed, and never reseeded", () => {
  const d = initialState();
  const examples = d.concepts.filter((n) => n.example === "management-v1");
  assert.equal(examples.filter((n) => n.kind === "tree").length, 7);
  const management = d.lifeAreas
    .find((a) => a.id === "leadership")
    .subAreas.find((s) => s.name === "Management");
  assert(
    examples.every(
      (n) => n.areaId === "leadership" && n.subAreaId === management.id,
    ),
  );
  assert.equal(examples.filter((n) => n.kind === "foundation").length, 5);
  const old = {
    ...d,
    knowledgeExampleRevision: undefined,
    concepts: [{ ...d.concepts[0], description: "My original content" }],
  };
  const migrated = addManagementExample(old);
  assert.deepEqual(migrated.concepts[0], old.concepts[0]);
  assert.deepEqual(addManagementExample(migrated), migrated);
  const pruned = {
    ...migrated,
    concepts: migrated.concepts.filter((n) => n.kind !== "fruit"),
  };
  assert.deepEqual(addManagementExample(pruned), pruned);
  assert(validateBackup(JSON.parse(JSON.stringify(d))));
});
