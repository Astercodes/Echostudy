import test from "node:test";
import assert from "node:assert/strict";
import { LEARNING_MODES } from "../src/knowledge-learning.js";
import {
  ACTION_COMPONENTS,
  TEST_FORMATS,
  TEST_DIFFICULTIES,
  GRAFT_TYPES,
} from "../src/action-components.js";
import { initialState, validateBackup } from "../src/model.js";
import {
  saveKnowledgeEntry,
  plantSeed,
  pluckNode,
  compostNode,
  restoreNode,
} from "../src/knowledge-tree.js";
test("expanded layers retain legacy field keys and use unique storage keys", () => {
  for (const spec of Object.values(LEARNING_MODES))
    assert.equal(
      new Set(spec.fields.map((f) => f[0])).size,
      spec.fields.length,
    );
  for (const key of [
    "foundations",
    "prerequisites",
    "definitions",
    "mechanisms",
    "components",
    "assumptions",
    "examples",
    "advanced",
  ])
    assert(LEARNING_MODES.peel.fields.some((f) => f[0] === key));
  assert.equal(TEST_FORMATS.length, 11);
  assert.equal(TEST_DIFFICULTIES.length, 5);
  assert(GRAFT_TYPES.includes("Contradicts"));
  assert.equal(ACTION_COMPONENTS.tasteExplore.fields.length, 12);
});
test("comprehensive plans survive seed creation, copies, pruning, restoration and JSON backup", () => {
  let d = initialState();
  const source = d.concepts.find(
    (n) => n.id === "ecosystem-management-v1:fruit-feedback",
  );
  const learning = {
    peel: { foundations: "Original", formal_definition: "Expanded" },
    taste: { attempts: [{ id: "old", response: "Old answer" }] },
    tasteExplore: { quick_meaning: "An introduction" },
    pluck: { components: { reason_for_isolation: "Deep focus" } },
  };
  d = saveKnowledgeEntry(d, { ...source, learning });
  d = pluckNode(d, source.id);
  assert.deepEqual(
    d.concepts.find((n) => n.lineage?.sourceId === source.id).learning,
    learning,
  );
  d = plantSeed(d, source.id, {
    title: "A question",
    components: { desired_outcome: "Understand why" },
  });
  assert.equal(
    d.concepts.at(-1).learning.plant.components.desired_outcome,
    "Understand why",
  );
  d = restoreNode(compostNode(d, source.id), source.id);
  assert.deepEqual(
    d.concepts.find((n) => n.id === source.id).learning,
    learning,
  );
  assert(validateBackup(JSON.parse(JSON.stringify(d))));
});
