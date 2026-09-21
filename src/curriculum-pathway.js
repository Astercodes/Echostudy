import energy from "./energy-curriculum.json" with { type: "json" };
import { normalizeStep, rankMatches } from "./growth-pathway.js";
import { localGrowthPathway } from "./local-growth-planner.js";
import { uid } from "./model.js";
import { saveTreeNode, locationOf } from "./knowledge-tree.js";
import { attachReference } from "./source-references.js";
export const energyCurriculum = energy;
export const lessonName = (step) =>
  step.title || `Lesson ${(step.lessonOrder || 0) + 1}`;
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
            sourceKey: lesson.sourceKey,
            legacyTitle: lesson.legacyTitle,
            stageTitle: level.stageTitle || "",
            levelOrder,
            levelTitle: level.title,
            levelOutcome: level.outcome,
            moduleTitle: module.title,
            moduleOrder,
            lessonOrder,
            topics: lesson.topics,
            blueprint: energy.id,
            prerequisite: "",
            type: lesson.applied ? "stretch" : "study",
            action: lesson.applied ? "Apply" : "Peel",
            duration: lesson.applied ? 45 : 25,
            objective:
              lesson.objective ||
              `Study the supplied concepts${lesson.title ? ` for ${lesson.title}` : module.title ? ` within ${module.title}` : ""}. Record a referenced explanation, an example and questions for further study.`,
            success:
              lesson.success ||
              "A referenced explanation, a worked example or diagram, and notes on the supplied concepts.",
            rationale: level.outcome,
            conceptId: concept?.id || "",
            resourceIds,
            searchQuery: [
              lesson.title,
              module.title,
              ...lesson.topics.slice(0, 2),
            ]
              .filter(Boolean)
              .join(" "),
            resources: [],
          });
        }),
      ),
    );
    return {
      title: energy.title,
      summary:
        "Topic → Subtopic → Lesson → Concepts. Supplied wording and order are preserved. Headings missing from the source are left unnamed. Choose one lesson for each focus session.",
      steps,
    };
  }
  const p = localGrowthPathway(data, goal, context, knowledge, resources);
  return {
    ...p,
    title: goal.title,
    summary:
      p.summary +
      " This is a starting scaffold; use a custom curriculum for subject-specific topics, subtopics and lessons.",
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
export function upgradeEnergyPathways(data) {
  const old = (data.learningPlanner || []).filter(
    (s) => s.blueprint === "energy-strategy-v1",
  );
  if (!old.length) return data;
  const template = curriculumPathway(
    data,
    { title: "Energy" },
    "",
    [],
    [],
    "energy",
  ).steps;
  const byKey = new Map(template.map((s) => [s.sourceKey, s]));
  const batches = [...new Set(old.map((s) => s.pathwayId))];
  const learningPlanner = data.learningPlanner.map((s) => {
    if (s.blueprint !== "energy-strategy-v1") return s;
    const t = byKey.get(
      `energy-v1:${s.levelOrder}:${s.moduleOrder}:${s.lessonOrder}`,
    );
    if (!t) return { ...s, blueprint: "energy-strategy-v2" };
    return {
      ...s,
      blueprint: t.blueprint,
      sourceKey: t.sourceKey,
      levelTitle: t.levelTitle,
      levelOrder: t.levelOrder,
      moduleTitle: t.moduleTitle,
      moduleOrder: t.moduleOrder,
      lessonOrder: t.lessonOrder,
      levelOutcome: "",
      prerequisite: "",
      title: s.title === t.legacyTitle ? t.title : s.title,
      objective: s.objective === `Explain ${t.legacyTitle?.toLowerCase()} in the energy industry. Work through the listed concepts, compare an example and a non-example, and record questions that need more study.`
        ? t.objective
        : s.objective,
      order: t.levelOrder * 10000 + t.moduleOrder * 100 + t.lessonOrder,
    };
  });
  for (const pathwayId of batches) {
    const source = old.find((s) => s.pathwayId === pathwayId);
    for (const t of template.filter((s) =>
      s.sourceKey?.startsWith("business-v2:"),
    ))
      learningPlanner.push({
        ...t,
        id: uid(),
        pathwayId,
        goalId: source.goalId,
        goalIds: source.goalIds || [source.goalId],
        status: "planned",
        order: t.moduleOrder * 100 + t.lessonOrder,
        createdAt: new Date().toISOString(),
      });
  }
  return { ...data, learningPlanner };
}
export function outlinePathway(text, goal) {
  let level = "",
    module = "",
    levelOrder = -1,
    moduleOrder = -1,
    lessonOrder = 0,
    explicit = false,
    current;
  const steps = [];
  const heading = (value, kind) =>
    value
      .replace(new RegExp("^" + kind + "\\s+\\d+\\s*[—–:-]\\s*", "i"), "")
      .trim();
  const add = (title) => {
    current = normalizeStep({
      curriculumLesson: true,
      title,
      levelOrder: Math.max(0, levelOrder),
      levelTitle: level,
      moduleTitle: module,
      moduleOrder: Math.max(0, moduleOrder),
      lessonOrder: lessonOrder++,
      topics: [],
      objective:
        "Study the supplied concepts and record a referenced explanation and example.",
      success: "Save an explanation, an example and remaining questions.",
      duration: 25,
      action: "Peel",
      type: "study",
      searchQuery: [level, module, title].filter(Boolean).join(" "),
    });
    steps.push(current);
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/&#x20;/g, " ").trim();
    if (!line || /^---+$/.test(line) || /^####\s/.test(line)) continue;
    if (/^###\s/.test(line)) {
      explicit = true;
      add(heading(line.replace(/^###\s+/, ""), "Lesson"));
      continue;
    }
    if (/^##\s/.test(line)) {
      module = heading(line.replace(/^##\s+/, ""), "Subtopic");
      moduleOrder++;
      lessonOrder = 0;
      current = null;
      continue;
    }
    if (/^#\s/.test(line) || /^Topic\s+\d+\s*[—–:-]/i.test(line)) {
      level = heading(line.replace(/^#\s+/, ""), "Topic");
      levelOrder++;
      module = "";
      moduleOrder = -1;
      lessonOrder = 0;
      current = null;
      continue;
    }
    if (explicit && /^[-*]\s/.test(line) && current) {
      current.topics.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    if (/^Concepts$/i.test(line)) continue;
    add(line.replace(/^[-*]\s+/, ""));
  }
  if (!steps.length)
    throw Error("Add at least one lesson beneath your topic headings.");
  if (steps.length > 500)
    throw Error("Keep each pathway to 500 lessons or fewer.");
  return {
    title: goal.title,
    summary:
      "Your Topic → Subtopic → Lesson → Concepts curriculum, in the order supplied.",
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
        n.pathwayTopicOrder === step.levelOrder &&
        n.kind === "tree" &&
        n.areaId === areaId &&
        n.subAreaId === subAreaId &&
        !n.trashedAt,
    );
    if (!parent) {
      parent = {
        id: uid(),
        title: step.levelTitle || `Topic ${(step.levelOrder || 0) + 1}`,
        kind: "tree",
        areaId,
        subAreaId,
        parent: "",
        status: "Growing",
        links: [],
        prerequisites: [],
        pathwayId: step.pathwayId,
        pathwayLevel: step.levelTitle,
        pathwayTopicOrder: step.levelOrder,
      };
      next = saveTreeNode(next, parent);
    }
  }
  const node = {
    id: uid(),
    title: lessonName(step),
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
