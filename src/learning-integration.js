const contributes = (record, id) =>
  record?.pathwayStepId === id || (record?.pathwayStepIds || []).includes(id);
export const linkedGoals = (item) => [
  ...new Set([item.goalId, ...(item.goalIds || [])].filter(Boolean)),
];
export function integrateLearning(data) {
  const goals = data.goals.map((g) => ({
    ...g,
    contributionEvidence: {
      studyIds: data.sessions
        .filter((s) => linkedGoals(s).includes(g.id))
        .map((s) => s.id),
      stretchIds: (data.stretches || [])
        .filter(
          (s) => s.status === "completed" && linkedGoals(s).includes(g.id),
        )
        .map((s) => s.id),
    },
  }));
  const concepts = data.concepts.map((c) => {
    const sessions = data.sessions.filter((s) => s.conceptId === c.id);
    return sessions.length
      ? {
          ...c,
          studySessionIds: sessions.map((s) => s.id),
          lastStudiedAt: sessions.at(-1).completedAt,
        }
      : c;
  });
  const learningPlanner = (data.learningPlanner || []).map((item) => {
    const study = data.sessions.filter((s) => contributes(s, item.id)),
      practice = (data.stretches || []).filter(
        (s) => contributes(s, item.id) && s.status === "completed",
      );
    const scheduled = Object.entries(data.plans).find(([, blocks]) =>
      blocks.some((b) => contributes(b, item.id) && b.status !== "skipped"),
    );
    const active =
      contributes(data.timer, item.id) ||
      (data.stretches || []).some(
        (s) => contributes(s, item.id) && s.status === "active",
      );
    return {
      ...item,
      ...(scheduled ? { date: scheduled[0] } : {}),
      status: item.curriculumLesson
        ? item.lessonCompletedAt
          ? "completed"
          : active
            ? "active"
            : study.length || practice.length
              ? "in progress"
              : scheduled
                ? "scheduled"
                : "planned"
        : study.length || practice.length
          ? [...study, ...practice].some((s) => s.pathwayStepId === item.id)
            ? "completed"
            : "in progress"
          : active
            ? "active"
            : item.status === "completed" || item.status === "complete"
              ? "completed"
              : scheduled
                ? "scheduled"
                : ["scheduled", "active"].includes(item.status)
                  ? "planned"
                  : item.status || "planned",
      evidenceIds: [...study, ...practice].map((s) => s.id),
    };
  });
  return { ...data, goals, concepts, learningPlanner };
}
