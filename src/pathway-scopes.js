import { uid } from "./model.js";
import { lessonName, growLesson } from "./curriculum-pathway.js";
import { saveTreeNode } from "./knowledge-tree.js";
export function scopeFor(data, steps, title, options = {}) {
  if (!steps.length) throw Error("Select at least one lesson.");
  const ids = [...new Set(steps.map((s) => s.id))],
    key = [...ids].sort().join("|");
  const prior = (data.pathwayScopes || []).find(
    (s) =>
      [...(s.pathwayStepIds || [])].sort().join("|") === key &&
      s.type === (options.type || "study") &&
      s.action ===
        (options.type === "stretch" ? "Apply" : options.action || "Peel"),
  );
  const scope = {
    ...steps[0],
    id: prior?.id || uid(),
    title,
    pathwayStepIds: ids,
    type: "study",
    action: "Peel",
    duration: 25,
    objective: `Work on ${title}. Use this focus block for the selected lesson scope and record what you covered and what remains.`,
    success:
      "Save your work and identify the lessons or concepts that need another session.",
    resourceIds: [...new Set(steps.flatMap((s) => s.resourceIds || []))],
    resourceId: prior?.resourceId || "",
    conceptId: prior?.conceptId || "",
    topics: steps.map(
      (s) => `Subtopic ${(s.moduleOrder || 0) + 1} · ${lessonName(s)}`,
    ),
    resources: [],
    ...options,
  };
  return {
    ...scope,
    action: scope.type === "stretch" ? "Apply" : scope.action,
  };
}
export function saveScope(data, scope) {
  return {
    ...data,
    pathwayScopes: [
      ...(data.pathwayScopes || []).filter((s) => s.id !== scope.id),
      scope,
    ],
  };
}
export function growScope(data, scope, destination) {
  const lessons = (data.learningPlanner || []).filter((s) =>
    scope.pathwayStepIds.includes(s.id),
  );
  if (!lessons.length) throw Error("The selected lessons no longer exist.");
  let next = data,
    root = next.concepts.find(
      (n) =>
        !n.trashedAt &&
        (n.sourcePathwayScopeId === scope.id ||
          (n.sourcePathwayLessonIds &&
            [...n.sourcePathwayLessonIds].sort().join("|") ===
              [...scope.pathwayStepIds].sort().join("|"))),
    );
  if (!root) {
    root = {
      id: uid(),
      title: scope.title,
      kind: destination.parentId ? "concept" : "tree",
      parent: destination.parentId || "",
      areaId: destination.areaId,
      subAreaId: destination.subAreaId || "",
      sourcePathwayScopeId: scope.id,
      sourcePathwayLessonIds: scope.pathwayStepIds,
      status: "Growing",
      description: scope.objective,
      links: [],
      prerequisites: [],
    };
    next = saveTreeNode(next, root);
    root = next.concepts.find((n) => n.id === root.id);
  }
  for (const lesson of lessons) {
    const moduleKey = `${lesson.levelOrder || 0}:${lesson.moduleOrder || 0}`;
    let branch = next.concepts.find(
      (n) =>
        n.parent === root.id &&
        n.pathwayModuleKey === moduleKey &&
        !n.trashedAt,
    );
    if (!branch) {
      branch = {
        ...root,
        id: uid(),
        title:
          lesson.moduleTitle || `Subtopic ${(lesson.moduleOrder || 0) + 1}`,
        kind: "concept",
        parent: root.id,
        pathwayModuleKey: moduleKey,
        sourcePathwayScopeId: undefined,
        sourcePathwayLessonIds: undefined,
        description: "",
        links: [],
      };
      next = saveTreeNode(next, branch);
    }
    const grown = growLesson(next, lesson, {
      ...destination,
      parentId: branch.id,
    });
    next = grown.data;
    if (next.concepts.find((n) => n.id === grown.id)?.parent !== branch.id)
      next = {
        ...next,
        concepts: next.concepts.map((n) =>
          n.id === branch.id
            ? { ...n, links: [...new Set([...(n.links || []), grown.id])] }
            : n,
        ),
      };
  }
  next = saveScope(next, { ...scope, conceptId: root.id });
  return { data: next, id: root.id };
}
