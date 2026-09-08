// Add the user's example once. Never replace, rename, or reparent existing knowledge.
export function addManagementExample(state) {
  if (state.knowledgeExampleRevision >= 1) return state;
  const area = state.lifeAreas.find(
    (a) =>
      a.id === "leadership" ||
      a.name.toLowerCase() === "leadership & influence",
  );
  const grove = area?.subAreas.find(
    (s) => s.name.toLowerCase() === "management",
  );
  if (!grove) return state;
  const concepts = [...state.concepts];
  const add = (key, title, kind, parent = "", description = "") => {
    const id = "ecosystem-management-v1:" + key;
    if (!concepts.some((n) => n.id === id))
      concepts.push({
        id,
        title,
        kind,
        parent,
        description,
        areaId: area.id,
        subAreaId: grove.id,
        status: "Growing",
        links: [],
        prerequisites: [],
        example: "management-v1",
      });
    return id;
  };
  const tree = add(
    "people",
    "People Management",
    "tree",
    "",
    "A body of knowledge about managing people toward individual and organizational outcomes.",
  );
  for (const name of [
    "Performance Management",
    "Project Management",
    "Change Management",
    "Strategic Management",
    "Operations Management",
    "Resource Management",
  ])
    add("tree-" + name, name, "tree");
  for (const name of [
    "Human behavior",
    "Motivation",
    "Communication fundamentals",
    "Emotional intelligence",
    "Organizational behavior",
  ])
    add("root-" + name, name, "foundation", tree);
  const stem = add(
    "stem",
    "Core principles of people management",
    "stem",
    tree,
    "The principles and practice of effectively managing people toward individual and organizational outcomes.",
  );
  for (const name of [
    "Manager's role",
    "Setting expectations",
    "Delegation",
    "Communication",
    "Accountability",
    "Motivation",
    "Developing people",
  ])
    add("core-" + name, name, "leaf", stem);
  let performance;
  for (const name of [
    "Hiring & Onboarding",
    "Delegation",
    "Motivation",
    "Performance Management",
    "Employee Development",
    "Team Dynamics",
    "Conflict Management",
    "Retention",
  ]) {
    const id = add("branch-" + name, name, "branch", tree);
    if (name === "Performance Management") performance = id;
  }
  let feedback;
  for (const name of [
    "Goal Setting",
    "Performance Measurement",
    "Feedback",
    "Coaching",
    "Performance Reviews",
    "Underperformance",
    "Recognition",
  ]) {
    const id = add("sub-" + name, name, "sub-branch", performance);
    if (name === "Feedback") feedback = id;
  }
  for (const name of [
    "What feedback means",
    "Positive vs. corrective feedback",
    "Timeliness of feedback",
    "SBI model",
    "Radical candor",
    "Psychological safety",
    "Specific vs. general feedback",
    "Feedback frequency",
  ])
    add("leaf-" + name, name, "leaf", feedback);
  add(
    "fruit-feedback",
    "Giving Effective Corrective Feedback",
    "fruit",
    feedback,
    "Explore how to give effective corrective feedback. Use the knowledge actions to build your own understanding, notes and questions.",
  );
  return { ...state, concepts, knowledgeExampleRevision: 1 };
}
