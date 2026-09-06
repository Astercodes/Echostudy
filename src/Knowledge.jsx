import React, { useState, useMemo } from "react";
import {
  Plus,
  Minus,
  RotateCcw,
  Network,
  Lightbulb,
  ArrowRight,
  Check,
  Link,
  Trash2,
  Search,
  Sprout,
} from "lucide-react";
import { COLORS, DOMAINS, uid, insights } from "./model";
import { Button, Badge, Modal, Field } from "./App";
function layout(nodes) {
  const map = new Map(),
    root = nodes.find((c) => !c.parent);
  if (!root) return map;
  map.set(root.id, { x: 530, y: 320 });
  const branches = nodes.filter((c) => c.parent === root.id);
  branches.forEach((b, i) => {
    const side = i < Math.ceil(branches.length / 2) ? -1 : 1;
    const group = side === -1 ? i : i - Math.ceil(branches.length / 2),
      count =
        side === -1
          ? Math.ceil(branches.length / 2)
          : Math.floor(branches.length / 2);
    const y = 130 + (group * 380) / Math.max(1, count - 1);
    map.set(b.id, { x: 530 + side * 190, y });
    const descend = (parent, depth, cy, space) => {
      const children = nodes.filter((c) => c.parent === parent.id);
      children.forEach((c, j) => {
        const ny = cy + (j - (children.length - 1) / 2) * space;
        map.set(c.id, { x: 530 + side * (190 + depth * 150), y: ny });
        descend(c, depth + 1, ny, space * 0.65);
      });
    };
    descend(b, 1, y, 65);
  });
  return map;
}
export default function Knowledge({ data, save, compact = false, notify }) {
  const [selected, setSelected] = useState(null),
    [editing, setEditing] = useState(null),
    [zoom, setZoom] = useState(1),
    [filter, setFilter] = useState(""),
    [tab, setTab] = useState("tree"),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [drag, setDrag] = useState(null);
  const nodes = compact
      ? data.concepts.filter(
          (c) => !c.parent || c.parent === "root" || c.parent.startsWith("d"),
        )
      : data.concepts,
    positions = useMemo(() => layout(nodes), [nodes]),
    sel = nodes.find((c) => c.id === selected);
  const coords = [...positions.values()],
    minX = Math.min(0, ...coords.map((p) => p.x - 100)),
    maxX = Math.max(1060, ...coords.map((p) => p.x + 100)),
    minY = Math.min(0, ...coords.map((p) => p.y - 40)),
    maxY = Math.max(640, ...coords.map((p) => p.y + 40));
  const view = [minX, minY, maxX - minX, maxY - minY].join(" ");
  const suggestions = insights(nodes);
  const mutate = (c) =>
    save((d) => ({
      ...d,
      concepts: d.concepts.map((x) => (x.id === c.id ? c : x)),
    }));
  return (
    <div className={compact ? "knowledge compact" : "knowledge"}>
      {!compact && (
        <div className="knowledge-toolbar">
          <div className="segmented">
            <button
              className={tab === "tree" ? "active" : ""}
              onClick={() => setTab("tree")}
            >
              <Network size={16} />
              Knowledge tree
            </button>
            <button
              className={tab === "insights" ? "active" : ""}
              onClick={() => setTab("insights")}
            >
              <Lightbulb size={16} />
              Growth suggestions <span>{suggestions.length}</span>
            </button>
          </div>
          <div className="row-actions">
            <div className="search">
              <Search size={16} />
              <input
                aria-label="Find a concept"
                placeholder="Find a concept…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <Button
              primary
              onClick={() =>
                setEditing({
                  id: uid(),
                  title: "",
                  parent: selected || "root",
                  domain: sel?.domain || 0,
                  status: "Growing",
                  links: [],
                  prerequisites: [],
                  description: "",
                })
              }
            >
              <Plus size={16} />
              Add concept
            </Button>
          </div>
        </div>
      )}
      {tab === "tree" ? (
        <div className={compact ? "" : "knowledge-layout"}>
          <section className={compact ? "map-canvas" : "card map-canvas"}>
            {!compact && (
              <div className="map-caption">
                <Badge>
                  <Sprout size={13} /> YOUR LIVING KNOWLEDGE
                </Badge>
                <p>Select an idea to explore or grow it.</p>
              </div>
            )}
            <svg
              className="mind-map"
              viewBox={view}
              aria-label="Organic knowledge tree with six life areas"
              onPointerDown={(e) => {
                if (!compact && e.target.tagName !== "text") {
                  setDrag({ x: e.clientX, y: e.clientY, pan });
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
              }}
              onPointerMove={(e) => {
                if (drag) {
                  const scale = (maxX - minX) / e.currentTarget.clientWidth;
                  setPan({
                    x: drag.pan.x + (e.clientX - drag.x) * scale,
                    y: drag.pan.y + (e.clientY - drag.y) * scale,
                  });
                }
              }}
              onPointerUp={() => setDrag(null)}
            >
              <g
                transform={
                  "translate(" +
                  pan.x +
                  " " +
                  pan.y +
                  ") translate(530 320) scale(" +
                  zoom +
                  ") translate(-530 -320)"
                }
              >
                {nodes
                  .filter((c) => c.parent)
                  .map((c) => {
                    const a = positions.get(c.parent),
                      b = positions.get(c.id);
                    if (!a || !b) return null;
                    return (
                      <path
                        key={c.id}
                        d={
                          "M " +
                          a.x +
                          " " +
                          a.y +
                          " C " +
                          (a.x + b.x) / 2 +
                          " " +
                          a.y +
                          ", " +
                          (a.x + b.x) / 2 +
                          " " +
                          b.y +
                          ", " +
                          b.x +
                          " " +
                          b.y
                        }
                        fill="none"
                        stroke={COLORS[c.domain] || COLORS[0]}
                        strokeWidth={c.parent === "root" ? 7 : 3}
                        strokeLinecap="round"
                        opacity={
                          filter &&
                          !c.title.toLowerCase().includes(filter.toLowerCase())
                            ? 0.2
                            : 1
                        }
                      />
                    );
                  })}
                {!compact &&
                  nodes.flatMap((c) =>
                    (c.links || []).map((id) => {
                      const a = positions.get(c.id),
                        b = positions.get(id);
                      return a && b ? (
                        <path
                          key={c.id + id}
                          d={
                            "M " +
                            a.x +
                            " " +
                            a.y +
                            " Q 530 310 " +
                            b.x +
                            " " +
                            b.y
                          }
                          stroke="#9cac9e"
                          strokeWidth="1.5"
                          strokeDasharray="5 7"
                          fill="none"
                          opacity=".5"
                        />
                      ) : null;
                    }),
                  )}
                {nodes.map((c) => {
                  const p = positions.get(c.id);
                  if (!p) return null;
                  const root = !c.parent,
                    branch = c.parent === "root",
                    width = root
                      ? 156
                      : Math.min(
                          240,
                          Math.max(100, c.title.length * (compact ? 10 : 8)),
                        );
                  return (
                    <g
                      key={c.id}
                      className={
                        "map-node " + (selected === c.id ? "selected" : "")
                      }
                      transform={"translate(" + p.x + " " + p.y + ")"}
                      onClick={() => {
                        setSelected(c.id);
                        if (compact) return;
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={c.title}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(c.id);
                        }
                      }}
                      opacity={
                        filter &&
                        !c.title.toLowerCase().includes(filter.toLowerCase())
                          ? 0.3
                          : 1
                      }
                    >
                      {root ? (
                        <>
                          <rect
                            x={-78}
                            y={-28}
                            width="156"
                            height="56"
                            rx="19"
                            fill="#173f35"
                          />
                          <text
                            textAnchor="middle"
                            y="5"
                            fill="#fff"
                            fontSize="16"
                            fontWeight="600"
                          >
                            {c.title}
                          </text>
                        </>
                      ) : (
                        <>
                          <rect
                            x={-width / 2}
                            y={-18}
                            width={width}
                            height="36"
                            rx={branch ? 10 : 6}
                            fill={
                              selected === c.id
                                ? COLORS[c.domain] + "25"
                                : "#fafbf5"
                            }
                            stroke={
                              selected === c.id ? COLORS[c.domain] : "none"
                            }
                          />
                          <text
                            textAnchor="middle"
                            y="4"
                            fill={branch ? COLORS[c.domain] : "#39493e"}
                            fontSize={
                              compact ? (branch ? 22 : 19) : branch ? 18 : 16
                            }
                            fontWeight={branch ? "650" : "500"}
                          >
                            {c.title.length > 24
                              ? c.title.slice(0, 23) + "…"
                              : c.title}
                          </text>
                          {c.status === "Confident" && (
                            <circle
                              cx={width / 2 + 5}
                              cy="0"
                              r="4"
                              fill={COLORS[c.domain]}
                            />
                          )}
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
            {!compact && (
              <>
                <div className="map-controls">
                  <button
                    aria-label="Zoom out"
                    onClick={() => setZoom(Math.max(0.4, zoom - 0.15))}
                  >
                    <Minus size={16} />
                  </button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button
                    aria-label="Zoom in"
                    onClick={() => setZoom(Math.min(2.5, zoom + 0.15))}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    aria-label="Reset map view"
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
                <span className="map-hint">
                  Drag to explore · Dashed lines connect ideas
                </span>
              </>
            )}
          </section>
          {!compact && (
            <aside className="card concept-panel">
              {sel ? (
                <>
                  <Badge color={COLORS[sel.domain]}>
                    {DOMAINS[sel.domain]}
                  </Badge>
                  <h2>{sel.title}</h2>
                  <p>
                    {sel.description ||
                      "An idea taking root. Add your explanation, examples, and questions."}
                  </p>
                  <Field label="Understanding">
                    <select
                      value={sel.status}
                      onChange={(e) =>
                        mutate({ ...sel, status: e.target.value })
                      }
                    >
                      <option>Growing</option>
                      <option>Confident</option>
                    </select>
                  </Field>
                  <label className="check-field">
                    <input
                      type="checkbox"
                      checked={Boolean(sel.applied)}
                      onChange={(e) =>
                        mutate({ ...sel, applied: e.target.checked })
                      }
                    />
                    I have applied this concept
                  </label>
                  <Button
                    onClick={() => {
                      mutate({ ...sel, reviewed: new Date().toISOString() });
                      notify("Review recorded. Revisit this idea in a week.");
                    }}
                  >
                    <Check size={15} />
                    Mark reviewed today
                  </Button>
                  <small className="muted">
                    {sel.reviewed
                      ? "Last review: " +
                        new Date(sel.reviewed).toLocaleDateString()
                      : "No review recorded yet"}
                  </small>
                  <hr />
                  <h3>Connected ideas</h3>
                  {(sel.links || []).map((id) => (
                    <button
                      className="concept-link"
                      key={id}
                      onClick={() => setSelected(id)}
                    >
                      <Link size={14} />
                      {nodes.find((c) => c.id === id)?.title}
                    </button>
                  ))}
                  {!sel.links?.length && <p>No cross-links yet.</p>}
                  <h3>Notes that belong here</h3>
                  {data.notes
                    .filter((n) => n.concepts?.includes(sel.id))
                    .map((n) => (
                      <blockquote key={n.id}>
                        {n.quote && <mark>{n.quote}</mark>}
                        <p>{n.text}</p>
                      </blockquote>
                    ))}
                  {!data.notes.some((n) => n.concepts?.includes(sel.id)) && (
                    <p>Link notes here from your resource library.</p>
                  )}
                  <div className="stack-actions">
                    <Button onClick={() => setEditing({ ...sel })}>
                      Edit concept & connections
                    </Button>
                    <Button
                      primary
                      onClick={() =>
                        setEditing({
                          id: uid(),
                          title: "",
                          parent: sel.id,
                          domain: sel.domain,
                          status: "Growing",
                          links: [],
                          prerequisites: [],
                          description: "",
                        })
                      }
                    >
                      <Plus size={15} />
                      Grow a branch
                    </Button>
                  </div>
                </>
              ) : (
                <div className="empty">
                  <Sprout size={35} />
                  <h3>Follow your curiosity.</h3>
                  <p>
                    Select a concept to see its connections, understanding, and
                    notes.
                  </p>
                </div>
              )}
            </aside>
          )}
        </div>
      ) : (
        <>
          <p className="muted">
            Suggestions use your prerequisites, confidence, cross-links,
            applications, and review dates. They are rule-based prompts, not an
            AI assessment of your knowledge.
          </p>
          <div className="insight-grid">
            {suggestions.map((s) => (
              <section className="card insight-mini" key={s.id}>
                <Badge color="#d16a33">{s.type}</Badge>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <button
                  className="text-btn"
                  onClick={() => {
                    setSelected(s.concept);
                    setTab("tree");
                  }}
                >
                  Explore concept <ArrowRight size={15} />
                </button>
              </section>
            ))}
          </div>
        </>
      )}
      {editing && (
        <ConceptModal
          c={editing}
          nodes={nodes}
          close={() => setEditing(null)}
          submit={(c) => {
            save((d) => ({
              ...d,
              concepts: [...d.concepts.filter((x) => x.id !== c.id), c],
            }));
            setSelected(c.id);
            setEditing(null);
            notify("Your knowledge tree has grown.");
          }}
        />
      )}
    </div>
  );
}
function ConceptModal({ c, nodes, close, submit }) {
  const [v, setV] = useState(c),
    [pre, setPre] = useState((c.prerequisites || []).join(", "));
  const change = (k, value) => setV({ ...v, [k]: value });
  const descendant = (id) => {
    let n = nodes.find((x) => x.id === id),
      seen = new Set();
    while (n) {
      if (n.id === c.id) return true;
      if (seen.has(n.id)) return true;
      seen.add(n.id);
      n = nodes.find((x) => x.id === n.parent);
    }
    return false;
  };
  return (
    <Modal
      title={
        nodes.some((n) => n.id === c.id)
          ? "Connect & deepen this idea"
          : "Plant a new concept"
      }
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!v.title.trim()) return;
          submit({
            ...v,
            title: v.title.trim(),
            prerequisites: pre
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          });
        }}
      >
        <Field label="Concept name">
          <input
            required
            autoFocus
            value={v.title}
            onChange={(e) => change("title", e.target.value)}
          />
        </Field>
        {c.id !== "root" && (
          <Field label="Grows from">
            <select
              required
              value={v.parent}
              onChange={(e) =>
                setV({
                  ...v,
                  parent: e.target.value,
                  domain:
                    nodes.find((n) => n.id === e.target.value)?.domain || 0,
                })
              }
            >
              {nodes
                .filter((n) => !descendant(n.id))
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
            </select>
          </Field>
        )}
        <Field label="Your explanation, examples & questions">
          <textarea
            value={v.description || ""}
            onChange={(e) => change("description", e.target.value)}
          />
        </Field>
        <Field label="Prerequisites (comma-separated concept names)">
          <input
            value={pre}
            onChange={(e) => setPre(e.target.value)}
            placeholder="Linear algebra, Probability…"
          />
        </Field>
        <Field label="Connect to other ideas (choose any)">
          <div className="checkbox-list">
            {nodes
              .filter((n) => n.id !== c.id && n.id !== v.parent)
              .map((n) => (
                <label key={n.id}>
                  <input
                    type="checkbox"
                    checked={v.links.includes(n.id)}
                    onChange={(e) =>
                      change(
                        "links",
                        e.target.checked
                          ? [...v.links, n.id]
                          : v.links.filter((id) => id !== n.id),
                      )
                    }
                  />
                  {n.title}
                </label>
              ))}
          </div>
        </Field>
        <div className="form-actions">
          <Button primary type="submit">
            <Sprout size={16} />
            Save concept
          </Button>
        </div>
      </form>
    </Modal>
  );
}
