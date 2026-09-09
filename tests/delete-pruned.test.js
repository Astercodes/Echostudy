import test from "node:test";
import assert from "node:assert/strict";
import { deletePrunedNode } from "../src/knowledge-tree.js";

test("permanent deletion removes archived descendants and references while preserving resources and active knowledge", () => {
  const data = {
    concepts: [
      { id: "a", trashedAt: "today", parent: "" },
      { id: "b", trashedAt: "today", parent: "a" },
      { id: "c", parent: "a", links: ["a", "b"], grafts: { a: {}, b: {} } },
      { id: "unrelated", trashedAt: "today" },
    ],
    resources: [
      {
        id: "book",
        concepts: ["a", "c"],
        knowledgeRefs: [{ nodeId: "b" }, { nodeId: "c" }],
      },
    ],
    notes: [{ text: "Keep this note", concepts: ["b", "c"] }],
  };
  const before = JSON.stringify(data);
  const result = deletePrunedNode(data, "a");
  assert.deepEqual(
    result.concepts.map((n) => n.id),
    ["c", "unrelated"],
  );
  assert.equal(result.concepts[0].parent, "");
  assert.deepEqual(result.concepts[0].links, []);
  assert.deepEqual(result.concepts[0].grafts, {});
  assert.deepEqual(result.resources[0].concepts, ["c"]);
  assert.deepEqual(result.resources[0].knowledgeRefs, [{ nodeId: "c" }]);
  assert.equal(result.notes[0].text, "Keep this note");
  assert.equal(JSON.stringify(data), before);
  assert.equal(deletePrunedNode(data, "c"), data);
});
