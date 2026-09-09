import { knowledgeEntries } from "./knowledge-tree.js";

// Browse existing records by lineage; never merge, copy or delete their contents.
export function sourceDocuments(data, source) {
  const entries = knowledgeEntries(data), ids = new Set([source.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of entries) {
      if (!entry.trashedAt && !ids.has(entry.id) && ids.has(entry.lineage?.sourceId || entry.sourceScopeId)) {
        ids.add(entry.id); changed = true;
      }
    }
  }
  return [source, ...entries.filter(entry => entry.id !== source.id && ids.has(entry.id))];
}
