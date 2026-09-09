import React, { useState } from "react";
import {
  Plus,
  Target,
  ArrowRight,
  Search,
  Layers3,
  ChevronRight,
  Trash2,
  Check,
  Sprout,
} from "lucide-react";
import { Button, Badge, Modal, Field, GoalTrail } from "./App";
import {
  COLORS,
  LEVELS,
  uid,
  readableAccent,
  goalProgress,
  validateGoal,
} from "./model";
import { goalLocation, validateLifeArea } from "./life-areas";
import "./goals.css";
import { CapacityPicker } from "./Barns.jsx";

const horizonLabels = {
  Year: "Yearly",
  Quarter: "Quarterly",
  Month: "Monthly",
  Week: "Weekly",
  Day: "Daily",
};

export default function Goals({ data, save, edit, create, notify }) {
  const [areaId, setAreaId] = useState("all"),
    [subAreaId, setSubAreaId] = useState("all");
  const [horizon, setHorizon] = useState("all"),
    [query, setQuery] = useState(""),
    [tab, setTab] = useState("goals");
  const [areaEditor, setAreaEditor] = useState(null);
  const areas = data.lifeAreas,
    area = areas.find((a) => a.id === areaId);
  const match = (g) =>
    (areaId === "all" || g.areaId === areaId) &&
    (subAreaId === "all" || g.subAreaId === subAreaId) &&
    (horizon === "all" || g.level === horizon) &&
    (!query.trim() ||
      (g.title + " " + goalLocation(g, areas))
        .toLowerCase()
        .includes(query.trim().toLowerCase()));
  const filtered = data.goals.filter(match);
  const flat =
    horizon !== "all" || subAreaId !== "all" || Boolean(query.trim());
  const chooseArea = (id) => {
    setAreaId(id);
    setSubAreaId("all");
  };
  const newArea = () =>
    setAreaEditor({
      id: uid(),
      name: "",
      color: COLORS[areas.length % COLORS.length],
      subAreas: [],
    });
  const newGoal = (overrides = {}) =>
    create({
      areaId: area?.id || areas[0].id,
      subAreaId: subAreaId === "all" ? "" : subAreaId,
      level: horizon === "all" ? "Year" : horizon,
      ...overrides,
    });
  const renderGoal = (g, tree = true) => {
    const color = areas.find((a) => a.id === g.areaId)?.color || COLORS[0];
    const next = LEVELS[LEVELS.indexOf(g.level) + 1];
    return (
      <div className="goal-node" key={g.id} data-goal-id={g.id}>
        <div className="goal-row">
          <span
            className="goal-type"
            style={{ color: readableAccent(color), background: color + "22" }}
          >
            {horizonLabels[g.level]}
          </span>
          <div className="goal-main">
            <strong>{g.title}</strong>
            <small>
              {goalLocation(g, areas)}
              {g.due ? " · Due " + g.due : ""}
            </small>
            <div className="progress">
              <i
                style={{
                  width: goalProgress(g.id, data.goals) + "%",
                  background: color,
                }}
              />
            </div>
            {!tree && g.parent && (
              <GoalTrail id={g.parent} goals={data.goals} />
            )}
          </div>
          <span className="percent">{goalProgress(g.id, data.goals)}%</span>
          <div className="goal-row-actions">
            <button className="text-btn" onClick={() => edit(g)}>
              Edit
            </button>
            {next && (
              <button
                className="icon-btn"
                aria-label={
                  "Add " +
                  horizonLabels[next].toLowerCase() +
                  " goal under " +
                  g.title
                }
                title={"Add " + horizonLabels[next].toLowerCase() + " goal"}
                onClick={() =>
                  newGoal({
                    areaId: g.areaId,
                    subAreaId: g.subAreaId || "",
                    parent: g.id,
                    level: next,
                  })
                }
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>
        {tree &&
          data.goals.filter((x) => x.parent === g.id).map((x) => renderGoal(x))}
      </div>
    );
  };
  return (
    <div className="goals-workspace">
      <div className="goals-overview">
        <div>
          <span className="eyebrow">YOUR WHOLE LIFE, WITH DIRECTION</span>
          <h2>There is room for every part of you.</h2>
          <p>
            Create as many goals as you need, at every horizon. Link them to a
            life area and an optional sub-area.
          </p>
        </div>
        <div className="area-total">
          <strong>{areas.length}</strong>
          <span>life areas</span>
          <small>
            {areas.reduce((n, a) => n + a.subAreas.length, 0)} sub-areas
          </small>
        </div>
      </div>
      <div className="knowledge-toolbar">
        <div className="segmented">
          <button
            className={tab === "goals" ? "active" : ""}
            onClick={() => setTab("goals")}
          >
            <Target size={16} />
            My goals <span>{data.goals.length}</span>
          </button>
          <button
            className={tab === "areas" ? "active" : ""}
            onClick={() => setTab("areas")}
          >
            <Layers3 size={16} />
            Life areas <span>{areas.length}</span>
          </button>
        </div>
        <Button onClick={newArea}>
          <Plus size={16} />
          Add life area
        </Button>
      </div>
      {tab === "areas" ? (
        <>
          <p className="muted">
            Your starting areas are editable. Rename them, add your own, and
            grow the sub-areas that matter to you.
          </p>
          <div className="life-area-grid">
            {areas.map((a, index) => {
              const goals = data.goals.filter((g) => g.areaId === a.id);
              return (
                <article
                  className="card life-area-card"
                  key={a.id}
                  style={{ "--area-color": a.color }}
                >
                  <div className="section-head">
                    <span
                      className="area-number"
                      style={{
                        color: readableAccent(a.color),
                        background: a.color + "30",
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Badge color={a.color}>{goals.length} goals</Badge>
                  </div>
                  <h3>{a.name}</h3>
                  <small>
                    {a.subAreas.length} sub-areas · All five horizons
                  </small>
                  <details className="sub-area-details">
                    <summary>
                      Explore sub-areas <ChevronRight size={15} />
                    </summary>
                    <ul>
                      {a.subAreas.map((s) => (
                        <li key={s.id}>
                          <button
                            onClick={() => {
                              chooseArea(a.id);
                              setSubAreaId(s.id);
                              setHorizon("all");
                              setQuery("");
                              setTab("goals");
                            }}
                          >
                            {s.name}
                            <span>
                              {goals.filter((g) => g.subAreaId === s.id).length}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {!a.subAreas.length && (
                      <p>No sub-areas yet. Add them with Edit area.</p>
                    )}
                  </details>
                  <div className="area-card-actions">
                    <button
                      className="text-btn"
                      onClick={() => setAreaEditor(structuredClone(a))}
                    >
                      Edit area & sub-areas
                    </button>
                    <button
                      className="text-btn"
                      onClick={() => {
                        chooseArea(a.id);
                        setTab("goals");
                        setSubAreaId("all");
                        setHorizon("all");
                        setQuery("");
                      }}
                    >
                      View goals <ArrowRight size={14} />
                    </button>
                  </div>
                  <Button
                    onClick={() =>
                      newGoal({ areaId: a.id, subAreaId: "", level: "Year" })
                    }
                  >
                    <Plus size={14} />
                    Add a goal
                  </Button>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="goal-filters">
            <Field label="Filter by life area">
              <select
                aria-label="Filter by life area"
                value={areaId}
                onChange={(e) => chooseArea(e.target.value)}
              >
                <option value="all">All life areas</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Filter by sub-area">
              <select
                aria-label="Filter by sub-area"
                value={subAreaId}
                disabled={!area}
                onChange={(e) => setSubAreaId(e.target.value)}
              >
                <option value="all">All sub-areas</option>
                {area?.subAreas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Find a goal">
              <div className="search">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search goals and life areas…"
                />
              </div>
            </Field>
          </div>
          <div className="goal-horizons">
            <button
              className={horizon === "all" ? "filter active" : "filter"}
              onClick={() => setHorizon("all")}
            >
              All horizons
            </button>
            {LEVELS.map((l) => (
              <button
                className={horizon === l ? "filter active" : "filter"}
                key={l}
                onClick={() => setHorizon(l)}
              >
                {horizonLabels[l]}
                <span>
                  {
                    data.goals.filter(
                      (g) =>
                        (areaId === "all" || g.areaId === areaId) &&
                        (subAreaId === "all" || g.subAreaId === subAreaId) &&
                        g.level === l,
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>
          <div className="goal-results-head">
            <span>
              {filtered.length} goals{area ? " in " + area.name : ""}
            </span>
            <button className="text-btn" onClick={() => newGoal()}>
              <Plus size={15} />
              Add{" "}
              {horizon === "all"
                ? "a"
                : horizonLabels[horizon].toLowerCase()}{" "}
              goal
            </button>
          </div>
          {!filtered.length ? (
            <section className="card empty">
              <Sprout size={32} />
              <h3>
                {query
                  ? "No goals match this search."
                  : "What would you like to grow here?"}
              </h3>
              <p>
                {query
                  ? "Try another phrase or clear a filter."
                  : "Add your first goal. You can create multiple goals at every horizon."}
              </p>
              <Button primary onClick={() => newGoal()}>
                <Plus size={16} />
                Create a goal
              </Button>
            </section>
          ) : (
            areas
              .filter((a) => filtered.some((g) => g.areaId === a.id))
              .map((a) => (
                <section className="card goals-card area-goal-group" key={a.id}>
                  <div className="section-head">
                    <h2>
                      <i style={{ background: a.color }} />
                      {a.name}
                    </h2>
                    <button
                      className="text-btn"
                      onClick={() =>
                        newGoal({
                          areaId: a.id,
                          subAreaId:
                            areaId === a.id && subAreaId !== "all"
                              ? subAreaId
                              : "",
                        })
                      }
                    >
                      <Plus size={14} />
                      Add goal
                    </button>
                  </div>
                  {filtered
                    .filter((g) => g.areaId === a.id && (flat || !g.parent))
                    .map((g) => renderGoal(g, !flat))}
                </section>
              ))
          )}
          <p className="muted">
            Parent progress is the average of its children. Use + on a goal to
            add another shorter-horizon goal beneath it.
          </p>
        </>
      )}
      {areaEditor && (
        <LifeAreaModal
          area={areaEditor}
          areas={areas}
          goals={data.goals}
          evidence={[
            ...(data.capacityEvidence || []),
            ...(data.stretches || []),
          ]}
          close={() => setAreaEditor(null)}
          submit={(a) => {
            save((d) => ({
              ...d,
              lifeAreas: d.lifeAreas.some((x) => x.id === a.id)
                ? d.lifeAreas.map((x) => (x.id === a.id ? a : x))
                : [...d.lifeAreas, a],
            }));
            setAreaEditor(null);
            notify("Life area and sub-areas saved.");
          }}
        />
      )}
    </div>
  );
}

export function GoalModal({
  goal,
  goals,
  areas,
  defaults = {},
  close,
  submit,
}) {
  const [g, setG] = useState(
    () =>
      goal || {
        id: uid(),
        title: "",
        level: "Year",
        areaId: areas[0].id,
        subAreaId: "",
        parent: "",
        progress: 0,
        due: "",
        ...defaults,
      },
  );
  const [error, setError] = useState("");
  const hasChildren = goals.some((x) => x.parent === g.id),
    area = areas.find((a) => a.id === g.areaId);
  const parentOptions = goals.filter(
    (x) =>
      x.id !== g.id &&
      x.areaId === g.areaId &&
      LEVELS.indexOf(x.level) < LEVELS.indexOf(g.level),
  );
  return (
    <Modal
      title={goal ? "Shape your goal" : "Plant a new goal"}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const next = { ...g, title: g.title.trim() };
          const message = validateGoal(next, goals, areas);
          if (message) {
            setError(message);
            return;
          }
          submit(next);
        }}
      >
        <CapacityPicker
          value={g.capacityIds || []}
          onChange={(capacityIds) => setG({ ...g, capacityIds })}
        />
        <Field label="What capacity or outcome are you building?">
          <input
            required
            autoFocus
            value={g.title}
            onChange={(e) => setG({ ...g, title: e.target.value })}
          />
        </Field>
        <div className="form-grid">
          <Field label="Horizon">
            <select
              aria-label="Horizon"
              value={g.level}
              disabled={hasChildren}
              onChange={(e) =>
                setG({ ...g, level: e.target.value, parent: "" })
              }
            >
              {LEVELS.map((l) => (
                <option value={l} key={l}>
                  {horizonLabels[l]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Life area">
            <select
              aria-label="Life area"
              value={g.areaId}
              disabled={hasChildren}
              onChange={(e) =>
                setG({
                  ...g,
                  areaId: e.target.value,
                  subAreaId: "",
                  parent: "",
                })
              }
            >
              {areas.map((a) => (
                <option value={a.id} key={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {hasChildren && (
          <p className="muted">
            This goal has child goals, so its life area and horizon stay
            connected to them. Its title and sub-area can be edited.
          </p>
        )}
        <Field label="Sub-area (optional)">
          <select
            aria-label="Sub-area (optional)"
            value={g.subAreaId || ""}
            onChange={(e) => setG({ ...g, subAreaId: e.target.value })}
          >
            <option value="">Whole life area</option>
            {area?.subAreas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        {g.level !== "Year" && (
          <Field label="Larger goal this contributes to">
            <select
              aria-label="Larger goal this contributes to"
              value={g.parent}
              onChange={(e) => setG({ ...g, parent: e.target.value })}
            >
              <option value="">Independent goal in this area</option>
              {parentOptions.map((x) => (
                <option key={x.id} value={x.id}>
                  {horizonLabels[x.level]} · {x.title}
                  {x.due ? " · " + x.due : ""}
                </option>
              ))}
            </select>
          </Field>
        )}
        {g.parent && <GoalTrail id={g.parent} goals={goals} />}
        <Field label="Target date">
          <input
            type="date"
            value={g.due || ""}
            onChange={(e) => setG({ ...g, due: e.target.value })}
          />
        </Field>
        {!hasChildren && (
          <Field label={"Progress · " + g.progress + "%"}>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={g.progress}
              onChange={(e) => setG({ ...g, progress: Number(e.target.value) })}
            />
          </Field>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button primary type="submit">
            Save goal
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function LifeAreaModal({ area, areas, goals, evidence, close, submit }) {
  const [a, setA] = useState(area),
    [error, setError] = useState("");
  const updateSub = (id, name) =>
    setA({
      ...a,
      subAreas: a.subAreas.map((s) => (s.id === id ? { ...s, name } : s)),
    });
  const existing = areas.some((x) => x.id === a.id);
  return (
    <Modal
      title={existing ? "Edit life area & sub-areas" : "Create a life area"}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const next = {
            ...a,
            name: a.name.trim(),
            subAreas: a.subAreas.map((s) => ({ ...s, name: s.name.trim() })),
          };
          const msg = validateLifeArea(next, areas);
          if (msg) {
            setError(msg);
            return;
          }
          submit(next);
        }}
      >
        <Field label="Life area name">
          <input
            required
            autoFocus
            value={a.name}
            maxLength="100"
            placeholder="For example, Leadership & influence"
            onChange={(e) => setA({ ...a, name: e.target.value })}
          />
        </Field>
        <fieldset className="area-colors">
          <legend>Area color</legend>
          {COLORS.map((color, i) => (
            <label key={color} title={color}>
              <input
                type="radio"
                name="area-color"
                aria-label={
                  [
                    "Cyan",
                    "Cobalt blue",
                    "Ocean blue",
                    "Orange",
                    "Ice blue",
                    "Peach",
                    "Yellow",
                    "Pepper red",
                  ][i]
                }
                value={color}
                checked={a.color === color}
                onChange={() => setA({ ...a, color })}
              />
              <span style={{ background: color }}>
                {a.color === color && (
                  <Check size={17} color={readableAccent(color)} />
                )}
              </span>
            </label>
          ))}
        </fieldset>
        <div className="section-head sub-area-head">
          <h3>
            Sub-areas <small>({a.subAreas.length})</small>
          </h3>
          <button
            type="button"
            className="text-btn"
            onClick={() =>
              setA({ ...a, subAreas: [...a.subAreas, { id: uid(), name: "" }] })
            }
          >
            <Plus size={15} />
            Add sub-area
          </button>
        </div>
        <div className="sub-area-editor">
          {a.subAreas.map((s, i) => {
            const used = [...goals, ...evidence].some(
              (g) => g.areaId === a.id && g.subAreaId === s.id,
            );
            return (
              <div className="sub-area-input" key={s.id}>
                <label>
                  <span>{i + 1}</span>
                  <input
                    aria-label={"Sub-area " + (i + 1)}
                    value={s.name}
                    placeholder="Name this part of your life"
                    maxLength="120"
                    onChange={(e) => updateSub(s.id, e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={"Remove sub-area " + (i + 1)}
                  disabled={used}
                  title={
                    used
                      ? "Move linked goals, Barns evidence and stretch activities before removing this sub-area."
                      : "Remove sub-area"
                  }
                  onClick={() =>
                    setA({
                      ...a,
                      subAreas: a.subAreas.filter((x) => x.id !== s.id),
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
        {!a.subAreas.length && (
          <p className="muted">
            Sub-areas are optional. Add them now or return as this area grows.
          </p>
        )}
        {a.subAreas.some((s) =>
          goals.some((g) => g.areaId === a.id && g.subAreaId === s.id),
        ) && (
          <p className="muted">
            Sub-areas used by goals can be renamed. Move their goals before
            removing them.
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button primary type="submit">
            Save life area
          </Button>
        </div>
      </form>
    </Modal>
  );
}
