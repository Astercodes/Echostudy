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
  const knowledge = useMemo(() => practiceNodes(data), [data]);
  const allKnowledge = useMemo(() => knowledgeEntries(data), [data]);
  const records = data.stretches || [];
  const area = data.lifeAreas.find((a) => a.id === areaId);
  const filtered = records.filter(
    (s) =>
      (!areaId || s.areaId === areaId) &&
      (!subAreaId || s.subAreaId === subAreaId) &&
      (!goalId || s.goalId === goalId) &&
      (status === "all" || s.status === status),
  );
  const store = (s) =>
    save((d) => ({
      ...d,
      stretches: [...(d.stretches || []).filter((x) => x.id !== s.id), s],
    }));
  const create = (defaults = {}) => {
    const linkedGoal = data.goals.find((g) => g.id === goalId);
    setFinishing(false);
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
  return (
    <div className="stretch-workspace">
      <section className="card stretch-intro">
        <span className="eyebrow">PUT YOUR ABILITIES TO WORK</span>
        <h2>Practice now. Grow through doing.</h2>
        <p>
          Exercise knowledge through internal rehearsal, simulations, social
          practice and real-world situations. Start small and increase the
          challenge as you learn. No study completion or ripeness score is
          required.
        </p>
        <Button primary onClick={() => create()}>
          Plan a stretch
        </Button>
        <Button onClick={() => go("Barns")}>See capacity growth</Button>
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
        </div>
      </section>
      <StretchSuggestions data={data} create={create} />
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
          <select value={goalId} onChange={(e) => setGoal(e.target.value)}>
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
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All activities</option>
            <option value="planned">Planned</option>
            <option value="active">In progress</option>
            <option value="completed">Recorded</option>
          </select>
        </Field>
      </section>
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
                · {STRETCH_SOURCES[s.source] || "User-created"} · Challenge{" "}
                {s.challenge || 1}
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
                      {s.completion}% completed · {s.actualMinutes} minutes
                    </strong>
                  </p>
                  <p>{s.outcome}</p>
                  {s.harvest && (
                    <p>
                      <strong>Harvest · What it produced:</strong> {s.harvest}
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
                  <Button
                    onClick={() =>
                      create({
                        ...s,
                        id: uid(),
                        status: "planned",
                        date: nextPracticeDate(s.date, s.repeat),
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
                      })
                    }
                  >
                    Plan next attempt
                  </Button>
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
                  {s.status === "planned" && (
                    <Button
                      primary
                      onClick={() =>
                        store({
                          ...s,
                          status: "active",
                          startedAt: new Date().toISOString(),
                        })
                      }
                    >
                      Start stretch
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setEditor({ ...s });
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
            No activities match this view. Plan a stretch and connect it to a
            goal and the capacities you want to practise.
          </p>
        </section>
      )}
      {editor && (
        <Modal
          title={
            finishing ? "Record your stretch result" : "Shape your stretch"
          }
          onClose={() => setEditor(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !editor.title.trim() ||
                !editor.objective.trim() ||
                !editor.success.trim() ||
                (finishing && !editor.outcome.trim())
              )
                return;
              store({
                ...editor,
                status: finishing ? "completed" : editor.status,
                ...(finishing
                  ? {
                      completedAt:
                        editor.completedAt || new Date().toISOString(),
                    }
                  : {}),
              });
              setEditor(null);
            }}
          >
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
                  {Object.entries(PRACTICE_ENVIRONMENTS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
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
                    setEditor({ ...editor, challenge: Number(e.target.value) })
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
              Environments and challenges are freely selectable. For repeats,
              Plan next attempt creates the next dated activity after you record
              a result.
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
              onChange={(capacityIds) => setEditor({ ...editor, capacityIds })}
            />
            <p className="muted">
              Link capacities to count recorded practice toward their Barns. You
              can also begin without a capacity or goal and link them later.
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
                    setEditor({ ...editor, planned: Number(e.target.value) })
                  }
                />
              </Field>
            </div>
            {finishing && (
              <>
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
