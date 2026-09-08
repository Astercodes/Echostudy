import test from "node:test";
import assert from "node:assert/strict";
import { initialState, validateBackup } from "../src/model.js";
import {
  treeNodes,
  locationOf,
  saveTreeNode,
  connectNodes,
  connectionsOf,
} from "../src/knowledge-tree.js";
test("each life area owns its own tree while legacy concepts keep their IDs and links", () => {
  const d = initialState();
  assert(treeNodes(d, "knowledge").some((n) => n.id === "c3"));
  assert(!treeNodes(d, "faith").some((n) => n.id === "c3"));
  assert(treeNodes(d, "faith").some((n) => n.id === "c4"));
  assert.deepEqual(d.concepts.find((n) => n.id === "c3").links, ["c6"]);
});
test("moving a concept moves its descendants and fruits; cycles are rejected", () => {
  let d = initialState();
  const sub = d.lifeAreas.find((a) => a.id === "knowledge").subAreas[0].id;
  const c = d.concepts.find((n) => n.id === "c1");
  d = saveTreeNode(d, {
    ...c,
    areaId: "knowledge",
    subAreaId: sub,
    parent: "",
  });
  assert.equal(
    locationOf(
      d.concepts.find((n) => n.id === "c3"),
      d.concepts,
      d.lifeAreas,
    ).subAreaId,
    sub,
  );
  const fruit = {
    id: "fruit-test",
    kind: "fruit",
    title: "A connection",
    description: "Private fruit text",
    parent: "c3",
    areaId: "knowledge",
    subAreaId: sub,
    links: [],
    prerequisites: [],
    status: "Growing",
  };
  d = saveTreeNode(d, fruit);
  assert.throws(() =>
    saveTreeNode(d, { ...c, parent: "c3", areaId: "knowledge" }),
  );
  assert.throws(() => saveTreeNode(d, { ...fruit, parent: "" }));
  const moved = {
    ...d.concepts.find((n) => n.id === "c1"),
    areaId: "faith",
    subAreaId: d.lifeAreas.find((a) => a.id === "faith").subAreas[0].id,
  };
  d = saveTreeNode(d, moved);
  assert(treeNodes(d, "faith").some((n) => n.id === fruit.id));
  assert(validateBackup(JSON.parse(JSON.stringify(d))));
  assert.equal(
    d.concepts.find((n) => n.id === fruit.id).description,
    "Private fruit text",
  );
});
test("cross-tree connections are reciprocal and removable", () => {
  let d = initialState();
  d = connectNodes(d, "c3", ["c4"]);
  assert(
    connectionsOf(
      d.concepts.find((n) => n.id === "c4"),
      d.concepts,
    ).some((n) => n.id === "c3"),
  );
  d = connectNodes(d, "c3", []);
  assert(
    !connectionsOf(
      d.concepts.find((n) => n.id === "c4"),
      d.concepts,
    ).some((n) => n.id === "c3"),
  );
});
import { pluckNode, compostNode, restoreNode } from "../src/knowledge-tree.js";
import {
  knowledgeEntries,
  scopeId,
  saveKnowledgeEntry,
  graftKnowledge,
} from "../src/knowledge-tree.js";
test("root and sub-area workspaces save independently, survive renames, and graft without changing homes", () => {
  let d = initialState();
  const rootId = scopeId("knowledge"),
    subId = d.lifeAreas.find((a) => a.id === "knowledge").subAreas[0].id,
    branchId = scopeId("knowledge", subId);
  d = saveKnowledgeEntry(d, {
    ...knowledgeEntries(d).find((n) => n.id === rootId),
    learning: { peel: { definitions: "Root explanation" } },
  });
  d = saveKnowledgeEntry(d, {
    ...knowledgeEntries(d).find((n) => n.id === branchId),
    learning: { peel: { definitions: "Branch explanation" } },
  });
  d = graftKnowledge(d, rootId, [branchId], {
    [branchId]: {
      relationship: "Shared principle",
      note: "A branch of this area",
    },
  });
  d.lifeAreas = d.lifeAreas.map((a) =>
    a.id === "knowledge" ? { ...a, name: "My education" } : a,
  );
  const entries = knowledgeEntries(d);
  assert.equal(entries.find((n) => n.id === rootId).title, "My education");
  assert.equal(
    entries.find((n) => n.id === branchId).learning.peel.definitions,
    "Branch explanation",
  );
  assert(
    !treeNodes(d, "knowledge").some(
      (n) => n.id === rootId || n.id === branchId,
    ),
  );
  assert(validateBackup(JSON.parse(JSON.stringify(d))));
  const before = d.concepts.length;
  d = pluckNode(d, rootId);
  assert.equal(d.concepts.length, before + 1);
  assert(d.lifeAreas.some((a) => a.id === "knowledge"));
  assert(d.concepts.some((n) => n.sourceScopeId === rootId && n.standalone));
  d = compostNode(d, rootId);
  assert.equal(treeNodes(d, "knowledge").length, 0);
  d = restoreNode(d, rootId);
  assert(treeNodes(d, "knowledge").some((n) => n.id === "c3"));
  assert.equal(
    knowledgeEntries(d).find((n) => n.id === rootId).learning.peel.definitions,
    "Root explanation",
  );
});
test("pluck preserves learning and references while giving a fruit an independent home", () => {
  let d = initialState();
  d = saveTreeNode(d, {
    id: "fruit",
    kind: "fruit",
    title: "An idea",
    description: "Keep this",
    areaId: "knowledge",
    subAreaId: "",
    parent: "c3",
    status: "Growing",
    links: ["c4"],
    prerequisites: [],
    learning: { peel: { definitions: "A definition" } },
  });
  d = pluckNode(d, "fruit");
  const n = d.concepts.find((n) => n.lineage?.sourceId === "fruit");
  assert.equal(d.concepts.find((n) => n.id === "fruit").parent, "c3");
  assert.equal(n.parent, "");
  assert.equal(n.kind, "concept");
  assert.equal(n.standalone, true);
  assert.equal(n.description, "Keep this");
  assert.equal(n.learning.peel.definitions, "A definition");
  assert.deepEqual(n.links, ["c4"]);
  assert(validateBackup(d));
});
import { plantSeed, growSeed, knowledgeLabel } from "../src/knowledge-tree.js";
test("seeds preserve the source and grow into existing or new trees without losing lineage", () => {
  const original = initialState();
  let d = plantSeed(original, "c3", {
    title: "What is Bayes' theorem?",
    excerpt: "Bayes",
    description: "A question to explore",
  });
  assert.deepEqual(
    d.concepts.slice(0, original.concepts.length),
    original.concepts,
  );
  const seed = d.concepts.at(-1);
  assert.equal(seed.kind, "seed");
  assert.equal(seed.lineage.sourceId, "c3");
  assert(seed.lineage.path.includes("Transformers"));
  const stem = d.lifeAreas
    .find((a) => a.id === "leadership")
    .subAreas.find((s) => s.name === "Management");
  d = growSeed(d, seed.id, { areaId: "leadership", subAreaId: stem.id });
  assert(treeNodes(d, "leadership").some((n) => n.id === seed.id));
  assert.equal(
    d.concepts.find((n) => n.id === seed.id).lineage.excerpt,
    "Bayes",
  );
  d = plantSeed(d, seed.id, { title: "A new field" });
  const second = d.concepts.at(-1).id;
  d = growSeed(d, second, { newTreeName: "My new field" });
  const tree = d.lifeAreas.find((a) => a.name === "My new field");
  assert(treeNodes(d, tree.id).some((n) => n.id === second));
  assert(validateBackup(JSON.parse(JSON.stringify(d))));
  assert.equal(knowledgeLabel({ kind: "leaf" }, []), "Leaf");
});
test("explicit pluck move preserves the ID and records its original path", () => {
  const d = pluckNode(initialState(), "c3", { move: true });
  const n = d.concepts.find((n) => n.id === "c3");
  assert.equal(n.parent, "");
  assert(n.lineage.path.includes("Transformers"));
  assert(validateBackup(d));
});
test("compost and restore preserve a full branch and its histories", () => {
  let d = initialState();
  d = compostNode(d, "c1");
  assert(
    !treeNodes(d, "knowledge").some((n) => ["c1", "c2", "c3"].includes(n.id)),
  );
  assert.equal(
    d.concepts.find((n) => n.id === "c3").history.at(-1).action,
    "compost",
  );
  d = restoreNode(d, "c1");
  assert(treeNodes(d, "knowledge").some((n) => n.id === "c3"));
  assert.deepEqual(d.concepts.find((n) => n.id === "c3").links, ["c6"]);
  assert(validateBackup(JSON.parse(JSON.stringify(d))));
});
test("grafts record meaning in both directions without moving either home", () => {
  let d = initialState();
  d = connectNodes(d, "c3", ["c4"], {
    c4: {
      relationship: "Shared principle",
      note: "Both require discernment",
      sourceId: "c3",
    },
  });
  assert.equal(d.concepts.find((n) => n.id === "c3").parent, "c2");
  assert.equal(d.concepts.find((n) => n.id === "c4").parent, "d1");
  assert.equal(
    d.concepts.find((n) => n.id === "c4").grafts.c3.note,
    "Both require discernment",
  );
});
