import energy from "./energy-curriculum.json" with { type: "json" };
import { normalizeStep, rankMatches } from "./growth-pathway.js";
import { localGrowthPathway } from "./local-growth-planner.js";
import { uid } from "./model.js";
import { saveTreeNode, locationOf } from "./knowledge-tree.js";
import { attachReference } from "./source-references.js";
export const energyCurriculum = energy;
export const matchesEnergyGoal = (goal) =>
  /\b(energy|electricity|oil|gas|renewable)\b/i.test(goal?.title || "");
export function curriculumPathway(
  data,
  goal,
  context,
  knowledge,
  resources,
  mode = "auto",
) {
  if (mode === "energy" || (mode === "auto" && matchesEnergyGoal(goal))) {
    const steps = energy.levels.flatMap((level, levelOrder) =>
      level.modules.flatMap((module, moduleOrder) =>
        module.lessons.map((lesson, lessonOrder) => {
          const resourceIds = rankMatches(
            resources,
            lesson.title + " " + lesson.topics.join(" "),
          )
            .slice(0, 3)
            .map((r) => r.id);
          const concept = knowledge.find(
            (n) =>
              !n.trashedAt &&
              !["life-area", "sub-area"].includes(n.kind) &&
              n.id !== "root" &&
              n.title.toLowerCase() === lesson.title.toLowerCase(),
          );
          return normalizeStep({
            curriculumLesson: true,
            title: lesson.title,
            levelOrder,
            levelTitle: level.title,
            levelOutcome: level.outcome,
            moduleTitle: module.title,
            moduleOrder,
            lessonOrder,
            topics: lesson.topics,
            blueprint: energy.id,
            prerequisite: levelOrder
              ? energy.levels[levelOrder - 1].title
              : "No prior energy-industry knowledge assumed.",
            type: lesson.applied ? "stretch" : "study",
            action: lesson.applied ? "Apply" : "Peel",
            duration: lesson.applied ? 45 : 25,
            objective:
              lesson.objective ||
              `Explain ${lesson.title.toLowerCase()} in the energy industry. Work through the listed concepts, compare an example and a non-example, and record questions that need more study.`,
            success:
              lesson.success ||
              `An explanation of ${lesson.title.toLowerCase()}, a worked example or diagram, and referenced notes on the listed concepts.`,
            rationale: level.outcome,
            conceptId: concept?.id || "",
            resourceIds,
            searchQuery: `${lesson.title} energy learning`,
            resources: [],
          });
        }),
      ),
    );
    return {
      title: energy.title,
      summary:
        "A supplied energy curriculum, sequenced from foundations to strategy and innovation. Choose one lesson for each session; 25 minutes is an initial focus block, not an estimate of mastery. Levels guide progression without locking practice.",
      steps,
    };
  }
  const p = localGrowthPathway(data, goal, context, knowledge, resources);
  return {
    ...p,
    title: goal.title,
    summary:
      p.summary +
      " This is a starting scaffold; use a custom curriculum for subject-specific levels and lessons.",
    steps: p.steps.map((s, i) => ({
      ...s,
      curriculumLesson: true,
      levelOrder: 0,
      levelTitle: "Starting pathway",
      moduleTitle: s.type === "stretch" ? "Practice" : "Study",
      lessonOrder: i,
      topics: [],
      levelOutcome: goal.title,
    })),
  };
}
export function outlinePathway(text, goal) {
  let level = "Foundations",
    module = "Core lessons",
    levelOrder = 0;
  const steps = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("## ")) {
      module = line.slice(3).trim();
      continue;
    }
    if (line.startsWith("# ")) {
      level = line.slice(2).trim();
      levelOrder = steps.length ? levelOrder + 1 : 0;
      module = "Core lessons";
      continue;
    }
    const title = line.replace(/^[-*]\s*/, "").trim();
    if (!title) continue;
    steps.push(
      normalizeStep({
        curriculumLesson: true,
        title,
        levelOrder,
        levelTitle: level,
        moduleTitle: module,
        topics: [],
        objective: `Study ${title} and explain how it contributes to ${goal.title}.`,
        success:
          "Save a referenced explanation, an example and remaining questions.",
        duration: 25,
        action: "Peel",
        type: "study",
        searchQuery: title,
      }),
    );
  }
  if (!steps.length)
    throw Error("Add at least one lesson beneath your level headings.");
  if (steps.length > 500)
    throw Error("Keep each pathway to 500 lessons or fewer.");
  return {
    title: goal.title,
    summary:
      "Your custom curriculum. Review and edit each lesson as your understanding develops.",
    steps,
  };
}
export function growLesson(
  data,
  step,
  { areaId, subAreaId = "", parentId = "" },
) {
  const previous = data.concepts.find(
    (n) => n.sourceLessonId === step.id && !n.trashedAt,
  );
  if (previous)
    return {
      data: {
        ...data,
        learningPlanner: data.learningPlanner.map((s) =>
          s.id === step.id ? { ...s, conceptId: previous.id } : s,
        ),
      },
      id: previous.id,
    };
  let next = data,
    parent = next.concepts.find((n) => n.id === parentId);
  if (parentId && !parent) throw Error("Choose an existing destination.");
  if (parent) {
    const loc = locationOf(parent, data.concepts, data.lifeAreas);
    areaId = loc.areaId;
    subAreaId = loc.subAreaId;
  } else {
    parent = next.concepts.find(
      (n) =>
        n.pathwayId === step.pathwayId &&
        n.pathwayLevel === step.levelTitle &&
        n.kind === "tree" &&
        n.areaId === areaId &&
        n.subAreaId === subAreaId &&
        !n.trashedAt,
    );
    if (!parent) {
      parent = {
        id: uid(),
        title: step.levelTitle || "Learning pathway",
        kind: "tree",
        areaId,
        subAreaId,
        parent: "",
        status: "Growing",
        links: [],
        prerequisites: [],
        pathwayId: step.pathwayId,
        pathwayLevel: step.levelTitle,
      };
      next = saveTreeNode(next, parent);
    }
  }
  const node = {
    id: uid(),
    title: step.title,
    kind: "concept",
    parent: parent.id,
    areaId,
    subAreaId,
    status: "Growing",
    description: step.objective,
    links: [],
    prerequisites: [],
    sourceLessonId: step.id,
    goalId: step.goalId,
    resourceIds: step.resourceIds || [],
  };
  next = saveTreeNode(next, node);
  for (const title of step.topics || [])
    next = saveTreeNode(next, {
      id: uid(),
      title,
      kind: "leaf",
      parent: node.id,
      areaId,
      subAreaId,
      status: "Growing",
      description: "",
      links: [],
      prerequisites: [],
      sourceLessonId: step.id + ":" + title,
    });
  for (const resource of next.resources.filter((r) =>
    (step.resourceIds || []).includes(r.id),
  ))
    next = attachReference(next, resource, {
      id: uid(),
      key: `${node.id}|${node.id}:content`,
      scope: `${node.id}:content`,
      nodeId: node.id,
      action: "content",
      component: "Lesson resources",
      locator: "",
      citation: "",
      lineage: [parent.title, node.title].join(" → "),
      createdAt: new Date().toISOString(),
    });
  next = {
    ...next,
    learningPlanner: next.learningPlanner.map((s) =>
      s.id === step.id ? { ...s, conceptId: node.id } : s,
    ),
  };
  return { data: next, id: node.id };
}
