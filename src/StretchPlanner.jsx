import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Layers3,
  Plus,
  ChevronRight,
  Target,
  CalendarDays,
  Sprout,
  Check,
} from "lucide-react";
import { Button, Field, Modal } from "./App";
import { supabase } from "./auth";
import { SourceOpen } from "./KnowledgeSources";
import { knowledgeEntries, isScaffold, isScopeNode } from "./knowledge-tree";
import { uid, today } from "./model";
import {
  normalizeStep,
  rankMatches,
  acceptPathway,
  studyActions,
} from "./growth-pathway";
import {
  curriculumPathway,
  outlinePathway,
  matchesEnergyGoal,
  growLesson,
  lessonName,
  upgradeEnergyPathways,
} from "./curriculum-pathway";
import "./growth-pathway.css";
const horizons = {
  Year: "Yearly",
  Quarter: "Quarterly",
  Month: "Monthly",
  Week: "Weekly",
  Day: "Daily",
};
const levelKey = (s) =>
  `${s.levelOrder || 0}:${s.levelTitle ?? "Your pathway"}`;
function levelsFor(steps) {
  const map = new Map();
  for (const s of steps) {
    const key = levelKey(s);
    if (!map.has(key))
      map.set(key, {
        key,
        title: s.levelTitle ?? "Your pathway",
        order: s.levelOrder || 0,
        outcome: s.levelOutcome || "",
        steps: [],
      });
    map.get(key).steps.push(s);
  }
  return [...map.values()].sort((a, b) => a.order - b.order);
}
export default function StretchPlanner({
  data,
  save,
  go,
  initialGoalId,
  onSelectGoal,
  onLaunch,
  onSchedule,
  onKnowledge,
}) {
  const [goalId, setGoalId] = useState(initialGoalId || ""),
    [builder, setBuilder] = useState(false),
    [horizon, setHorizon] = useState(""),
    [area, setArea] = useState(""),
    [sub, setSub] = useState(""),
    [query, setQuery] = useState(""),
    [context, setContext] = useState(""),
    [mode, setMode] = useState("auto"),
    [outline, setOutline] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(null),
    [editing, setEditing] = useState(null),
    [scheduling, setScheduling] = useState(null),
    [scheduleDate, setScheduleDate] = useState(today()),
    [batchId, setBatchId] = useState(
      data.growthPlannerFocus?.[initialGoalId]?.batch || "",
    ),
    [activeLevel, setActiveLevel] = useState(
      data.growthPlannerFocus?.[initialGoalId]?.level || "",
    ),
    [lessonId, setLessonId] = useState(
      data.growthPlannerFocus?.[initialGoalId]?.lesson || "",
    ),
    [growing, setGrowing] = useState(null),
    [destination, setDestination] = useState({
      areaId: "",
      subAreaId: "",
      parentId: "",
    }),
    [lessonSearch, setLessonSearch] = useState("");
  const request = useRef(null);
  useEffect(() => {
    save((d) => upgradeEnergyPathways(d));
  }, []);
  useEffect(() => () => request.current?.abort(), []);
  const goal = data.goals.find((g) => g.id === goalId),
    knowledge = knowledgeEntries(data).filter((n) => !n.trashedAt);
  const allSteps = (data.learningPlanner || []).map(normalizeStep),
    goalSteps = allSteps.filter((s) => s.goalId === goalId);
  const batches = [...new Set(goalSteps.map((s) => s.pathwayId || "earlier"))];
  const batch = batches.includes(batchId) ? batchId : batches.at(-1);
  const steps = goalSteps
    .filter((s) => (s.pathwayId || "earlier") === batch)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const levels = levelsFor(steps),
    level = levels.find((l) => l.key === activeLevel) || levels[0],
    lesson =
      steps.find((s) => s.id === lessonId && levelKey(s) === level?.key) ||
      level?.steps.find((s) => s.status !== "completed") ||
      level?.steps[0];
  useEffect(() => {
    if (!lesson) return;
    save((d) => ({
      ...d,
      growthPlannerFocus: {
        ...d.growthPlannerFocus,
        [goalId]: { batch, level: levelKey(lesson), lesson: lesson.id },
      },
    }));
  }, [lesson?.id]);
  const visible = data.goals.filter(
    (g) =>
      (!horizon || g.level === horizon) &&
      [
        { areaId: g.areaId, subAreaId: g.subAreaId },
        ...(g.locations || []),
      ].some(
        (l) => (!area || l.areaId === area) && (!sub || l.subAreaId === sub),
      ) &&
      g.title.toLowerCase().includes(query.toLowerCase()),
  );
  const select = (id) => {
    request.current?.abort();
    setBusy(false);
    setGoalId(id);
    onSelectGoal?.(id);
    setContext("");
    setPreview(null);
    setError("");
    setBatchId(data.growthPlannerFocus?.[id]?.batch || "");
    setActiveLevel(data.growthPlannerFocus?.[id]?.level || "");
    setLessonId(data.growthPlannerFocus?.[id]?.lesson || "");
    setLessonSearch("");
  };
  const store = (step) =>
    save((d) => ({
      ...d,
      learningPlanner: (d.learningPlanner || []).map((x) =>
        x.id === step.id ? step : x,
      ),
    }));
  const build = () => {
    try {
      const p =
        mode === "custom"
          ? outlinePathway(outline, goal)
          : curriculumPathway(
              data,
              goal,
              context,
              knowledge,
              data.resources,
              mode,
            );
      setPreview({ ...p, goalId });
      setBuilder(false);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  const generate = async () => {
    setBusy(true);
    setError("");
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 75000);
    try {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) throw Error("Please sign in again.");
      const response = await fetch("/api/growth-pathway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.session.access_token,
        },
        signal: controller.signal,
        body: JSON.stringify({
          goal: { title: goal.title, level: goal.level },
          context,
          knowledge: rankMatches(knowledge, goal.title + " " + context)
            .slice(0, 20)
            .map((n) => ({ id: n.id, title: n.title })),
          resources: rankMatches(data.resources, goal.title + " " + context)
            .slice(0, 20)
            .map((r) => ({ id: r.id, title: r.title })),
        }),
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw Error(
          "Gemini is unavailable. Your saved pathways are unchanged.",
        );
      }
      if (!response.ok)
        throw Error(result.error || "Could not generate a pathway.");
      if (!result.pathway?.steps?.length)
        throw Error("The pathway was incomplete.");
      setPreview({ ...result.pathway, goalId });
      setBuilder(false);
    } catch (e) {
      if (request.current === controller)
        setError(
          controller.signal.aborted
            ? "Generation interrupted. Your work is unchanged."
            : e.message,
        );
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) setBusy(false);
    }
  };
  const practice = (step) => {
    const prior = allSteps.find(
      (s) => s.sourceLessonId === step.id && s.type === "stretch",
    );
    const next =
      prior ||
      normalizeStep({
        ...step,
        id: uid(),
        sourceLessonId: step.id,
        type: "stretch",
        action: "Apply",
        title: `Practise: ${lessonName(step)}`,
        objective: `Use ${step.title} in a case, simulation or real situation. Record the attempt and what needs further study.`,
        status: "planned",
        lessonCompletedAt: null,
        evidenceIds: [],
        order: allSteps.length,
        createdAt: new Date().toISOString(),
      });
    if (!prior)
      save((d) => ({
        ...d,
        learningPlanner: [...(d.learningPlanner || []), next],
      }));
    onLaunch(next);
  };
  const resourceLinks = (step) => (
    <div className="growth-step-resources">
      {step.resourceIds.map((id) => {
        const r = data.resources.find((x) => x.id === id);
        return (
          r && (
            <div key={id}>
              <strong>Library · {r.title}</strong>
              <small>Available when you start or schedule this lesson.</small>
              <SourceOpen resource={r} />
            </div>
          )
        );
      })}
      {step.resources
        .filter((r) => /^https:\/\//.test(r.url))
        .map((r) => (
          <div key={r.url}>
            <a href={r.url} target="_blank" rel="noreferrer">
              {r.title} ↗
            </a>
            <small>{r.reason}</small>
            <Button
              onClick={() => {
                const existing = data.resources.find((x) => x.url === r.url),
                  id = existing?.id || uid();
                save((d) => ({
                  ...d,
                  resources: existing
                    ? d.resources
                    : [
                        ...d.resources,
                        {
                          id,
                          title: r.title,
                          kind: "url",
                          url: r.url,
                          notes: r.reason || "",
                          tags: [],
                          highlights: [],
                          locations: [],
                          added: new Date().toISOString(),
                        },
                      ],
                  learningPlanner: d.learningPlanner.map((s) =>
                    s.id === step.id
                      ? {
                          ...s,
                          resourceIds: [
                            ...new Set([...(s.resourceIds || []), id]),
                          ],
                        }
                      : s,
                  ),
                }));
              }}
            >
              Save to library
            </Button>
          </div>
        ))}
      <div>
        <small>
          Find additional materials. These are search links, not verified
          recommendations.
        </small>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(step.searchQuery)}`}
          target="_blank"
          rel="noreferrer"
        >
          Find videos ↗
        </a>
        <a
          href={`https://www.google.com/search?tbm=bks&q=${encodeURIComponent(step.searchQuery)}`}
          target="_blank"
          rel="noreferrer"
        >
          Find books ↗
        </a>
      </div>
    </div>
  );
  const modules = [
    ...new Set((level?.steps || []).map((s) => s.moduleTitle ?? "")),
  ];
  return (
    <div className="growth-pathway">
      <header className="growth-pathway-hero">
        <div>
          <span className="eyebrow">GROWTH PLANNER</span>
          <h2>
            Big ambitions.
            <br />
            One lesson at a time.
          </h2>
          <p>
            A clear route from the foundations to what you want to become
            capable of. Choose a lesson. Give it your attention. Make it yours.
          </p>
          <Button
            primary
            onClick={() => {
              setBuilder(true);
              setError("");
            }}
          >
            <Plus size={17} /> New pathway
          </Button>
        </div>
        <div className="pathway-illustration" aria-hidden="true">
          <span>
            <Layers3 />
            Foundations
          </span>
          <i />
          <span>
            <BookOpen />
            Understanding
          </span>
          <i />
          <span>
            <ArrowUpRight />
            Application
          </span>
        </div>
      </header>
      {!goal && (
        <>
          <div className="section-head">
            <div>
              <span className="eyebrow">YOUR LEARNING ROUTES</span>
              <h2>Saved pathways</h2>
            </div>
          </div>
          <div className="pathway-library">
            {data.goals
              .filter((g) => allSteps.some((s) => s.goalId === g.id))
              .map((g) => {
                const items = allSteps.filter((s) => s.goalId === g.id),
                  complete = items.filter(
                    (s) => s.status === "completed",
                  ).length;
                return (
                  <button
                    className="pathway-library-card"
                    key={g.id}
                    onClick={() => select(g.id)}
                  >
                    <Layers3 size={24} />
                    <small>{horizons[g.level]} goal</small>
                    <h3>{g.title}</h3>
                    <p>
                      {items.length} lessons · {complete} completed
                    </p>
                    <progress value={complete} max={items.length} />
                    <span>
                      Open pathway <ArrowUpRight size={18} />
                    </span>
                  </button>
                );
              })}
          </div>
          {!allSteps.some((s) => s.goalId) && (
            <div className="pathway-empty">
              <Sprout size={38} />
              <h3>Your next chapter starts here.</h3>
              <p>
                Choose a goal when you’re ready. Your saved topics and lessons
                will live here, ready for your next session.
              </p>
              <Button onClick={() => setBuilder(true)}>
                Create your first pathway
              </Button>
            </div>
          )}
        </>
      )}
      {goal && (
        <>
          <div className="pathway-heading">
            <div>
              <button className="pathway-back" onClick={() => select("")}>
                ← All pathways
              </button>
              <h2>{goal.title}</h2>
              <p>
                {steps.filter((s) => s.status === "completed").length} of{" "}
                {steps.length} lessons completed · Study and Stretch can run in
                parallel
              </p>
            </div>
            {batches.length > 1 && (
              <Field label="Saved pathway">
                <select
                  value={batch}
                  onChange={(e) => {
                    setBatchId(e.target.value);
                    setActiveLevel("");
                    setLessonId("");
                  }}
                >
                  {batches.map((id, i) => (
                    <option value={id} key={id}>
                      Pathway {i + 1} ·{" "}
                      {goalSteps.find((s) => (s.pathwayId || "earlier") === id)
                        ?.levelTitle || "Earlier lessons"}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
          {!steps.length && !preview && (
            <div className="pathway-empty">
              <Target size={32} />
              <h3>Give this goal a learning route.</h3>
              <p>
                Build and save a curriculum, then choose a single lesson for
                today.
              </p>
              <Button primary onClick={() => setBuilder(true)}>
                Build pathway
              </Button>
            </div>
          )}
          {steps.length > 0 && (
            <div className="curriculum-layout">
              <aside className="curriculum-nav">
                <span className="eyebrow">YOUR CURRICULUM</span>
                <Field label="Find a lesson">
                  <input
                    placeholder="Search saved lessons…"
                    value={lessonSearch}
                    onChange={(e) => setLessonSearch(e.target.value)}
                  />
                </Field>
                {lessonSearch ? (
                  <div className="lesson-search-results">
                    {steps
                      .filter(
                        (s) =>
                          s.title
                            .toLowerCase()
                            .includes(lessonSearch.toLowerCase()) ||
                          (s.topics || []).some((t) =>
                            t
                              .toLowerCase()
                              .includes(lessonSearch.toLowerCase()),
                          ),
                      )
                      .map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setActiveLevel(levelKey(s));
                            setLessonId(s.id);
                            setLessonSearch("");
                          }}
                        >
                          {lessonName(s)}
                          <small>
                            Topic {(s.levelOrder || 0) + 1} · Subtopic{" "}
                            {(s.moduleOrder || 0) + 1}
                          </small>
                        </button>
                      ))}
                    {!steps.some((s) =>
                      (s.title + " " + (s.topics || []).join(" "))
                        .toLowerCase()
                        .includes(lessonSearch.toLowerCase()),
                    ) && <p>No matching lessons.</p>}
                  </div>
                ) : (
                  <nav aria-label="Curriculum topics">
                    {levels.map((l) => (
                      <button
                        key={l.key}
                        aria-current={level?.key === l.key ? "step" : undefined}
                        onClick={() => {
                          setActiveLevel(l.key);
                          setLessonId("");
                        }}
                      >
                        <span>Topic {l.order + 1}</span>
                        <strong>{l.title}</strong>
                        <small>
                          {
                            l.steps.filter((s) => s.status === "completed")
                              .length
                          }
                          /{l.steps.length} lessons <ChevronRight size={14} />
                        </small>
                      </button>
                    ))}
                  </nav>
                )}
              </aside>
              <section className="curriculum-content">
                <header className="curriculum-level">
                  <span className="eyebrow">
                    TOPIC {(level?.order || 0) + 1}
                  </span>
                  {level?.steps[0]?.stageTitle && (
                    <p>{level.steps[0].stageTitle}</p>
                  )}
                  <h2>{level?.title || `Topic ${(level?.order || 0) + 1}`}</h2>
                  <p>{level?.outcome}</p>
                </header>
                <section
                  className="lesson-directory"
                  key={level?.key}
                  aria-label="Subtopics"
                >
                  <h3>Subtopics</h3>
                  <p>Select a subtopic to see its lessons.</p>
                  {modules.map((module, mi) => (
                    <details className="subtopic-group" key={module}>
                      <summary>
                        Subtopic {mi + 1}
                        {module ? " — " + module : ""}
                        <small>
                          {
                            level.steps.filter(
                              (s) => (s.moduleTitle ?? "") === module,
                            ).length
                          }{" "}
                          lessons
                        </small>
                      </summary>
                      {level.steps
                        .filter((s) => (s.moduleTitle ?? "") === module)
                        .map((s, li) => (
                          <button
                            key={s.id}
                            aria-pressed={lesson?.id === s.id}
                            onClick={() => setLessonId(s.id)}
                          >
                            <span>
                              {s.status === "completed" ? (
                                <Check size={15} />
                              ) : (
                                <BookOpen size={15} />
                              )}
                            </span>
                            Lesson {li + 1}
                            {s.title ? " — " + s.title : ""}
                            <small>{s.duration} min focus</small>
                          </button>
                        ))}
                    </details>
                  ))}
                </section>
                {lesson && (
                  <article
                    className={`growth-step lesson-focus step-${lesson.type}`}
                  >
                    <header>
                      <span className="eyebrow">
                        Topic {(lesson.levelOrder || 0) + 1} → Subtopic{" "}
                        {(lesson.moduleOrder || 0) + 1} → Lesson{" "}
                        {(lesson.lessonOrder || 0) + 1}
                      </span>
                      <span className="lesson-status">{lesson.status}</span>
                    </header>
                    <h2>{lessonName(lesson)}</h2>
                    <p className="lesson-objective">{lesson.objective}</p>
                    <div className="lesson-meta">
                      <span>
                        <BookOpen size={16} />
                        {lesson.action}
                      </span>
                      <span>
                        <CalendarDays size={16} />
                        {lesson.duration} min focus
                      </span>
                    </div>
                    {lesson.prerequisite && (
                      <p className="lesson-prerequisite">
                        Suggested foundation: {lesson.prerequisite}
                      </p>
                    )}
                    {lesson.topics?.length > 0 && (
                      <section className="lesson-concepts">
                        <h3>
                          {lesson.type === "stretch"
                            ? "Questions to work through"
                            : "Concepts"}
                        </h3>
                        <ol>
                          {lesson.topics.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ol>
                      </section>
                    )}
                    <section className="lesson-evidence">
                      <span className="eyebrow">WHAT TO PRODUCE</span>
                      <p>{lesson.success}</p>
                    </section>
                    <details>
                      <summary>
                        Resources & references ·{" "}
                        {lesson.resourceIds.length + lesson.resources.length ||
                          "find materials"}
                      </summary>
                      {resourceLinks(lesson)}
                      <Field label="Resource for this lesson">
                        <select
                          value={
                            lesson.resourceId || lesson.resourceIds[0] || ""
                          }
                          onChange={(e) =>
                            store({
                              ...lesson,
                              resourceId: e.target.value,
                              resourceIds: [
                                ...new Set(
                                  [
                                    ...lesson.resourceIds,
                                    e.target.value,
                                  ].filter(Boolean),
                                ),
                              ],
                            })
                          }
                        >
                          <option value="">Choose from your library</option>
                          {data.resources.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </details>
                    <footer>
                      <Button primary onClick={() => onLaunch(lesson)}>
                        {lesson.type === "study" ? "Study now" : "Practise now"}
                      </Button>
                      <Button
                        onClick={() => {
                          setScheduling(lesson);
                          setScheduleDate(today());
                        }}
                      >
                        Add to Time planner
                      </Button>
                      <Button
                        onClick={() => {
                          setError("");
                          setGrowing(lesson);
                          setDestination({
                            areaId: goal.areaId || data.lifeAreas[0]?.id || "",
                            subAreaId: goal.subAreaId || "",
                            parentId: "",
                          });
                        }}
                      >
                        Grow in ecosystem
                      </Button>
                      {lesson.type === "study" && (
                        <Button onClick={() => practice(lesson)}>
                          Create Stretch
                        </Button>
                      )}
                      <Button onClick={() => setEditing(lesson)}>
                        Edit lesson
                      </Button>
                      {lesson.curriculumLesson && (
                        <Button
                          onClick={() =>
                            store({
                              ...lesson,
                              lessonCompletedAt: lesson.lessonCompletedAt
                                ? null
                                : new Date().toISOString(),
                              status: lesson.lessonCompletedAt
                                ? "planned"
                                : "completed",
                            })
                          }
                        >
                          {lesson.lessonCompletedAt
                            ? "Reopen lesson"
                            : "Mark lesson complete"}
                        </Button>
                      )}
                    </footer>
                    {lesson.conceptId && (
                      <button
                        className="pathway-back"
                        onClick={() => onKnowledge?.(lesson.conceptId)}
                      >
                        Open connected knowledge →
                      </button>
                    )}
                  </article>
                )}
              </section>
            </div>
          )}
        </>
      )}
      {preview && (
        <Modal title="Review your curriculum" onClose={() => setPreview(null)}>
          <div className="curriculum-preview">
            <p>{preview.summary}</p>
            <strong>
              {levelsFor(preview.steps).length} topics · {preview.steps.length}{" "}
              lessons
            </strong>
            {levelsFor(preview.steps).map((l) => (
              <details key={l.key}>
                <summary>
                  Topic {l.order + 1} · {l.title}
                  <small>{l.steps.length} lessons</small>
                </summary>
                <p>{l.outcome}</p>
                {[...new Set(l.steps.map((s) => s.moduleTitle ?? ""))].map(
                  (m) => (
                    <div key={m}>
                      <h4>
                        Subtopic{" "}
                        {l.steps.find((s) => s.moduleTitle === m)?.moduleOrder +
                          1 || 1}
                        {m ? " — " + m : ""}
                      </h4>
                      <ul>
                        {l.steps
                          .filter((s) => (s.moduleTitle ?? "") === m)
                          .map((s, i) => (
                            <li key={i}>
                              Lesson {(s.lessonOrder || 0) + 1}
                              {s.title ? " — " + s.title : ""}
                            </li>
                          ))}
                      </ul>
                    </div>
                  ),
                )}
              </details>
            ))}
            <Button
              primary
              onClick={() => {
                const target = data.goals.find((g) => g.id === preview.goalId);
                if (!target) return;
                save((d) => acceptPathway(d, target, preview));
                setBatchId("");
                setActiveLevel("");
                setLessonId("");
                setPreview(null);
              }}
            >
              Save pathway
            </Button>
          </div>
        </Modal>
      )}
      {builder && (
        <Modal
          title="Build a learning pathway"
          onClose={() => {
            request.current?.abort();
            setBuilder(false);
          }}
        >
          <div className="pathway-builder">
            <p>
              Choose a goal here. Your main workspace stays focused on saved
              lessons.
            </p>
            <div className="form-grid">
              <Field label="Goal horizon">
                <select
                  disabled={busy}
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                >
                  <option value="">All horizons</option>
                  {Object.entries(horizons).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Life area">
                <select
                  disabled={busy}
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    setSub("");
                  }}
                >
                  <option value="">All life areas</option>
                  {data.lifeAreas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sub-life area">
                <select
                  disabled={!area || busy}
                  value={sub}
                  onChange={(e) => setSub(e.target.value)}
                >
                  <option value="">All sub-areas</option>
                  {data.lifeAreas
                    .find((a) => a.id === area)
                    ?.subAreas.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
            <Field label="Find a goal">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your goals…"
              />
            </Field>
            <div className="growth-goal-options">
              {visible.map((g) => (
                <button
                  disabled={busy}
                  key={g.id}
                  aria-pressed={g.id === goalId}
                  onClick={() => select(g.id)}
                >
                  <small>{horizons[g.level]}</small>
                  <strong>{g.title}</strong>
                </button>
              ))}
            </div>
            {!visible.length && (
              <p>
                No matching goals. Change your filters or create one in Goals.
              </p>
            )}
            {goal && (
              <>
                <Field label="Pathway approach">
                  <select
                    disabled={busy}
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="auto">
                      {matchesEnergyGoal(goal)
                        ? "Energy curriculum · foundations to strategy"
                        : "Starting scaffold · workspace knowledge and gaps"}
                    </option>
                    <option value="custom">Use my own curriculum</option>
                  </select>
                </Field>
                {mode === "custom" ? (
                  <Field label="Curriculum outline">
                    <textarea
                      rows={9}
                      value={outline}
                      onChange={(e) => setOutline(e.target.value)}
                      placeholder={
                        "# Foundations\n## Core ideas\nEnergy, work and power\nEnergy conversion\n# Application\nMap an energy company"
                      }
                    />
                    <small>
                      Use # for a topic, ## for a subtopic, and one lesson per
                      line.
                    </small>
                  </Field>
                ) : (
                  <Field label="Learning context (optional)">
                    <textarea
                      disabled={busy}
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Your starting point or focus for a starting scaffold / Gemini draft. The supplied energy curriculum keeps its full scope."
                    />
                  </Field>
                )}
                <Button primary disabled={busy} onClick={build}>
                  Build my pathway
                </Button>
                <details className="optional-generation">
                  <summary>Optional Gemini draft</summary>
                  <p>
                    A separate AI draft requires a configured server key. Review
                    its scope before saving; existing pathways stay intact.
                  </p>
                  <Button disabled={busy} onClick={generate}>
                    {busy ? "Building draft…" : "Enhance with Gemini"}
                  </Button>
                </details>
              </>
            )}
            {error && <p role="alert">{error}</p>}
          </div>
        </Modal>
      )}
      {editing && (
        <Modal title="Edit lesson" onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              store({
                ...editing,
                topics: (editing.topics || [])
                  .map((t) => t.trim())
                  .filter(Boolean),
              });
              setEditing(null);
            }}
          >
            <Field label="Lesson title">
              <input
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </Field>
            <Field label="Lesson objective">
              <textarea
                required
                value={editing.objective}
                onChange={(e) =>
                  setEditing({ ...editing, objective: e.target.value })
                }
              />
            </Field>
            <Field label="Concepts or questions (one per line)">
              <textarea
                rows={6}
                value={(editing.topics || []).join("\n")}
                onChange={(e) =>
                  setEditing({ ...editing, topics: e.target.value.split("\n") })
                }
              />
            </Field>
            <Field label="Success evidence">
              <textarea
                value={editing.success}
                onChange={(e) =>
                  setEditing({ ...editing, success: e.target.value })
                }
              />
            </Field>
            <Field label="Study action">
              <select
                value={editing.action}
                onChange={(e) =>
                  setEditing({ ...editing, action: e.target.value })
                }
              >
                {(editing.type === "study" ? studyActions : ["Apply"]).map(
                  (a) => (
                    <option key={a}>{a}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Focus minutes">
              <input
                required
                type="number"
                min="5"
                max="180"
                value={editing.duration}
                onChange={(e) =>
                  setEditing({ ...editing, duration: Number(e.target.value) })
                }
              />
            </Field>
            <Button primary type="submit">
              Save lesson
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Remove this lesson from the pathway? Saved sessions and ecosystem knowledge will be kept.",
                  )
                ) {
                  save((d) => ({
                    ...d,
                    learningPlanner: d.learningPlanner.filter(
                      (s) => s.id !== editing.id,
                    ),
                  }));
                  setEditing(null);
                }
              }}
            >
              Remove lesson
            </Button>
          </form>
        </Modal>
      )}
      {scheduling && (
        <Modal title="Schedule lesson" onClose={() => setScheduling(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSchedule(scheduling, scheduleDate);
              setScheduling(null);
            }}
          >
            <h3>{lessonName(scheduling)}</h3>
            <Field label="Schedule date">
              <input
                required
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </Field>
            <p>
              Choose a focus block for this lesson. You can return for further
              sessions.
            </p>
            <Button primary type="submit">
              Choose time and details
            </Button>
          </form>
        </Modal>
      )}
      {growing && (
        <Modal
          title="Grow this lesson in your ecosystem"
          onClose={() => setGrowing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const result = growLesson(data, growing, destination);
                save(result.data);
                setGrowing(null);
                onKnowledge?.(result.id);
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <h3>{lessonName(growing)}</h3>
            <p>
              Save this lesson as a branch with its concepts as leaves. Existing
              knowledge stays intact. Repeating this action opens the same
              branch.
            </p>
            <Field label="Destination forest">
              <select
                required
                value={destination.areaId}
                onChange={(e) =>
                  setDestination({
                    areaId: e.target.value,
                    subAreaId: "",
                    parentId: "",
                  })
                }
              >
                {data.lifeAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Destination grove">
              <select
                value={destination.subAreaId}
                onChange={(e) =>
                  setDestination({
                    ...destination,
                    subAreaId: e.target.value,
                    parentId: "",
                  })
                }
              >
                <option value="">Forest level</option>
                {data.lifeAreas
                  .find((a) => a.id === destination.areaId)
                  ?.subAreas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Grow beneath">
              <select
                value={destination.parentId}
                onChange={(e) =>
                  setDestination({ ...destination, parentId: e.target.value })
                }
              >
                <option value="">Create or reuse this pathway’s tree</option>
                {knowledge
                  .filter(
                    (n) =>
                      !isScaffold(n) &&
                      !isScopeNode(n) &&
                      !["fruit", "seed"].includes(n.kind) &&
                      n.areaId === destination.areaId &&
                      (n.subAreaId || "") === destination.subAreaId,
                  )
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
              </select>
            </Field>
            {error && <p role="alert">{error}</p>}
            <Button primary type="submit">
              Save to ecosystem
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
