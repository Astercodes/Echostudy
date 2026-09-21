export function pathwayCards(data) {
  const groups = new Map();
  for (const step of data.learningPlanner || []) {
    if (!step.goalId) continue;
    const id = step.pathwayId || `legacy:${step.goalId}`;
    if (!groups.has(id))
      groups.set(id, {
        id,
        goalId: step.goalId,
        batch: step.pathwayId || "earlier",
        steps: [],
      });
    groups.get(id).steps.push(step);
  }
  const order = data.pathwayOrder || [];
  return [...groups.values()]
    .map((p) => ({
      ...p,
      goal: data.goals.find((g) => g.id === p.goalId),
      title:
        data.pathwayDetails?.[p.id]?.title ||
        data.goals.find((g) => g.id === p.goalId)?.title ||
        "Saved pathway",
    }))
    .sort((a, b) => {
      const ai = order.indexOf(a.id),
        bi = order.indexOf(b.id);
      return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi);
    });
}
export function changePathway(data, id, action, value) {
  const cards = pathwayCards(data),
    card = cards.find((p) => p.id === id);
  if (!card) throw Error("This pathway is no longer available.");
  const ids = new Set(card.steps.map((s) => s.id));
  if (action === "edit") {
    const title = String(value || "").trim();
    if (!title) throw Error("Enter a pathway name.");
    return {
      ...data,
      pathwayDetails: {
        ...data.pathwayDetails,
        [id]: { ...data.pathwayDetails?.[id], title },
      },
    };
  }
  if (action === "move") {
    if (!data.goals.some((g) => g.id === value))
      throw Error("Choose an existing goal.");
    return {
      ...data,
      learningPlanner: data.learningPlanner.map((s) =>
        ids.has(s.id)
          ? {
              ...s,
              pathwayId: s.pathwayId || id,
              goalId: value,
              goalIds: [
                ...new Set([
                  value,
                  ...(s.goalIds || []).filter((g) => g !== card.goalId),
                ]),
              ],
            }
          : s,
      ),
    };
  }
  if (action === "delete") {
    const details = { ...data.pathwayDetails };
    delete details[id];
    return {
      ...data,
      learningPlanner: data.learningPlanner.filter((s) => !ids.has(s.id)),
      pathwayDetails: details,
      pathwayOrder: (data.pathwayOrder || []).filter((x) => x !== id),
    };
  }
  if (action === "up" || action === "down") {
    const order = cards.map((p) => p.id),
      at = order.indexOf(id),
      to = at + (action === "up" ? -1 : 1);
    if (to < 0 || to >= order.length) return data;
    [order[at], order[to]] = [order[to], order[at]];
    return { ...data, pathwayOrder: order };
  }
  return data;
}
