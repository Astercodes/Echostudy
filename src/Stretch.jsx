import React, { useState } from "react";
import { Button, Modal, Field, GoalTrail } from "./App";
import { CapacityPicker } from "./Barns.jsx";
import { CAPACITIES } from "./barns.js";
import { uid, today } from "./model";
import "./stretch.css";
import StretchRefiner from "./StretchRefiner.jsx";

export default function Stretch({ data, save, go }) {
  const [editor, setEditor] = useState(null),
    [finishing, setFinishing] = useState(false),
    [areaId, setArea] = useState(""),
    [subAreaId, setSub] = useState(""),
    [goalId, setGoal] = useState(""),
    [status, setStatus] = useState("all");
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
  const create = () => {
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
    });
  };
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
      areaId: g?.areaId || "",
      subAreaId: g?.subAreaId || "",
      capacityIds: [...ids],
    });
  };
  return (
    <div className="stretch-workspace">
      <section className="card stretch-intro">
        <span className="eyebrow">PUT YOUR ABILITIES TO WORK</span>
        <h2>Learn it. Use it. Stretch it.</h2>
        <p>
          Practise a difficult conversation, build a working prototype, lead a
          meeting, or apply a principle in daily life. Define the challenge, do
          the work, and capture what happened.
        </p>
        <Button primary onClick={create}>
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
              <p>{s.objective}</p>
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
                  {s.nextStep && <p>Next stretch: {s.nextStep}</p>}
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
                !editor.goalId ||
                !editor.capacityIds.length ||
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
            <Field label="Linked goal">
              <select
                aria-label="Linked goal"
                required
                value={editor.goalId}
                onChange={(e) => chooseGoal(e.target.value)}
              >
                <option value="">Choose a goal</option>
                {data.goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {data.lifeAreas.find((a) => a.id === g.areaId)?.name} ·{" "}
                    {g.level} · {g.title}
                  </option>
                ))}
              </select>
            </Field>
            <p className="muted">
              Life area:{" "}
              {data.lifeAreas.find((a) => a.id === editor.areaId)?.name ||
                "Choose a goal"}
            </p>
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
              Choose at least one capacity so this practice can fill its Barn.
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
                <p className="muted">
                  Completion earns practice credit in your selected Barns. An
                  attempt or partial result is useful evidence too; record it
                  honestly.
                </p>
              </>
            )}
            {!finishing && (
              <StretchRefiner
                key={editor.id}
                draft={editor}
                data={data}
                onApply={(suggestion) =>
                  setEditor((current) => ({ ...current, ...suggestion }))
                }
              />
            )}
            <div className="form-actions">
              <Button
                primary
                type="submit"
                disabled={!editor.capacityIds.length}
              >
                {finishing ? "Save practice result" : "Save stretch"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
