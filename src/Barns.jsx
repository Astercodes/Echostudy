import React, { useState } from "react";
import { CAPACITIES, STAGES, capacitySummary } from "./barns.js";
import { COLORS, readableAccent, uid, today } from "./model";
import { Button, Modal, Field } from "./App";
import "./barns.css";

export function CapacityPicker({ value = [], onChange }) {
  return (
    <fieldset className="capacity-picker">
      <legend>Capacities this builds</legend>
      <p>
        Select every relevant dimension. Life areas describe where; capacities
        describe what you are developing.
      </p>
      <div>
        {CAPACITIES.map((c) => (
          <label key={c.id}>
            <input
              type="checkbox"
              checked={value.includes(c.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...value, c.id]
                    : value.filter((id) => id !== c.id),
                )
              }
            />
            {c.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function Barn({ stage, color }) {
  return (
    <svg viewBox="0 0 120 110" className="barn-icon" aria-hidden="true">
      <path
        d="M12 45 60 8 108 45V102H12Z"
        fill={color + "22"}
        stroke={color}
        strokeWidth="3"
      />
      <path
        d="M2 47 60 2 118 47"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {Array.from({ length: 5 }, (_, i) => (
        <rect
          key={i}
          x="26"
          y={86 - i * 13}
          width="68"
          height="9"
          rx="3"
          fill={i < stage ? color : "#dce9e6"}
        />
      ))}
    </svg>
  );
}
export default function Barns({ data, save }) {
  const [areaId, setArea] = useState(""),
    [subAreaId, setSub] = useState(""),
    [selected, setSelected] = useState(null),
    [editing, setEditing] = useState(null);
  const area = data.lifeAreas.find((a) => a.id === areaId);
  const stats = (id) => capacitySummary(data, id, areaId, subAreaId);
  const add = (capacityId) =>
    setEditing({
      id: uid(),
      capacityId,
      areaId: areaId || data.lifeAreas[0].id,
      subAreaId,
      stage: 1,
      date: today(),
      evidence: "",
      sessionId: "",
      createdAt: new Date().toISOString(),
    });
  return (
    <div className="barns">
      <section className="card barns-intro">
        <span className="eyebrow">YOUR CAPACITY, CULTIVATED</span>
        <h2>What are you becoming able to carry?</h2>
        <p>
          Your 16 Barns grow across life areas. A marriage goal might develop
          emotional, relational, spiritual and communication capacity together.
        </p>
        <p className="muted">
          Focused time measures investment. Evidence-backed self-assessments
          describe capacity in a specific context; they are not objective scores
          or measures of personal worth.
        </p>
        <div className="form-grid">
          <Field label="Barn life area">
            <select
              value={areaId}
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
          <Field label="Barn sub-area">
            <select
              disabled={!area}
              value={subAreaId}
              onChange={(e) => setSub(e.target.value)}
            >
              <option value="">All sub-areas</option>
              {area?.subAreas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>
      <div className="barn-grid">
        {CAPACITIES.map((c, i) => {
          const s = stats(c.id),
            latest = s.evidence.at(-1),
            color = readableAccent(COLORS[i % COLORS.length]);
          return (
            <button
              className="card barn-card"
              key={c.id}
              onClick={() => setSelected(c.id)}
            >
              <Barn stage={latest?.stage || 0} color={color} />
              <h3>{c.name} Capacity</h3>
              <p>{c.question}</p>
              <strong>
                {latest ? STAGES[latest.stage - 1] : "Not yet assessed"}
              </strong>
              <small>
                {latest
                  ? "Latest contextual self-assessment · " + latest.date
                  : "Record a baseline to start your story"}
              </small>
              <div className="barn-stats">
                <span>{s.minutes} min invested</span>
                <span>{s.evidence.length} evidence records</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="muted">
        A session can contribute to several Barns. Its full focused time appears
        in each selected Barn, so do not add Barn totals together. Untagged past
        sessions are not automatically assigned.
      </p>
      {selected && !editing && (
        <Modal
          title={CAPACITIES.find((c) => c.id === selected).name + " Capacity"}
          onClose={() => setSelected(null)}
        >
          <p>{CAPACITIES.find((c) => c.id === selected).question}</p>
          <Button primary onClick={() => add(selected)}>
            Record capacity evidence
          </Button>
          <h3>Your evidence over time</h3>
          <p className="muted">
            Compare stages within the same life area and sub-area. A lower stage
            in a harder context does not mean you have regressed.
          </p>
          {[...stats(selected).evidence].reverse().map((e) => (
            <article className="barn-entry" key={e.id}>
              <small>
                {e.date} · {data.lifeAreas.find((a) => a.id === e.areaId)?.name}{" "}
                {e.subAreaId &&
                  " / " +
                    data.lifeAreas
                      .find((a) => a.id === e.areaId)
                      ?.subAreas.find((s) => s.id === e.subAreaId)?.name}
              </small>
              <h4>{STAGES[e.stage - 1]}</h4>
              <p>{e.evidence}</p>
              {e.sessionId && (
                <small>
                  Study:{" "}
                  {data.sessions.find((s) => s.id === e.sessionId)?.topic}
                </small>
              )}
              <Button onClick={() => setEditing({ ...e })}>
                Edit evidence
              </Button>
            </article>
          ))}
          {!stats(selected).evidence.length && (
            <p>
              No evidence yet. Describe something you can now do, sustain,
              explain or carry.
            </p>
          )}
          <h3>Study investment</h3>
          {stats(selected).sessions.map((s) => (
            <article className="barn-entry" key={s.id}>
              <strong>{s.topic}</strong>
              <p>
                {s.date} · {Math.round(s.actualMs / 60000)} focused minutes
              </p>
              <p>{s.reflection}</p>
            </article>
          ))}
          {!stats(selected).sessions.length && (
            <p>
              Select this capacity when starting a study session to track your
              investment.
            </p>
          )}
        </Modal>
      )}
      {editing && (
        <Modal
          title="Record capacity evidence"
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save((d) => ({
                ...d,
                capacityEvidence: [
                  ...(d.capacityEvidence || []).filter(
                    (x) => x.id !== editing.id,
                  ),
                  { ...editing, evidence: editing.evidence.trim() },
                ],
              }));
              setEditing(null);
            }}
          >
            <Field label="Evidence life area">
              <select
                value={editing.areaId}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    areaId: e.target.value,
                    subAreaId: "",
                    sessionId: "",
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
            <Field label="Evidence sub-area">
              <select
                value={editing.subAreaId}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    subAreaId: e.target.value,
                    sessionId: "",
                  })
                }
              >
                <option value="">Whole life area</option>
                {data.lifeAreas
                  .find((a) => a.id === editing.areaId)
                  ?.subAreas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Evidence date">
              <input
                type="date"
                required
                max={today()}
                value={editing.date}
                onChange={(e) =>
                  setEditing({ ...editing, date: e.target.value })
                }
              />
            </Field>
            <Field label="Capacity stage">
              <select
                value={editing.stage}
                onChange={(e) =>
                  setEditing({ ...editing, stage: Number(e.target.value) })
                }
              >
                {STAGES.map((s, i) => (
                  <option key={s} value={i + 1}>
                    {i + 1} · {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="What can you now carry or do? Give a concrete example.">
              <textarea
                required
                value={editing.evidence}
                onChange={(e) =>
                  setEditing({ ...editing, evidence: e.target.value })
                }
                placeholder="Describe the situation, what you did, the outcome, and what still needs practice."
              />
            </Field>
            <Field label="Supporting study session (optional)">
              <select
                value={editing.sessionId}
                onChange={(e) =>
                  setEditing({ ...editing, sessionId: e.target.value })
                }
              >
                <option value="">Real-life practice or other evidence</option>
                {capacitySummary(
                  data,
                  editing.capacityId,
                  editing.areaId,
                  editing.subAreaId,
                ).sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date} · {s.topic}
                  </option>
                ))}
              </select>
            </Field>
            <div className="form-actions">
              <Button primary type="submit" disabled={!editing.evidence.trim()}>
                Save evidence
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
