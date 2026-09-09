export function matchesReference(ref, nodeId, scope) {
  if (ref.nodeId !== nodeId) return false;
  if (ref.key === `${nodeId}|${scope}` || ref.scope === scope) return true;
  // Retain references saved under the older content/independent-study labels.
  return (
    scope === `${nodeId}:content` &&
    [`${nodeId}:content:`, `${nodeId}:isolate:`].some((prefix) =>
      ref.scope?.startsWith(prefix),
    )
  );
}
export function attachReference(data, resource, reference) {
  const current = data.resources.find((r) => r.id === resource.id) || resource;
  const existing = (current.knowledgeRefs || []).find((ref) =>
    matchesReference(ref, reference.nodeId, reference.scope),
  );
  const updated = {
    ...current,
    concepts: [...new Set([...(current.concepts || []), reference.nodeId])],
    knowledgeRefs: existing
      ? current.knowledgeRefs
      : [...(current.knowledgeRefs || []), reference],
  };
  return {
    ...data,
    resources: data.resources.some((r) => r.id === current.id)
      ? data.resources.map((r) => (r.id === current.id ? updated : r))
      : [...data.resources, updated],
  };
}
export function updateReference(data, resourceId, referenceId, changes) {
  return {
    ...data,
    resources: data.resources.map((r) =>
      r.id !== resourceId
        ? r
        : {
            ...r,
            knowledgeRefs: (r.knowledgeRefs || []).map((ref) =>
              ref.id === referenceId ? { ...ref, ...changes } : ref,
            ),
          },
    ),
  };
}
