import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Plus,
  Sprout,
  Cherry,
  Link,
  Trash2,
  RotateCcw,
  Minus,
  Search,
} from "lucide-react";
import { Button, Field, Modal } from "./App";
import { uid, insights } from "./model";
import {
  isScaffold,
  locationOf,
  treeNodes,
  descendants,
  saveTreeNode,
  connectionsOf,
  connectNodes,
  pluckNode,
  compostNode,
  restoreNode,
} from "./knowledge-tree";
import "./knowledge-tree.css";
import KnowledgeActions from "./KnowledgeActions";

function growLayout(nodes, branches) {
  const points = new Map(),
    paths = [];
  let y = 85;
  const visit = (n, x, side) => {
    const children = nodes.filter((c) => c.parent === n.id);
    const top = y;
    if (!children.length) y += 76;
    else children.forEach((c) => visit(c, x + side * 190, side));
    const cy = (top + y - 76) / 2;
    points.set(n.id, { x, y: cy, n });
    children.forEach((c) =>
      paths.push({ from: n.id, to: c.id, fruit: c.kind === "fruit" }),
    );
  };
  branches.forEach((b, i) => {
    const side = i % 2 === 0 ? 1 : -1,
      top = y;
    b.nodes.forEach((n) => visit(n, side * 450, side));
    if (!b.nodes.length) y += 85;
    const cy = (top + y - 76) / 2;
    points.set(b.id, { x: side * 225, y: cy, n: b, branch: true });
    b.nodes.forEach((n) => paths.push({ from: b.id, to: n.id }));
    paths.push({ from: "tree-root", to: b.id, main: true });
    y += 45;
  });
  points.set("tree-root", { x: 0, y: Math.max(160, (y - 45) / 2), root: true });
  const xs = [...points.values()].map((p) => p.x);
  return {
    points,
    paths,
    width: Math.max(1100, Math.max(...xs) - Math.min(...xs) + 300),
    minX:
      Math.min(...xs) -
      150 -
      Math.max(0, 1100 - (Math.max(...xs) - Math.min(...xs) + 300)) / 2,
    height: Math.max(520, y + 40),
  };
}
export default function Knowledge({
  data,
  save,
  compact = false,
  notify = () => {},
}) {
  const [areaId, setArea] = useState(
    data.lifeAreas.find((a) => a.id === "knowledge")?.id ||
      data.lifeAreas[0]?.id,
  );
  const [selected, setSelected] = useState(null),
    [editor, setEditor] = useState(null),
    [action, setAction] = useState(null),
    [isolated, setIsolated] = useState(false),
    [allBranches, setAll] = useState(false),
    [search, setSearch] = useState(""),
    [zoom, setZoom] = useState(1),
    [branchId, setBranch] = useState("");
  const area = data.lifeAreas.find((a) => a.id === areaId) || data.lifeAreas[0];
  const nodes = treeNodes(data, area?.id),
    sel = data.concepts.find((n) => n.id === selected && !n.trashedAt);
  const loc = (n) => locationOf(n, data.concepts, data.lifeAreas);
  const open = (n) => {
    setArea(loc(n).areaId);
    setSelected(n.id);
    setIsolated(false);
  };
  const branches = useMemo(() => {
    const groups = area.subAreas.map((s) => ({
      ...s,
      id: "branch:" + s.id,
      subAreaId: s.id,
      title: s.name,
    }));
    groups.unshift({
      id: "branch:independent",
      subAreaId: "",
      title: "Independent concepts",
      independent: true,
    });
    if (nodes.some((n) => !loc(n).subAreaId && !n.standalone))
      groups.unshift({
        id: "branch:unplaced",
        subAreaId: "",
        title: "Choose a sub-area",
      });
    return groups
      .map((b) => ({
        ...b,
        nodes: nodes.filter(
          (n) =>
            loc(n).subAreaId === b.subAreaId &&
            Boolean(n.standalone) === Boolean(b.independent) &&
            !nodes.some((p) => p.id === n.parent),
        ),
      }))
      .filter((b, i) =>
        b.independent
          ? b.nodes.length > 0
          : allBranches || b.nodes.length || b.subAreaId === branchId || i < 3,
      );
  }, [data, area, allBranches, branchId]);
  const layout = growLayout(nodes, branches);
  const canvas = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(900);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setCanvasWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const scale = Math.min(1, canvasWidth / layout.width) * zoom;
  useEffect(() => {
    const el = canvas.current;
    if (el) {
      el.scrollLeft = Math.max(0, (layout.width * scale - el.clientWidth) / 2);
      el.scrollTop = Math.max(
        0,
        layout.points.get("tree-root").y * scale - el.clientHeight / 2,
      );
    }
  }, [area.id, zoom, allBranches, canvasWidth]);
  const linked = sel ? connectionsOf(sel, data.concepts) : [];
  const focusIds = new Set(
    sel ? [sel.id, sel.parent, ...linked.map((n) => n.id)] : [],
  );
  const create = (kind, parent) => {
    const l = parent
      ? loc(parent)
      : { areaId: area.id, subAreaId: branchId || area.subAreas[0]?.id || "" };
    setEditor({
      id: uid(),
      kind,
      title: "",
      description: "",
      summary: "",
      parent: parent?.id || "",
      ...l,
      domain: parent?.domain || 0,
      status: "Growing",
      prerequisites: [],
      links: [],
    });
  };
  const update = (n) =>
    save((d) => ({
      ...d,
      concepts: d.concepts.map((c) => (c.id === n.id ? n : c)),
    }));
  if (!area)
    return <p>Create a life area under Goals to plant your first tree.</p>;
  return (
    <div className={"orchard " + (compact ? "orchard-compact" : "")}>
      <div className="orchard-header">
        <div>
          <span className="orchard-eyebrow">YOUR KNOWLEDGE ORCHARD</span>
          <h2>{area.name}</h2>
          <p>One life area. One living tree. Every idea has a place to grow.</p>
        </div>
        <Field label="Life-area tree">
          <select
            value={area.id}
            onChange={(e) => {
              setArea(e.target.value);
              setSelected(null);
              setIsolated(false);
              setBranch("");
              setSearch("");
            }}
          >
            {data.lifeAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {!compact && (
        <div className="orchard-toolbar">
          <Field label="Sub-area branch">
            <select
              value={branchId}
              onChange={(e) => setBranch(e.target.value)}
            >
              <option value="">Select a branch to grow</option>
              {area.subAreas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Button primary onClick={() => create("concept")}>
            <Plus size={16} />
            Add concept
          </Button>
          <Button onClick={() => setAction("suggestions")}>
            Growth suggestions
          </Button>
          <Button onClick={() => setAction("trash")}>
            <Trash2 size={16} />
            Compost
          </Button>
          <label className="orchard-search">
            <Search size={16} />
            <input
              aria-label="Search this tree"
              placeholder="Find a concept or fruit"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      )}
      {search && (
        <div className="orchard-results">
          {nodes
            .filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))
            .map((n) => (
              <button key={n.id} onClick={() => open(n)}>
                {n.kind === "fruit" ? "Fruit" : "Concept"} · {n.title}
              </button>
            ))}
        </div>
      )}
      <div className="orchard-workspace">
        <section className="card orchard-stage">
          <div className="orchard-legend">
            <span>
              <Sprout size={16} /> Root → sub-area → concept → fruit
            </span>
            <span>
              {nodes.filter((n) => n.kind !== "fruit").length} concepts ·{" "}
              {nodes.filter((n) => n.kind === "fruit").length} fruits
            </span>
          </div>
          <div className="orchard-scroll" ref={canvas}>
            <svg
              className="orchard-tree"
              aria-label={"Knowledge tree for " + area.name}
              viewBox={[layout.minX, 0, layout.width, layout.height].join(" ")}
              style={{
                width: layout.width * scale,
                height: layout.height * scale,
              }}
            >
              <defs>
                <linearGradient id={"bark-" + (compact ? "mini" : "full")}>
                  <stop stopColor="#082b96" />
                  <stop offset="1" stopColor="#009cde" />
                </linearGradient>
              </defs>
              {layout.paths.map((e, i) => {
                const a = layout.points.get(e.from),
                  b = layout.points.get(e.to);
                return (
                  <path
                    key={i}
                    d={`M${a.x},${a.y} C${a.x + (b.x - a.x) * 0.55},${a.y} ${a.x + (b.x - a.x) * 0.45},${b.y} ${b.x},${b.y}`}
                    fill="none"
                    stroke={
                      e.fruit
                        ? "#ff7900"
                        : `url(#bark-${compact ? "mini" : "full"})`
                    }
                    strokeWidth={e.main ? 12 : e.fruit ? 2 : 5}
                    strokeLinecap="round"
                    opacity={isolated && !focusIds.has(e.to) ? 0.16 : 1}
                  />
                );
              })}
              {sel &&
                linked.map((n) => {
                  const a = layout.points.get(sel.id),
                    b = layout.points.get(n.id);
                  return a && b ? (
                    <path
                      key={"link" + n.id}
                      d={`M${a.x},${a.y} Q0,${Math.min(a.y, b.y) - 60} ${b.x},${b.y}`}
                      stroke="#ff7900"
                      strokeWidth="2"
                      strokeDasharray="5 7"
                      fill="none"
                    />
                  ) : null;
                })}
              {[...layout.points].map(([id, p]) => {
                const n = p.n,
                  fruit = n?.kind === "fruit",
                  active = id === selected;
                return (
                  <g
                    key={id}
                    transform={`translate(${p.x} ${p.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={
                      p.root
                        ? area.name
                        : p.branch
                          ? "Branch: " + n.title
                          : (fruit ? "Fruit: " : "Concept: ") + n.title
                    }
                    className={"orchard-node " + (active ? "is-selected" : "")}
                    opacity={
                      isolated && !p.root && !p.branch && !focusIds.has(id)
                        ? 0.12
                        : 1
                    }
                    onClick={() => {
                      if (p.root) {
                        setSelected(null);
                        setIsolated(false);
                      } else if (p.branch) {
                        setBranch(n.subAreaId);
                        setSelected(null);
                      } else open(n);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.currentTarget.dispatchEvent(
                          new MouseEvent("click", { bubbles: true }),
                        );
                      }
                    }}
                  >
                    {p.root ? (
                      <>
                        <path
                          d="M-12 26 Q-16 70 -60 86 M0 24 V95 M14 26 Q20 65 64 84"
                          stroke="#082b96"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                        />
                        <rect
                          x="-110"
                          y="-37"
                          width="220"
                          height="74"
                          rx="28"
                          fill="#082b96"
                        />
                        <text
                          textAnchor="middle"
                          fill="white"
                          y="-8"
                          fontSize="10"
                          letterSpacing="2"
                        >
                          LIFE AREA · ROOT
                        </text>
                        <text
                          textAnchor="middle"
                          fill="white"
                          y="15"
                          fontSize="14"
                        >
                          {area.name.length > 27
                            ? area.name.slice(0, 25) + "…"
                            : area.name}
                        </text>
                      </>
                    ) : fruit ? (
                      <>
                        <path
                          d="M0 -22 Q-2 -39 11 -39"
                          stroke="#07529a"
                          strokeWidth="3"
                          fill="none"
                        />
                        <ellipse
                          cx="13"
                          cy="-34"
                          rx="12"
                          ry="5"
                          transform="rotate(-25 13 -34)"
                          fill="#009cde"
                        />
                        <circle
                          r="24"
                          fill={active ? "#ffd7b0" : "#ff7900"}
                          stroke={active ? "#082b96" : "#d96300"}
                          strokeWidth="2"
                        />
                        <path
                          d="M-12 -10 Q-17 -4 -15 4"
                          stroke="#fff"
                          strokeWidth="3"
                          opacity=".6"
                          fill="none"
                        />
                        <text
                          textAnchor="middle"
                          y="45"
                          fontSize="12"
                          fill="#102c54"
                        >
                          {n.title.length > 23
                            ? n.title.slice(0, 21) + "…"
                            : n.title}
                        </text>
                      </>
                    ) : (
                      <>
                        <rect
                          x="-86"
                          y="-24"
                          width="172"
                          height="48"
                          rx={p.branch ? 20 : 10}
                          fill={
                            active ? "#dcefff" : p.branch ? "#e7efff" : "#fff"
                          }
                          stroke={active ? "#ff7900" : "#a9c5e5"}
                          strokeWidth={active ? 3 : 1}
                        />
                        <text
                          textAnchor="middle"
                          y="-7"
                          fontSize="8"
                          fill="#586e8a"
                          letterSpacing="1"
                        >
                          {p.branch ? "SUB-AREA" : "CONCEPT"}
                        </text>
                        <text
                          textAnchor="middle"
                          y="11"
                          fontSize="12"
                          fill="#102c54"
                        >
                          {n.title.length > 23
                            ? n.title.slice(0, 21) + "…"
                            : n.title}
                        </text>
                      </>
                    )}
                    <title>{p.root ? area.name : n.title}</title>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="orchard-view-controls">
            <button
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.35, z - 0.15))}
            >
              <Minus size={16} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setIsolated(false);
              }}
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <label>
              <input
                type="checkbox"
                checked={allBranches}
                onChange={(e) => setAll(e.target.checked)}
              />
              Show empty branches
            </label>
          </div>
        </section>
        {!compact && (
          <aside className="card orchard-detail">
            {sel ? (
              <>
                <div className="orchard-eyebrow">
                  {sel.kind === "fruit" ? "KNOWLEDGE FRUIT" : "CONCEPT BRANCH"}
                </div>
                <h2>{sel.title}</h2>
                <p className="muted">
                  {area.name} /{" "}
                  {area.subAreas.find((s) => s.id === loc(sel).subAreaId)
                    ?.name ||
                    (sel.standalone
                      ? "Independent concepts"
                      : "Choose a sub-area")}
                </p>
                {sel.kind === "fruit" ? (
                  <>
                    <Button primary onClick={() => setAction("content")}>
                      Open content
                    </Button>
                    <Button onClick={() => setEditor({ ...sel, ...loc(sel) })}>
                      Edit fruit & placement
                    </Button>
                    <p className="fruit-closed">
                      Explore this idea in layers, study its depth, test
                      yourself, and put it to work.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="orchard-text">
                      {sel.description ||
                        "Grow this concept with explanations, examples and knowledge fruits."}
                    </p>
                    <Button onClick={() => create("fruit", sel)}>
                      <Cherry size={16} />
                      Grow a fruit
                    </Button>
                    <Button onClick={() => create("concept", sel)}>
                      <Plus size={16} />
                      Grow a sub-concept
                    </Button>
                    <Button
                      onClick={() =>
                        setEditor({
                          ...sel,
                          ...loc(sel),
                          parent: isScaffold(
                            data.concepts.find((n) => n.id === sel.parent) ||
                              {},
                          )
                            ? ""
                            : sel.parent,
                        })
                      }
                    >
                      Edit concept & placement
                    </Button>

                    <Field label="Understanding">
                      <select
                        value={sel.status}
                        onChange={(e) =>
                          update({ ...sel, status: e.target.value })
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
                          update({ ...sel, applied: e.target.checked })
                        }
                      />
                      I have applied this concept
                    </label>
                    <Button
                      onClick={() => {
                        update({ ...sel, reviewed: new Date().toISOString() });
                        notify("Review recorded.");
                      }}
                    >
                      Mark reviewed today
                    </Button>
                  </>
                )}
                <div className="fruit-actions" aria-label="Knowledge actions">
                  {[
                    ["peel", "Peel"],
                    ["squeeze", "Squeeze"],
                    ["taste", "Taste"],
                    ["apply", "Apply"],
                    ["pluck", "Pluck"],
                    ["connect", "Graft"],
                    ["isolate", "Isolate"],
                    ["compost", "Compost"],
                  ].map(([key, label]) => (
                    <Button key={key} onClick={() => setAction(key)}>
                      {label}
                    </Button>
                  ))}
                </div>
                <h3>Grafted ideas</h3>
                {linked.length ? (
                  linked.map((n) => (
                    <button
                      className="orchard-connection"
                      key={n.id}
                      onClick={() => open(n)}
                    >
                      <Link size={14} />
                      <span>
                        {n.title}
                        {sel.grafts?.[n.id] && (
                          <small>
                            {sel.grafts[n.id].relationship} ·{" "}
                            {sel.grafts[n.id].note}
                          </small>
                        )}
                        <small>
                          {
                            data.lifeAreas.find((a) => a.id === loc(n).areaId)
                              ?.name
                          }
                        </small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="muted">
                    No connections yet. Connect ideas within this tree or across
                    your orchard.
                  </p>
                )}
                {sel.kind !== "fruit" && (
                  <>
                    <h3>Notes & resources</h3>
                    {data.notes
                      .filter((n) => n.concepts?.includes(sel.id))
                      .map((n) => (
                        <blockquote key={n.id}>
                          {n.quote && <mark>{n.quote}</mark>}
                          <p>{n.text}</p>
                        </blockquote>
                      ))}
                  </>
                )}
              </>
            ) : (
              <div className="orchard-welcome">
                <Sprout size={42} />
                <h2>A place for every idea.</h2>
                <p>
                  Your life area is the root. Choose a sub-area branch and plant
                  a concept. Then grow fruits filled with your own knowledge.
                </p>
                <p>
                  Click a fruit for its actions. Its text stays tucked away
                  until you open it.
                </p>
                <small>
                  Older concepts stay on “Choose a sub-area” until you place
                  them. Manage life areas and sub-areas under Goals.
                </small>
              </div>
            )}
          </aside>
        )}
      </div>
      {editor && (
        <NodeEditor
          node={editor}
          data={data}
          close={() => setEditor(null)}
          submit={(n) => {
            save((d) => saveTreeNode(d, n));
            setEditor(null);
            setSelected(n.id);
            setArea(n.areaId);
            setBranch(n.subAreaId);
            notify(n.kind === "fruit" ? "Fruit saved." : "Concept planted.");
          }}
        />
      )}
      {action === "suggestions" && (
        <Modal
          title="Growth suggestions for this tree"
          onClose={() => setAction(null)}
        >
          <p>
            Based on prerequisites, connections, applications and review dates
            in this life area.
          </p>
          <div className="orchard-suggestions">
            {insights(nodes).map((s) => (
              <section key={s.id}>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <Button
                  onClick={() => {
                    const n = nodes.find((n) => n.id === s.concept);
                    if (n) open(n);
                    setAction(null);
                  }}
                >
                  Explore concept
                </Button>
              </section>
            ))}
            {!insights(nodes).length && (
              <p>
                Plant concepts and connect ideas to start finding growth
                opportunities.
              </p>
            )}
          </div>
        </Modal>
      )}
      {action === "trash" && (
        <Modal title="Compost" onClose={() => setAction(null)}>
          <p>
            Composted ideas are hidden from trees. Restoring keeps their text,
            learning history and connections.
          </p>
          {data.concepts
            .filter((n) => n.trashedAt)
            .map((n) => (
              <div className="orchard-bin-row" key={n.id}>
                <span>
                  {n.title}
                  <small>
                    {data.lifeAreas.find((a) => a.id === loc(n).areaId)?.name}
                  </small>
                </span>
                <Button onClick={() => save((d) => restoreNode(d, n.id))}>
                  Restore
                </Button>
              </div>
            ))}
          {!data.concepts.some((n) => n.trashedAt) && (
            <p>Your compost is empty.</p>
          )}
        </Modal>
      )}
      {sel &&
        ["content", "peel", "squeeze", "taste", "apply", "isolate"].includes(
          action,
        ) && (
          <KnowledgeActions
            key={sel.id + action}
            node={sel}
            mode={action}
            data={data}
            persist={(patch) => update({ ...sel, ...patch })}
            close={() => setAction(null)}
          />
        )}
      {sel && action === "pluck" && (
        <Modal title={"Pluck · " + sel.title} onClose={() => setAction(null)}>
          <p>
            This idea will become an independent concept in {area.name}, ready
            to grow its own branches and fruits. Its text, history, links and ID
            stay intact.
          </p>
          <Button
            primary
            onClick={() => {
              save((d) => pluckNode(d, sel.id));
              setAction(null);
              notify("Idea plucked into an independent concept.");
            }}
          >
            Make independent
          </Button>
        </Modal>
      )}
      {sel && action === "compost" && (
        <Modal title={"Compost · " + sel.title} onClose={() => setAction(null)}>
          <p>
            Move this idea and its{" "}
            {Math.max(0, descendants(sel.id, data.concepts).size - 1)}{" "}
            descendants out of the active tree. Text, notes, learning history
            and connections will be preserved. You can restore them from
            Compost.
          </p>
          <Button
            onClick={() => {
              save((d) => compostNode(d, sel.id));
              setSelected(null);
              setAction(null);
              notify("Idea preserved in Compost.");
            }}
          >
            Move to Compost
          </Button>
        </Modal>
      )}
      {sel && action === "connect" && (
        <Connections
          key={sel.id}
          node={sel}
          data={data}
          close={() => setAction(null)}
          submit={(ids, details) => {
            save((d) => connectNodes(d, sel.id, ids, details));
            setAction(null);
            notify("Grafts saved; each idea keeps its primary home.");
          }}
        />
      )}
    </div>
  );
}
function NodeEditor({ node, data, close, submit }) {
  const [v, setV] = useState(node),
    [error, setError] = useState("");
  const area = data.lifeAreas.find((a) => a.id === v.areaId);
  const excluded = descendants(v.id, data.concepts);
  return (
    <Modal
      title={v.kind === "fruit" ? "Grow a knowledge fruit" : "Plant a concept"}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            saveTreeNode(data, v);
            submit(v);
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <Field label={v.kind === "fruit" ? "Fruit name" : "Concept name"}>
          <input
            autoFocus
            required
            value={v.title}
            onChange={(e) => setV({ ...v, title: e.target.value })}
          />
        </Field>
        {v.kind !== "fruit" && (
          <>
            <Field label="Life area">
              <select
                value={v.areaId}
                onChange={(e) =>
                  setV({
                    ...v,
                    areaId: e.target.value,
                    subAreaId: "",
                    parent: "",
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
            <Field label="Sub-area">
              <select
                value={v.subAreaId}
                onChange={(e) =>
                  setV({ ...v, subAreaId: e.target.value, parent: "" })
                }
              >
                <option value="">Choose a sub-area</option>
                {area.subAreas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        <Field label="Grows from">
          <select
            required={v.kind === "fruit"}
            value={v.parent || ""}
            onChange={(e) => {
              const p = data.concepts.find((n) => n.id === e.target.value);
              setV({
                ...v,
                parent: e.target.value,
                ...(p ? locationOf(p, data.concepts, data.lifeAreas) : {}),
              });
            }}
          >
            {v.kind !== "fruit" && (
              <option value="">Directly from the sub-area branch</option>
            )}
            {data.concepts
              .filter(
                (n) =>
                  !isScaffold(n) &&
                  !n.trashedAt &&
                  n.kind !== "fruit" &&
                  !excluded.has(n.id) &&
                  locationOf(n, data.concepts, data.lifeAreas).areaId ===
                    v.areaId,
              )
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
          </select>
        </Field>
        <Field
          label={
            v.kind === "fruit"
              ? "Fruit content"
              : "Your explanation, examples & questions"
          }
        >
          <textarea
            rows={7}
            value={v.description || ""}
            onChange={(e) => setV({ ...v, description: e.target.value })}
          />
        </Field>
        {v.kind !== "fruit" && (
          <Field label="Prerequisites (comma-separated concept names)">
            <input
              value={(v.prerequisites || []).join(", ")}
              onChange={(e) =>
                setV({ ...v, prerequisites: e.target.value.split(",") })
              }
            />
          </Field>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="form-actions">
          <Button primary type="submit">
            {v.kind === "fruit" ? "Save fruit" : "Save concept"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function Connections({ node, data, close, submit }) {
  const [ids, setIds] = useState(
      connectionsOf(node, data.concepts).map((n) => n.id),
    ),
    [query, setQuery] = useState(""),
    [details, setDetails] = useState(node.grafts || {}),
    [error, setError] = useState("");
  return (
    <Modal title={"Graft · " + node.title} onClose={close}>
      <p>
        Create a meaningful relationship across any tree. Neither idea changes
        its primary home.
      </p>
      <Field label="Find an idea">
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </Field>
      <div className="orchard-connect-list">
        {data.concepts
          .filter(
            (n) =>
              !isScaffold(n) &&
              !n.trashedAt &&
              n.id !== node.id &&
              n.title.toLowerCase().includes(query.toLowerCase()),
          )
          .map((n) => (
            <label key={n.id}>
              <input
                type="checkbox"
                checked={ids.includes(n.id)}
                onChange={(e) =>
                  setIds(
                    e.target.checked
                      ? [...ids, n.id]
                      : ids.filter((id) => id !== n.id),
                  )
                }
              />
              <span>
                {n.title}
                <small>
                  {
                    data.lifeAreas.find(
                      (a) =>
                        a.id ===
                        locationOf(n, data.concepts, data.lifeAreas).areaId,
                    )?.name
                  }
                </small>
              </span>
            </label>
          ))}
      </div>
      <div className="graft-details">
        {ids.map((id) => (
          <section key={id}>
            <h3>
              {node.title} ↔ {data.concepts.find((n) => n.id === id)?.title}
            </h3>
            <Field
              label={
                "Relationship with " +
                data.concepts.find((n) => n.id === id)?.title
              }
            >
              <select
                value={details[id]?.relationship || "Related idea"}
                onChange={(e) =>
                  setDetails({
                    ...details,
                    [id]: {
                      ...details[id],
                      relationship: e.target.value,
                      sourceId: node.id,
                    },
                  })
                }
              >
                {[
                  "Related idea",
                  "Prerequisite",
                  "Example",
                  "Contrast",
                  "Evidence",
                  "Application",
                  "Shared principle",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field
              label={
                "Why connect to " +
                data.concepts.find((n) => n.id === id)?.title +
                "?"
              }
            >
              <textarea
                value={details[id]?.note || ""}
                placeholder="Explain what connects these ideas and why it matters."
                onChange={(e) =>
                  setDetails({
                    ...details,
                    [id]: {
                      relationship: details[id]?.relationship || "Related idea",
                      note: e.target.value,
                      sourceId: node.id,
                    },
                  })
                }
              />
            </Field>
          </section>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      <Button
        primary
        onClick={() => {
          const old = connectionsOf(node, data.concepts).map((n) => n.id);
          if (
            ids.some((id) => !old.includes(id) && !details[id]?.note?.trim())
          ) {
            setError("Describe the meaning of each new graft.");
            return;
          }
          submit(ids, details);
        }}
      >
        Save grafts
      </Button>
    </Modal>
  );
}
