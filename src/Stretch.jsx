import React, { useState, useEffect, useMemo } from "react";
import { Button, Modal, Field, GoalTrail } from "./App";
import { CapacityPicker } from "./Barns.jsx";
import { CAPACITIES } from "./barns.js";
import { uid, today } from "./model";
import "./stretch.css";
import StretchRefiner from "./StretchRefiner.jsx";
import StretchSuggestions from "./StretchSuggestions";
import {
  practiceNodes,
  PRACTICE_ENVIRONMENTS,
  STRETCH_SOURCES,
  nextPracticeDate,
} from "./stretch-engine";
import { knowledgeLabel, knowledgeEntries } from "./knowledge-tree";
import StretchPlayer from "./StretchPlayer";
import {
  ENVIRONMENTS,
  finishPracticeRecord,
  practiceElapsed,
} from "./stretch-practice";
import {
  ArrowUpRight,
  Compass,
  Play,
  Sprout,
  RotateCcw,
  Trophy,
} from "lucide-react";

export default function Stretch({
  data,
  save,
  go,
  draft,
  consumeDraft,
  onStudy,
}) {
  const [editor, setEditor] = useState(null),
    [finishing, setFinishing] = useState(false),
    [areaId, setArea] = useState(""),
    [subAreaId, setSub] = useState(""),
    [goalId, setGoal] = useState(""),
    [status, setStatus] = useState("all");
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [view, setView] = useState("practice"),
    [playing, setPlaying] = useState(null),
    [recordQuery, setRecordQuery] = useState("");
  const [comparison, setComparison] = useState(null);
  const knowledge = useMemo(() => practiceNodes(data), [data]);
  const allKnowledge = useMemo(() => knowledgeEntries(data), [data]);
  const records = data.stretches || [];
  const area = data.lifeAreas.find((a) => a.id === areaId);
  const filtered = records.filter(
    (s) =>
      (!areaId || s.areaId === areaId) &&
      (!subAreaId || s.subAreaId === subAreaId) &&
      (!goalId || s.goalId === goalId) &&
      (status === "all" || s.status === status) &&
      (view === "history"
        ? s.status === "completed"
        : s.status !== "completed") &&
      `${s.title} ${s.objective}`
        .toLowerCase()
        .includes(recordQuery.toLowerCase()),
  );
  const store = (s) =>
    save((d) => ({
      ...d,
      stretches: [...(d.stretches || []).filter((x) => x.id !== s.id), s],
    }));
  const create = (defaults = {}) => {
    const linkedGoal = data.goals.find((g) => g.id === goalId);
    setFinishing(false);
    setKnowledgeQuery("");
    setEditor({
      id: uid(),
      title: "",
      objective: "",
      success: "",
      goalId: goalId || "",
      areaId: linkedGoal?.areaId || areaId || "",
      subAreaId: subAreaId || linkedGoal?.subAreaId || "",
      capacityIds: linkedGoal?.capacityIds || [],
      date: today(),
      planned: 30,
      status: "planned",
      actualMinutes: 0,
      completion: 100,
      outcome: "",
      nextStep: "",
      source: "user",
      environment: "internal",
      challenge: 1,
      knowledgeIds: [],
      repeat: "once",
      studyGap: "",
      gapResolved: false,
      evidence: "",
      harvest: "",
      ...defaults,
    });
  };
  useEffect(() => {
    if (draft) {
      create(draft);
      consumeDraft?.();
    }
  }, [draft]);
  const chooseGoal = (id) => {
    const g = data.goals.find((g) => g.id === id);
    let p = g,
      ids = new Set(),
      seen = new Set();
    while (p && !seen.has(p.id)) {
      seen.add(p.id);
      p.capacityIds?.forEach((id) => ids.add(id));
      p = data.goals.find((g) => g.id === p.parent);
    }
    setEditor({
      ...editor,
      goalId: id,
      areaId: g?.areaId || editor.areaId || "",
      subAreaId: g?.subAreaId || editor.subAreaId || "",
      capacityIds: [...new Set([...editor.capacityIds, ...ids])],
    });
  };
  const activeRecord = records.find((s) => s.id === playing);
  const completed = records.filter((s) => s.status === "completed");
  const unresolved = completed.filter(
    (s) => s.studyGap?.trim() && !s.gapResolved,
  );
  const begin = (s) => {
    store({
      ...s,
      status: "active",
      startedAt: s.startedAt || new Date().toISOString(),
      practiceStartedAt: s.practiceStartedAt || new Date().toISOString(),
    });
    setPlaying(s.id);
  };
  return (
    <div className="stretch-workspace">
      {activeRecord && (
        <StretchPlayer
          record={activeRecord}
          store={store}
          close={() => setPlaying(null)}
          finish={(s) => {
            setEditor(s);
            setFinishing(true);
          }}
          onStudy={onStudy}
          knowledge={knowledge}
        />
      )}
      {!activeRecord && (
        <>
          <section className="card stretch-intro">
            <div className="stretch-hero-copy">
              <span className="eyebrow">PUT YOUR ABILITIES TO WORK</span>
              <h2>
                Turn understanding
                <br />
                into ability.
              </h2>
              <p>
                Exercise knowledge through internal rehearsal, simulations,
                social practice and real-world situations. Start small and
                increase the challenge as you learn. No study completion or
                ripeness score is required.
              </p>
              <Button primary onClick={() => create()}>
                Plan a stretch
              </Button>
              <Button onClick={() => setView("discover")}>
                Find an opportunity <ArrowUpRight size={16} />
              </Button>
            </div>
            <div
              className="stretch-hero-path"
              aria-label="Four freely selectable practice environments"
            >
              {Object.entries(ENVIRONMENTS).map(([id, env], i) => (
                <button
                  key={id}
                  onClick={() => create({ environment: id })}
                  style={{ "--environment-color": env.color }}
                >
                  <span>0{i + 1}</span>
                  <strong>{env.title}</strong>
                  <small>{env.subtitle}</small>
                  <ArrowUpRight size={17} />
                </button>
              ))}
              <p>Begin anywhere. Increase the challenge as you grow.</p>
            </div>
            <div className="stretch-stats">
              <span>
                <strong>
                  {records.filter((s) => s.status === "completed").length}
                </strong>{" "}
                practices recorded
              </span>
              <span>
                <strong>
                  {records.filter((s) => s.status === "active").length}
                </strong>{" "}
                in progress
              </span>
              <span>
                <strong>
                  {records
                    .filter((s) => s.status === "completed")
                    .reduce((n, s) => n + s.actualMinutes, 0)}
                </strong>{" "}
                minutes of doing
              </span>
              <span>
                <strong>{unresolved.length}</strong>questions for Study
              </span>
            </div>
          </section>
          <div className="stretch-workspace-nav" aria-label="Stretch sections">
            {[
              ["practice", "My practice", Play],
              ["discover", "Discover", Compass],
              ["history", "Attempt history", RotateCcw],
              ["harvest", "Harvest", Trophy],
            ].map(([id, label, Icon]) => (
              <button
                key={id}
                aria-pressed={view === id}
                onClick={() => setView(id)}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
          {view === "discover" && (
            <StretchSuggestions data={data} create={create} />
          )}
          {view === "harvest" && (
            <section className="stretch-harvest">
              <div className="stretch-section-heading">
                <div>
                  <span className="eyebrow">WHAT YOUR PRACTICE PRODUCED</span>
                  <h2>Harvest your results.</h2>
                  <p>
                    Outcomes, evidence and new questions—kept with the attempt
                    that produced them.
                  </p>
                </div>
                <Button onClick={() => go("Barns")}>
                  View Barns <ArrowUpRight size={16} />
                </Button>
              </div>
              {!completed.length && (
                <div className="card stretch-empty">
                  <Sprout size={36} />
                  <h3>Your first result belongs here.</h3>
                  <p>
                    Complete an attempt and record what happened. Small results
                    and unsuccessful attempts count as learning evidence.
                  </p>
                  <Button onClick={() => setView("practice")}>
                    Go to practice
                  </Button>
                </div>
              )}
              <div className="stretch-harvest-grid">
                {completed.map((s) => (
                  <article className="card stretch-harvest-card" key={s.id}>
                    <small>
                      {s.date} ·{" "}
                      {PRACTICE_ENVIRONMENTS[s.environment] || "Practice"}
                    </small>
                    <h3>{s.title}</h3>
                    <h4>Result</h4>
                    <p>{s.harvest || s.outcome}</p>
                    {s.evidence && (
                      <>
                        <h4>Evidence / feedback</h4>
                        <p>{s.evidence}</p>
                      </>
                    )}
                    {s.studyGap && (
                      <div className="stretch-study-gap">
                        <h4>
                          {s.gapResolved
                            ? "Study gap addressed"
                            : "Return to Study"}
                        </h4>
                        <p>{s.studyGap}</p>
                        {(s.knowledgeIds || [])
                          .filter((id) => knowledge.some((n) => n.id === id))
                          .map((id) => (
                            <Button key={id} onClick={() => onStudy(id)}>
                              {knowledge.find((n) => n.id === id)?.title}
                            </Button>
                          ))}
                        <Button
                          onClick={() =>
                            store({ ...s, gapResolved: !s.gapResolved })
                          }
                        >
                          {s.gapResolved ? "Reopen gap" : "Mark gap addressed"}
                        </Button>
                      </div>
                    )}
                    <Button
                      onClick={() => {
                        setEditor(s);
                        setFinishing(true);
                      }}
                    >
                      Edit result
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          )}
          {["practice", "history"].includes(view) && (
            <>
              <div className="stretch-section-heading">
                <div>
                  <h2>
                    {view === "history"
                      ? "Every attempt tells a story."
                      : "Make your next move."}
                  </h2>
                  <p>
                    {view === "history"
                      ? "Review your progress, then repeat or raise the challenge."
                      : "Start or resume a practice. Your responses are saved as you go."}
                  </p>
                </div>
                <Field label="Search practices">
                  <input
                    value={recordQuery}
                    onChange={(e) => setRecordQuery(e.target.value)}
                    placeholder="Search your activities…"
                  />
                </Field>
              </div>
              <details className="stretch-record-filters">
                <summary>Narrow by life area, goal or status</summary>
                <section className="card stretch-filters">
                  <Field label="Stretch life area">
                    <select
                      value={areaId}
                      onChange={(e) => {
                        setArea(e.target.value);
                        setSub("");
                        setGoal("");
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
                  <Field label="Stretch sub-area">
                    <select
                      disabled={!area}
                      value={subAreaId}
                      onChange={(e) => {
                        setSub(e.target.value);
                        setGoal("");
                      }}
                    >
                      <option value="">All sub-areas</option>
                      {area?.subAreas.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Stretch goal">
                    <select
                      value={goalId}
                      onChange={(e) => setGoal(e.target.value)}
                    >
                      <option value="">All goals</option>
                      {data.goals
                        .filter(
                          (g) =>
                            (!areaId || g.areaId === areaId) &&
                            (!subAreaId || g.subAreaId === subAreaId),
                        )
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.title}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Stretch status">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="all">All activities</option>
                      <option value="planned">Planned</option>
                      <option value="active">In progress</option>
                      <option value="completed">Recorded</option>
                    </select>
                  </Field>
                </section>
              </details>
              <div className="stretch-list">
                {[...filtered]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((s) => (
                    <article className="card stretch-record" key={s.id}>
                      <small>
                        {s.date} ·{" "}
                        {s.status === "completed"
                          ? "Recorded"
                          : s.status === "active"
                            ? "In progress"
                            : "Planned"}
                      </small>
                      <h3>{s.title}</h3>
                      <small>
                        {PRACTICE_ENVIRONMENTS[s.environment] ||
                          "Environment not recorded"}{" "}
                        · {STRETCH_SOURCES[s.source] || "User-created"} ·
                        Challenge {s.challenge || 1}
                        {s.repeat && s.repeat !== "once"
                          ? ` · Repeats ${s.repeat}`
                          : ""}
                      </small>
                      <p>{s.objective}</p>
                      {!!s.knowledgeIds?.length && (
                        <div className="stretch-knowledge-links">
                          {s.knowledgeIds.map((id) => {
                            const node = allKnowledge.find((n) => n.id === id);
                            return (
                              <Button
                                key={id}
                                disabled={!knowledge.some((n) => n.id === id)}
                                onClick={() => onStudy?.(id)}
                              >
                                Study: {node?.title || "Unavailable knowledge"}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                      <small>
                        {data.lifeAreas.find((a) => a.id === s.areaId)?.name}
                        {s.subAreaId
                          ? " / " +
                            data.lifeAreas
                              .find((a) => a.id === s.areaId)
                              ?.subAreas.find((x) => x.id === s.subAreaId)?.name
                          : ""}
                      </small>
                      <GoalTrail id={s.goalId} goals={data.goals} />
                      <div className="stretch-tags">
                        {s.capacityIds.map((id) => (
                          <span key={id}>
                            {CAPACITIES.find((c) => c.id === id)?.name}
                          </span>
                        ))}
                      </div>
                      <p>
                        <strong>Success looks like:</strong> {s.success}
                      </p>
                      {s.status === "completed" ? (
                        <>
                          <p>
                            <strong>
                              {s.completion}% completed · {s.actualMinutes}{" "}
                              minutes
                            </strong>
                          </p>
                          <p>{s.outcome}</p>
                          {s.harvest && (
                            <p>
                              <strong>Harvest · What it produced:</strong>{" "}
                              {s.harvest}
                            </p>
                          )}
                          {s.evidence && (
                            <p>
                              <strong>Evidence / feedback:</strong> {s.evidence}
                            </p>
                          )}
                          {s.studyGap && (
                            <p>
                              <strong>
                                {s.gapResolved
                                  ? "Reviewed study gap:"
                                  : "Back to Study:"}
                              </strong>{" "}
                              {s.studyGap}
                            </p>
                          )}
                          {s.nextStep && <p>Next stretch: {s.nextStep}</p>}
                          {s.previousStretchId &&
                            records.some(
                              (r) => r.id === s.previousStretchId,
                            ) && (
                              <Button onClick={() => setComparison(s.id)}>
                                Compare with previous attempt
                              </Button>
                            )}
                          <Button
                            onClick={() => {
                              if (
                                records.some(
                                  (r) =>
                                    r.previousStretchId === s.id &&
                                    r.status !== "completed",
                                )
                              ) {
                                setView("practice");
                                setRecordQuery(s.title);
                                return;
                              }
                              create({
                                ...s,
                                id: uid(),
                                status: "planned",
                                date:
                                  s.repeat === "once" || !s.repeat
                                    ? today()
                                    : nextPracticeDate(s.date, s.repeat),
                                actualMinutes: 0,
                                completedAt: null,
                                startedAt: null,
                                outcome: "",
                                harvest: "",
                                evidence: "",
                                studyGap: "",
                                gapResolved: false,
                                previousStretchId: s.id,
                                completion: 100,
                                practiceResponses: {},
                                rubric: {},
                                practiceMs: 0,
                                practiceStartedAt: null,
                              });
                            }}
                          >
                            {records.some(
                              (r) =>
                                r.previousStretchId === s.id &&
                                r.status !== "completed",
                            )
                              ? "View next attempt"
                              : "Plan next attempt"}
                          </Button>
                          <Button
                            onClick={() =>
                              create({
                                ...s,
                                id: uid(),
                                previousStretchId: s.id,
                                status: "planned",
                                date: today(),
                                completion: 100,
                                repeat: "once",
                                challenge: Math.min(4, (s.challenge || 1) + 1),
                                objective: `${s.objective}\nNext challenge: add a new constraint, reduce support or combine a related skill.`,
                                actualMinutes: 0,
                                outcome: "",
                                harvest: "",
                                evidence: "",
                                studyGap: "",
                                gapResolved: false,
                                practiceResponses: {},
                                rubric: {},
                                practiceMs: 0,
                                practiceStartedAt: null,
                                completedAt: null,
                                startedAt: null,
                              })
                            }
                          >
                            Raise the challenge
                          </Button>
                          {s.practiceResponses && (
                            <details>
                              <summary>View practice responses</summary>
                              {Object.entries(s.practiceResponses).map(
                                ([key, value]) => (
                                  <p key={key}>{value}</p>
                                ),
                              )}
                              {Object.entries(s.rubric || {}).map(
                                ([label, value]) => (
                                  <p key={label}>
                                    <strong>{label}:</strong> {value}
                                  </p>
                                ),
                              )}
                            </details>
                          )}
                          <Button
                            onClick={() => {
                              setEditor({ ...s });
                              setFinishing(true);
                            }}
                          >
                            Edit result
                          </Button>
                        </>
                      ) : (
                        <>
                          <p>{s.planned} planned minutes</p>
                          <Button primary onClick={() => begin(s)}>
                            {s.status === "active"
                              ? "Resume practice"
                              : "Start stretch"}
                          </Button>
                          <Button
                            onClick={() => {
                              const paused = s.practiceStartedAt
                                ? {
                                    ...s,
                                    practiceMs: practiceElapsed(s),
                                    practiceStartedAt: null,
                                    actualMinutes: Math.min(
                                      1440,
                                      Math.round(practiceElapsed(s) / 60000),
                                    ),
                                  }
                                : { ...s };
                              store(paused);
                              setEditor(paused);
                              setFinishing(true);
                            }}
                          >
                            Record result
                          </Button>
                          <Button
                            onClick={() => {
                              setEditor({ ...s });
                              setFinishing(false);
                            }}
                          >
                            Edit activity
                          </Button>
                        </>
                      )}
                    </article>
                  ))}
              </div>
              {!filtered.length && (
                <section className="card stretch-intro">
                  <h3>Make room for practical growth.</h3>
                  <p>
                    No activities match this view. Plan a stretch and connect it
                    to a goal and the capacities you want to practise.
                  </p>
                </section>
              )}
            </>
          )}
        </>
      )}
      {comparison &&
        (() => {
          const current = records.find((r) => r.id === comparison),
            previous = records.find((r) => r.id === current?.previousStretchId);
          return current && previous ? (
            <Modal
              title="Compare practice attempts"
              onClose={() => setComparison(null)}
            >
              <div className="stretch-comparison">
                <h3>{current.title}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Evidence</th>
                      <th>Previous · {previous.date}</th>
                      <th>This attempt · {current.date}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "Environment",
                        (r) =>
                          PRACTICE_ENVIRONMENTS[r.environment] ||
                          "Not recorded",
                      ],
                      ["Challenge", (r) => r.challenge || 1],
                      ["Completion", (r) => `${r.completion}%`],
                      ["Practice time", (r) => `${r.actualMinutes} min`],
                      ...[
                        "Accuracy",
                        "Independence",
                        "Adaptability",
                        "Useful outcome",
                      ].map((label) => [
                        label,
                        (r) => r.rubric?.[label] || "Not assessed",
                      ]),
                      [
                        "Harvest",
                        (r) => r.harvest || r.outcome || "Not recorded",
                      ],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <th>{label}</th>
                        <td>{value(previous)}</td>
                        <td>{value(current)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>
                  These observations describe individual attempts. Use them to
                  decide whether to repeat, change the environment or increase
                  the challenge.
                </p>
              </div>
            </Modal>
          ) : null;
        })()}
      {editor && (
        <Modal
          title={
            finishing ? "Record your stretch result" : "Shape your stretch"
          }
          onClose={() => setEditor(null)}
        >
          <form
            className="stretch-editor"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !editor.title.trim() ||
                !editor.objective.trim() ||
                !editor.success.trim() ||
                (finishing && !editor.outcome.trim())
              )
                return;
              const result = {
                ...editor,
                status: finishing ? "completed" : editor.status,
                ...(finishing
                  ? {
                      completedAt:
                        editor.completedAt || new Date().toISOString(),
                    }
                  : {}),
              };
              if (finishing) save((d) => finishPracticeRecord(d, result));
              else store(result);
              setEditor(null);
              setPlaying(null);
              setView(finishing ? "harvest" : "practice");
            }}
          >
            <details open={!finishing} className="stretch-plan-details">
              <summary>Practice plan · purpose and success</summary>
              <Field label="Practical activity">
                <input
                  required
                  value={editor.title}
                  onChange={(e) =>
                    setEditor({ ...editor, title: e.target.value })
                  }
                  placeholder="Lead a ten-minute team discussion"
                />
              </Field>
              <Field label="What ability will you use or stretch?">
                <textarea
                  required
                  value={editor.objective}
                  onChange={(e) =>
                    setEditor({ ...editor, objective: e.target.value })
                  }
                />
              </Field>
              <Field label="What will successful practice look like?">
                <textarea
                  required
                  value={editor.success}
                  onChange={(e) =>
                    setEditor({ ...editor, success: e.target.value })
                  }
                  placeholder="Everyone contributes; we agree on one action and its owner."
                />
              </Field>
              {!finishing && (
                <StretchRefiner
                  key={editor.id}
                  draft={editor}
                  onApply={(suggestion) =>
                    setEditor((current) => ({ ...current, ...suggestion }))
                  }
                />
              )}
              <details className="stretch-plan-details">
                <summary>Connections, environment & schedule</summary>
                <Field label="Linked goal">
                  <select
                    aria-label="Linked goal"
                    value={editor.goalId}
                    onChange={(e) => chooseGoal(e.target.value)}
                  >
                    <option value="">No linked goal yet</option>
                    {data.goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {data.lifeAreas.find((a) => a.id === g.areaId)?.name} ·{" "}
                        {g.level} · {g.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Practice life area">
                  <select
                    value={editor.areaId}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        areaId: e.target.value,
                        subAreaId: "",
                      })
                    }
                  >
                    <option value="">Choose a life area</option>
                    {data.lifeAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="form-grid">
                  <Field label="Practice environment">
                    <select
                      value={editor.environment || "internal"}
                      onChange={(e) =>
                        setEditor({ ...editor, environment: e.target.value })
                      }
                    >
                      {Object.entries(PRACTICE_ENVIRONMENTS).map(
                        ([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Field label="Stretch origin">
                    <select
                      value={editor.source || "user"}
                      onChange={(e) =>
                        setEditor({ ...editor, source: e.target.value })
                      }
                    >
                      {Object.entries(STRETCH_SOURCES).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Practice challenge">
                    <select
                      value={editor.challenge || 1}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          challenge: Number(e.target.value),
                        })
                      }
                    >
                      <option value={1}>1 · Supported attempt</option>
                      <option value={2}>2 · Independent repetition</option>
                      <option value={3}>3 · New constraints</option>
                      <option value={4}>4 · Integrated complexity</option>
                    </select>
                  </Field>
                  <Field label="Repeat practice">
                    <select
                      value={editor.repeat || "once"}
                      onChange={(e) =>
                        setEditor({ ...editor, repeat: e.target.value })
                      }
                    >
                      <option value="once">One time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly on the chosen day</option>
                    </select>
                  </Field>
                </div>
                <p className="muted">
                  Environments and challenges are freely selectable. Daily and
                  weekly practices automatically create their next dated attempt
                  when you save a result.
                </p>
                {editor.source === "life" && (
                  <Field label="Life opportunity">
                    <textarea
                      value={editor.opportunity || ""}
                      onChange={(e) =>
                        setEditor({ ...editor, opportunity: e.target.value })
                      }
                    />
                  </Field>
                )}
                <fieldset className="stretch-linked-knowledge">
                  <legend>Knowledge you will exercise</legend>
                  <Field label="Search knowledge to link">
                    <input
                      value={knowledgeQuery}
                      onChange={(e) => setKnowledgeQuery(e.target.value)}
                      placeholder="Type a concept, forest, grove or tree"
                    />
                  </Field>
                  <Field label="Add linked knowledge">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value)
                          setEditor({
                            ...editor,
                            knowledgeIds: [
                              ...new Set([
                                ...(editor.knowledgeIds || []),
                                e.target.value,
                              ]),
                            ],
                          });
                      }}
                    >
                      <option value="">Select a source to link</option>
                      {knowledge
                        .filter(
                          (n) =>
                            !(editor.knowledgeIds || []).includes(n.id) &&
                            n.title
                              .toLowerCase()
                              .includes(knowledgeQuery.toLowerCase()),
                        )
                        .slice(0, 40)
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            {knowledgeLabel(n, data.concepts)} · {n.title}
                          </option>
                        ))}
                    </select>
                  </Field>
                  {(editor.knowledgeIds || []).map((id) => (
                    <div key={id}>
                      {allKnowledge.find((n) => n.id === id)?.title ||
                        "Unavailable knowledge"}{" "}
                      <Button
                        onClick={() =>
                          setEditor({
                            ...editor,
                            knowledgeIds: editor.knowledgeIds.filter(
                              (x) => x !== id,
                            ),
                          })
                        }
                      >
                        Remove link
                      </Button>
                    </div>
                  ))}
                </fieldset>
                <Field label="Practice sub-area">
                  <select
                    value={editor.subAreaId}
                    onChange={(e) =>
                      setEditor({ ...editor, subAreaId: e.target.value })
                    }
                  >
                    <option value="">Whole life area</option>
                    {data.lifeAreas
                      .find((a) => a.id === editor.areaId)
                      ?.subAreas.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <CapacityPicker
                  value={editor.capacityIds}
                  onChange={(capacityIds) =>
                    setEditor({ ...editor, capacityIds })
                  }
                />
                <p className="muted">
                  Link capacities to count recorded practice toward their Barns.
                  You can also begin without a capacity or goal and link them
                  later.
                </p>
                <div className="form-grid">
                  <Field label="Practice date">
                    <input
                      type="date"
                      required
                      value={editor.date}
                      onChange={(e) =>
                        setEditor({ ...editor, date: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Planned practice minutes">
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      required
                      value={editor.planned}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          planned: Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                </div>
              </details>
            </details>
            {finishing && (
              <>
                <div className="stretch-result-heading">
                  <span className="eyebrow">REVIEW & HARVEST</span>
                  <h3>{editor.title}</h3>
                  <p>
                    Capture the attempt, its result and what it teaches you
                    next.
                  </p>
                </div>
                <Field label="Actual practice minutes">
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    required
                    value={editor.actualMinutes}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        actualMinutes: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="How much of the planned activity did you complete? (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={editor.completion}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        completion: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="What did you do, and what happened?">
                  <textarea
                    required
                    value={editor.outcome}
                    onChange={(e) =>
                      setEditor({ ...editor, outcome: e.target.value })
                    }
                  />
                </Field>
                <Field label="What will you practise next?">
                  <textarea
                    value={editor.nextStep}
                    onChange={(e) =>
                      setEditor({ ...editor, nextStep: e.target.value })
                    }
                  />
                </Field>
                <Field label="Harvest · What did this practice produce?">
                  <textarea
                    value={editor.harvest || ""}
                    onChange={(e) =>
                      setEditor({ ...editor, harvest: e.target.value })
                    }
                    placeholder="An outcome, useful result, decision, artifact or change—not just time spent."
                  />
                </Field>
                <Field label="Evidence, feedback or result references">
                  <textarea
                    value={editor.evidence || ""}
                    onChange={(e) =>
                      setEditor({ ...editor, evidence: e.target.value })
                    }
                    placeholder="Observations, peer feedback, measurements, or a link to your work"
                  />
                </Field>
                <Field label="What do you need to return to Study to understand?">
                  <textarea
                    value={editor.studyGap || ""}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        studyGap: e.target.value,
                        gapResolved: false,
                      })
                    }
                    placeholder="Describe what this attempt revealed. Linked knowledge will surface this gap in Growth suggestions."
                  />
                </Field>
                {editor.studyGap && (
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(editor.gapResolved)}
                      onChange={(e) =>
                        setEditor({ ...editor, gapResolved: e.target.checked })
                      }
                    />{" "}
                    I have reviewed and addressed this study gap
                  </label>
                )}
                <p className="muted">
                  Completion earns practice credit in your selected Barns. An
                  attempt or partial result is useful evidence too; record it
                  honestly.
                </p>
              </>
            )}
            <div className="form-actions">
              <Button primary type="submit">
                {finishing ? "Save practice result" : "Save stretch"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
