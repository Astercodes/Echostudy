import { LEGACY_GOAL_AREAS } from "./life-areas.js";
export const isScaffold = (n) => n.id === "root" || /^d[0-5]$/.test(n.id);
export function locationOf(node, nodes, areas) {
  let current = node;
  const seen = new Set();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.areaId && areas.some((a) => a.id === current.areaId))
      return { areaId: current.areaId, subAreaId: current.subAreaId || "" };
    current = nodes.find((n) => n.id === current.parent);
  }
  return {
    areaId:
      areas.find((a) => a.id === LEGACY_GOAL_AREAS[node.domain])?.id ||
      areas[0]?.id,
    subAreaId: "",
  };
}
export function treeNodes(data, areaId) {
  return data.concepts.filter(
    (n) =>
      !isScaffold(n) &&
      !n.trashedAt &&
      locationOf(n, data.concepts, data.lifeAreas).areaId === areaId,
  );
}
export function descendants(id, nodes) {
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of nodes)
      if (ids.has(n.parent) && !ids.has(n.id)) {
        ids.add(n.id);
        changed = true;
      }
  }
  return ids;
}
export function saveTreeNode(data, node) {
  const area = data.lifeAreas.find((a) => a.id === node.areaId);
  if (!node.title.trim() || !area)
    throw new Error("Give this idea a title and life area.");
  if (node.subAreaId && !area.subAreas.some((s) => s.id === node.subAreaId))
    throw new Error("Choose a sub-area in this life area.");
  const parent = data.concepts.find((n) => n.id === node.parent);
  if (
    node.parent &&
    (!parent ||
      parent.kind === "fruit" ||
      parent.trashedAt ||
      descendants(node.id, data.concepts).has(parent.id))
  )
    throw new Error("Choose a concept outside this idea’s descendants.");
  if (node.kind === "fruit" && !parent)
    throw new Error("A fruit must grow on a concept.");
  const loc = parent
    ? locationOf(parent, data.concepts, data.lifeAreas)
    : { areaId: node.areaId, subAreaId: node.subAreaId };
  const next = {
    ...node,
    ...loc,
    standalone: Boolean(node.standalone && !node.parent && !loc.subAreaId),
    title: node.title.trim(),
  };
  const children = descendants(node.id, data.concepts);
  return {
    ...data,
    concepts: [
      ...data.concepts
        .filter((n) => n.id !== node.id)
        .map((n) => (children.has(n.id) ? { ...n, ...loc } : n)),
      next,
    ],
  };
}
export function connectionsOf(node, nodes) {
  return nodes.filter(
    (n) =>
      !n.trashedAt &&
      n.id !== node.id &&
      ((node.links || []).includes(n.id) || (n.links || []).includes(node.id)),
  );
}
export function connectNodes(data, id, ids, details = {}) {
  const valid = ids.filter(
    (x) =>
      x !== id &&
      data.concepts.some((n) => n.id === x && !n.trashedAt && !isScaffold(n)),
  );
  return {
    ...data,
    concepts: data.concepts.map((n) =>
      n.id === id
        ? {
            ...n,
            links: valid,
            grafts: Object.fromEntries(
              valid.map((target) => [
                target,
                details[target] ||
                  n.grafts?.[target] || {
                    relationship: "Related idea",
                    note: "",
                    sourceId: id,
                  },
              ]),
            ),
          }
        : {
            ...n,
            grafts: Object.fromEntries(
              Object.entries({
                ...n.grafts,
                ...(valid.includes(n.id)
                  ? {
                      [id]: details[n.id] ||
                        n.grafts?.[id] || {
                          relationship: "Related idea",
                          note: "",
                          sourceId: id,
                        },
                    }
                  : {}),
              }).filter(([key]) => key !== id || valid.includes(n.id)),
            ),
            links: valid.includes(n.id)
              ? [...new Set([...(n.links || []), id])]
              : (n.links || []).filter((x) => x !== id),
          },
    ),
  };
}
export function pluckNode(data, id) {
  const node = data.concepts.find((n) => n.id === id && !n.trashedAt);
  if (!node || isScaffold(node))
    throw new Error("Choose an active idea to pluck.");
  const home = locationOf(node, data.concepts, data.lifeAreas);
  return saveTreeNode(data, {
    ...node,
    ...home,
    kind: "concept",
    parent: "",
    subAreaId: "",
    standalone: true,
    history: [
      ...(node.history || []),
      {
        action: "pluck",
        at: new Date().toISOString(),
        parent: node.parent,
        subAreaId: home.subAreaId,
      },
    ],
  });
}
export function compostNode(data, id) {
  const node = data.concepts.find((n) => n.id === id && !n.trashedAt);
  if (!node || isScaffold(node)) return data;
  const batch = crypto.randomUUID(),
    at = new Date().toISOString(),
    ids = descendants(id, data.concepts);
  return {
    ...data,
    concepts: data.concepts.map((n) =>
      ids.has(n.id) && !n.trashedAt
        ? {
            ...n,
            trashedAt: at,
            compostBatch: batch,
            history: [...(n.history || []), { action: "compost", at }],
          }
        : n,
    ),
  };
}
export function restoreNode(data, id) {
  const node = data.concepts.find((n) => n.id === id && n.trashedAt);
  if (!node) return data;
  const ids = new Set(
    data.concepts
      .filter(
        (n) =>
          n.id === id ||
          (node.compostBatch && n.compostBatch === node.compostBatch),
      )
      .map((n) => n.id),
  );
  // Restore the parent chain too so a restored idea always has a visible home.
  for (const childId of [...ids]) {
    let n = data.concepts.find((x) => x.id === childId);
    const seen = new Set();
    while (n?.parent && !seen.has(n.parent)) {
      seen.add(n.parent);
      n = data.concepts.find((x) => x.id === n.parent);
      if (n?.trashedAt) ids.add(n.id);
    }
  }
  return {
    ...data,
    concepts: data.concepts.map((n) =>
      ids.has(n.id)
        ? {
            ...n,
            trashedAt: null,
            compostBatch: null,
            history: [
              ...(n.history || []),
              { action: "restore", at: new Date().toISOString() },
            ],
          }
        : n,
    ),
  };
}
