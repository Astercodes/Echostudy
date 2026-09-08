import { LEGACY_GOAL_AREAS } from "./life-areas.js";
export const isScaffold = (n) => n.id === "root" || /^d[0-5]$/.test(n.id);
export const isScopeNode = (n) => ["life-area", "sub-area"].includes(n?.kind);
export const scopeId = (areaId, subAreaId = "") =>
  subAreaId ? `sub-area:${areaId}:${subAreaId}` : `life-area:${areaId}`;
export function knowledgeEntries(data) {
  const stored = new Map(data.concepts.map((n) => [n.id, n]));
  const scopes = data.lifeAreas.flatMap((area) =>
    [
      {
        id: scopeId(area.id),
        kind: "life-area",
        areaId: area.id,
        subAreaId: "",
        title: area.name,
      },
      ...area.subAreas.map((sub) => ({
        id: scopeId(area.id, sub.id),
        kind: "sub-area",
        areaId: area.id,
        subAreaId: sub.id,
        title: sub.name,
      })),
    ].map((scope) => ({
      description: "",
      status: "Growing",
      links: [],
      prerequisites: [],
      ...stored.get(scope.id),
      ...scope,
      parent: "",
    })),
  );
  return [...data.concepts.filter((n) => !isScopeNode(n)), ...scopes];
}
export function saveKnowledgeEntry(data, node) {
  return {
    ...data,
    concepts: [...data.concepts.filter((n) => n.id !== node.id), node],
  };
}
export function graftKnowledge(data, id, ids, details) {
  const entries = knowledgeEntries(data);
  let next = data;
  for (const target of new Set([id, ...ids])) {
    const node = entries.find((n) => n.id === target);
    if (node && !next.concepts.some((n) => n.id === target))
      next = saveKnowledgeEntry(next, node);
  }
  return connectNodes(next, id, ids, details);
}
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
      !isScopeNode(n) &&
      !n.trashedAt &&
      !data.concepts.some(
        (s) =>
          s.trashedAt &&
          isScopeNode(s) &&
          s.areaId === areaId &&
          (!s.subAreaId ||
            s.subAreaId ===
              locationOf(n, data.concepts, data.lifeAreas).subAreaId),
      ) &&
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
      isScopeNode(parent) ||
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
  const scope = knowledgeEntries(data).find(
    (n) => n.id === id && isScopeNode(n),
  );
  if (scope) {
    const newId = crypto.randomUUID();
    const copy = {
      ...scope,
      id: newId,
      kind: "concept",
      parent: "",
      subAreaId: "",
      standalone: true,
      trashedAt: null,
      sourceScopeId: id,
      history: [
        ...(scope.history || []),
        { action: "pluck", at: new Date().toISOString(), sourceScopeId: id },
      ],
    };
    return graftKnowledge(
      saveKnowledgeEntry(data, copy),
      newId,
      scope.links || [],
      scope.grafts || {},
    );
  }
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
  const scope = knowledgeEntries(data).find(
    (n) => n.id === id && isScopeNode(n),
  );
  if (scope) {
    const prepared = saveKnowledgeEntry(data, scope),
      at = new Date().toISOString(),
      batch = crypto.randomUUID();
    return {
      ...prepared,
      concepts: prepared.concepts.map((n) => {
        const home = locationOf(n, prepared.concepts, prepared.lifeAreas);
        const belongs =
          !isScaffold(n) &&
          home.areaId === scope.areaId &&
          (!scope.subAreaId || home.subAreaId === scope.subAreaId);
        return belongs && !n.trashedAt
          ? {
              ...n,
              trashedAt: at,
              compostBatch: batch,
              history: [...(n.history || []), { action: "compost", at }],
            }
          : n;
      }),
    };
  }
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
  for (const childId of [...ids]) {
    const child = data.concepts.find((n) => n.id === childId);
    const home = locationOf(child, data.concepts, data.lifeAreas);
    for (const key of [
      scopeId(home.areaId),
      scopeId(home.areaId, home.subAreaId),
    ]) {
      if (data.concepts.some((n) => n.id === key && n.trashedAt)) ids.add(key);
    }
  }
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
