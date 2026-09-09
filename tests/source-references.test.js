import test from "node:test";
import assert from "node:assert/strict";
import {
  attachReference,
  updateReference,
  matchesReference,
} from "../src/source-references.js";
test("library attachment persists across content saves and duplicate selection keeps page references", () => {
  const resource = { id: "book", title: "My book", kind: "pdf", concepts: [] };
  const base = {
    resources: [resource],
    concepts: [{ id: "forest", description: "Old notes" }],
  };
  const ref = {
    id: "ref1",
    nodeId: "forest",
    scope: "forest:content",
    key: "forest|forest:content",
  };
  let state = attachReference(base, resource, ref);
  state = updateReference(state, "book", "ref1", {
    locator: "pp. 12–17",
    citation: "Author, 2025",
  });
  state = { ...state, concepts: [{ id: "forest", description: "New notes" }] };
  state = attachReference(state, resource, { ...ref, id: "duplicate" });
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(restored.resources[0].knowledgeRefs.length, 1);
  assert.equal(restored.resources[0].knowledgeRefs[0].locator, "pp. 12–17");
  assert.equal(restored.resources[0].knowledgeRefs[0].citation, "Author, 2025");
  assert.equal(base.resources[0].knowledgeRefs, undefined);
});
test("forest, grove and action components keep separate references while old content keys remain readable", () => {
  const ref = { nodeId: "forest", scope: "forest:content:Workspace content" };
  assert.equal(matchesReference(ref, "forest", "forest:content"), true);
  assert.equal(matchesReference(ref, "grove", "grove:content"), false);
  assert.equal(
    matchesReference(ref, "forest", "forest:peel:Foundations"),
    false,
  );
  assert.equal(
    matchesReference(
      { nodeId: "fruit", scope: "fruit:isolate:Fruit content" },
      "fruit",
      "fruit:content",
    ),
    true,
  );
});
