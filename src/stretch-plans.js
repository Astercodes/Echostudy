export const HORIZONS = {
  daily: {
    name: "Daily",
    title: "Micro Stretch",
    description: "Small deliberate behaviours · typically 5–15 minutes",
    example:
      "Ask one better question or practise listening in one conversation.",
    rank: 1,
  },
  weekly: {
    name: "Weekly",
    title: "Practice Stretch",
    description: "Repeated meaningful exercise",
    example: "Conduct one structured 1:1 and review your approach.",
    rank: 2,
  },
  monthly: {
    name: "Monthly",
    title: "Performance Stretch",
    description: "A substantial performance challenge",
    example: "Lead a meeting from planning through follow-up.",
    rank: 3,
  },
  quarterly: {
    name: "Quarterly",
    title: "Growth Stretch",
    description: "Integrate several domains and capacities",
    example: "Lead a 90-day improvement initiative.",
    rank: 4,
  },
  yearly: {
    name: "Yearly",
    title: "Expansion Stretch",
    description: "A major capability or outcome",
    example: "Manage a team or project from initiation through completion.",
    rank: 5,
  },
};
export const HARVEST_TYPES = {
  knowledge: {
    name: "Knowledge",
    prompt: "What did practice reveal about how the knowledge works?",
    destination: "Returns to linked Study sources",
  },
  capability: {
    name: "Capability",
    prompt: "What can you now do, and what demonstrates it?",
    destination: "Adds evidence to selected Barns",
  },
  artifact: {
    name: "Artifact",
    prompt:
      "What did you create: a presentation, report, code, design, budget or framework?",
    destination: "Keeps the artifact with its originating practice",
  },
  outcome: {
    name: "Outcome",
    prompt: "What observable agreement, decision or result did this produce?",
    destination: "Documents an observable result",
  },
  impact: {
    name: "Impact",
    prompt:
      "What changed beyond the activity, over what period, and how do you know?",
    destination: "Records change and its evidence",
  },
  insight: {
    name: "Insight",
    prompt: "What did you learn through doing?",
    destination: "Can return to linked Study sources",
  },
  opportunity: {
    name: "Opportunity",
    prompt: "What new opportunity, connection or responsibility emerged?",
    destination: "Records a possibility for future action",
  },
  evidence: {
    name: "Evidence",
    prompt: "What demonstrates your competence for a portfolio or career?",
    destination: "Keeps traceable evidence of competency",
  },
};
export function planHorizon(record) {
  return HORIZONS[record.horizon] ? record.horizon : "";
}
export function goalHorizon(goal) {
  return (
    {
      Day: "daily",
      Week: "weekly",
      Month: "monthly",
      Quarter: "quarterly",
      Year: "yearly",
    }[goal?.level] || "weekly"
  );
}
export function validatePlanHierarchy(records, record) {
  if (record.horizon && !HORIZONS[record.horizon])
    return "Choose a valid practice horizon.";
  if (record.parentStretchId) {
    const parent = records.find((r) => r.id === record.parentStretchId);
    if (
      !parent ||
      parent.id === record.id ||
      !(HORIZONS[parent.horizon]?.rank > HORIZONS[record.horizon]?.rank)
    )
      return "The parent plan must have a broader practice horizon.";
  }
  if (
    records.some(
      (r) =>
        r.parentStretchId === record.id &&
        !(HORIZONS[record.horizon]?.rank > HORIZONS[r.horizon]?.rank),
    )
  )
    return "This horizon must remain broader than its child plans.";
  if (record.targetDate && record.targetDate < record.date)
    return "The target date must be on or after the start date.";
  return "";
}
export function harvestEntries(data) {
  return (data.stretches || []).flatMap((plan) => [
    ...(plan.harvests || []).map((h) => ({
      ...h,
      planId: plan.id,
      planTitle: plan.title,
      areaId: plan.areaId,
      subAreaId: plan.subAreaId,
    })),
    // Keep explicitly entered older harvest text; completion/outcome alone is never a harvest.
    ...(plan.harvest?.trim()
      ? [
          {
            id: `legacy:${plan.id}`,
            legacy: true,
            planId: plan.id,
            planTitle: plan.title,
            type: "legacy",
            title: "Earlier harvest",
            description: plan.harvest,
            evidence: plan.evidence || "",
            date: plan.date,
            knowledgeIds: plan.knowledgeIds || [],
            capacityIds: [],
            resourceIds: [],
          },
        ]
      : []),
  ]);
}
export function saveHarvest(data, planId, harvest) {
  if (
    !HARVEST_TYPES[harvest.type] ||
    !harvest.title?.trim() ||
    !harvest.description?.trim()
  )
    throw Error("Choose a harvest type and describe what was produced.");
  if (!harvest.evidence?.trim() && !harvest.resourceIds?.length)
    throw Error(
      "Add an observation, reference or artifact that supports this harvest.",
    );
  if (harvest.type === "knowledge" && !harvest.knowledgeIds?.length)
    throw Error("Link a Study source for this knowledge harvest.");
  if (harvest.type === "capability" && !harvest.capacityIds?.length)
    throw Error("Choose the capacities this harvest demonstrates.");
  if (!data.stretches?.some((s) => s.id === planId))
    throw Error("This Stretch plan is no longer available.");
  return {
    ...data,
    stretches: data.stretches.map((s) =>
      s.id === planId
        ? {
            ...s,
            harvests: [
              ...(s.harvests || []).filter((h) => h.id !== harvest.id),
              { ...harvest, updatedAt: new Date().toISOString() },
            ],
          }
        : s,
    ),
  };
}
