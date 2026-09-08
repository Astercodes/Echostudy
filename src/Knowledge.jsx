import React, { useMemo, useState, useRef, useEffect, useId } from "react";
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
  knowledgeEntries,
  isScopeNode,
  scopeId,
  saveKnowledgeEntry,
  graftKnowledge,
  knowledgeLabel,
  plantSeed,
  growSeed,
} from "./knowledge-tree";
import "./knowledge-tree.css";
import KnowledgeActions from "./KnowledgeActions";
import KnowledgePlant from "./KnowledgePlant";
import { VoiceField } from "./VoiceField";

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
export default function Knowledge(props) {
  const [tabs, setTabs] = useState([]),
    [active, setActive] = useState("ecosystem");
  if (props.compact) return <KnowledgeView {...props} />;
  const entries = knowledgeEntries(props.data);
  const focus = (node) => {
    setTabs((current) =>
      current.includes(node.id) ? current : [...current, node.id],
    );
    setActive(node.id);
  };
  const close = (id) => {
    setTabs((current) => current.filter((key) => key !== id));
    if (active === id) setActive("ecosystem");
  };
  return (
    <div className="ecosystem-tabs-workspace">
      <div
        className="ecosystem-tabs"
        role="tablist"
        aria-label="Knowledge Ecosystem workspaces"
      >
        <button
          type="button"
          role="tab"
          id="ecosystem-tab"
          aria-controls="ecosystem-panel"
          aria-selected={active === "ecosystem"}
          onClick={() => setActive("ecosystem")}
        >
          Knowledge Ecosystem
        </button>
        {tabs.map((id) => {
          const node = entries.find((n) => n.id === id);
          return (
            <div className="ecosystem-tab-item" key={id}>
              <button
                type="button"
                role="tab"
                id={"focus-tab-" + id}
                aria-controls={"focus-panel-" + id}
                aria-selected={active === id}
                onClick={() => setActive(id)}
              >
                {node?.title || "Unavailable workspace"}
              </button>
              <button
                type="button"
                aria-label={
                  "Close focus: " + (node?.title || "Unavailable workspace")
                }
                onClick={() => close(id)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id="ecosystem-panel"
        aria-labelledby="ecosystem-tab"
        hidden={active !== "ecosystem"}
      >
        <KnowledgeView {...props} onFocus={focus} />
      </div>
      {tabs.map((id) => {
        const node = entries.find((n) => n.id === id && !n.trashedAt);
        return (
          <div
            role="tabpanel"
            id={"focus-panel-" + id}
            aria-labelledby={"focus-tab-" + id}
            hidden={active !== id}
            key={id}
          >
            {node ? (
              <KnowledgeView {...props} focusNode={node} onFocus={focus} />
            ) : (
              <p>
                This knowledge is no longer active. Return to the ecosystem to
                restore it from Pruned knowledge.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
function KnowledgeView({
  data,
  save,
  compact = false,
  notify = () => {},
  onFocus,
  focusNode,
}) {
  const barkId = "bark-" + useId().replace(/:/g, "");
  const [areaId, setArea] = useState(
    data.lifeAreas.find((a) => a.id === "knowledge")?.id ||
      data.lifeAreas[0]?.id,
  );
  const [selected, setSelected] = useState(focusNode?.id || null),
    [editor, setEditor] = useState(null),
    [action, setAction] = useState(null),
    [isolated, setIsolated] = useState(false),
    [search, setSearch] = useState(""),
    [zoom, setZoom] = useState(1),
    [branchId, setBranch] = useState(""),
    [treeId, setTree] = useState("");
  const focusHome = focusNode
    ? locationOf(focusNode, data.concepts, data.lifeAreas)
    : null;
  const area =
    data.lifeAreas.find((a) => a.id === (focusHome?.areaId || areaId)) ||
    data.lifeAreas[0];
  const entries = useMemo(() => knowledgeEntries(data), [data]);
  const forestNodes = treeNodes(data, area?.id);
  const effectiveGrove = focusHome ? focusHome.subAreaId : branchId;
  const groveNodes = effectiveGrove
    ? forestNodes.filter(
        (n) =>
          locationOf(n, data.concepts, data.lifeAreas).subAreaId ===
          effectiveGrove,
      )
    : forestNodes;
  const focusTree = groveNodes.find(
    (n) =>
      n.id === (focusNode?.kind === "tree" ? focusNode.id : treeId) &&
      n.kind === "tree",
  );
  const focusedKnowledge =
    focusNode && !isScopeNode(focusNode) ? focusNode : focusTree;
  const treeIds = focusedKnowledge
    ? descendants(focusedKnowledge.id, groveNodes)
    : null;
  // Keep the path to the focused object so even an atomic leaf or fruit
  // remains attached by visible blue connections, without sibling subtrees.
  if (treeIds && focusNode) {
    let parent = groveNodes.find((n) => n.id === focusedKnowledge.parent);
    while (parent && !treeIds.has(parent.id)) {
      treeIds.add(parent.id);
      parent = groveNodes.find((n) => n.id === parent.parent);
    }
  }
  const displayedGrove =
    effectiveGrove ||
    (focusTree
      ? locationOf(focusTree, data.concepts, data.lifeAreas).subAreaId
      : "");
  const nodes = treeIds
      ? groveNodes.filter((n) => treeIds.has(n.id))
      : groveNodes,
    sel = entries.find(
      (n) => n.id === selected && (!n.trashedAt || isScopeNode(n)),
    );
  const loc = (n) => locationOf(n, data.concepts, data.lifeAreas);
  const open = (n) => {
    setArea(loc(n).areaId);
    if (branchId && loc(n).subAreaId !== branchId) setBranch(loc(n).subAreaId);
    if (treeIds && !treeIds.has(n.id)) setTree("");
    setSelected(n.id);
    setIsolated(false);
  };
  const branches = (() => {
    if (entries.find((n) => n.id === scopeId(area.id))?.trashedAt) return [];
    const groups = area.subAreas
      .filter(
        (s) =>
          (!displayedGrove || s.id === displayedGrove) &&
          !entries.find((n) => n.id === scopeId(area.id, s.id))?.trashedAt,
      )
      .map((s) => ({
        ...s,
        id: "branch:" + s.id,
        subAreaId: s.id,
        title: s.name,
      }));
    if (!displayedGrove)
      groups.unshift({
        id: "branch:independent",
        subAreaId: "",
        title: "Independent knowledge & seeds",
        independent: true,
      });
    if (
      !displayedGrove &&
      nodes.some((n) => !loc(n).subAreaId && !n.standalone)
    )
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
      .filter((b) => !b.independent || b.nodes.length > 0);
  })();
  const layout = growLayout(nodes, branches);
  const canvas = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(900);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth) setCanvasWidth(el.clientWidth);
    });
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
  }, [area.id, zoom, branchId, treeId, canvasWidth]);
  const linked = sel ? connectionsOf(sel, entries) : [];
  const focusIds = new Set(
    sel ? [sel.id, sel.parent, ...linked.map((n) => n.id)] : [],
  );
  const create = (kind, parent) => {
    const l = parent
      ? loc(parent)
      : {
          areaId: area.id,
          subAreaId: effectiveGrove || area.subAreas[0]?.id || "",
        };
    const archived = entries.find(
      (n) =>
        n.trashedAt &&
        (n.id === scopeId(l.areaId) || n.id === scopeId(l.areaId, l.subAreaId)),
    );
    if (archived) {
      setSelected(archived.id);
      notify("Restore this knowledge workspace before growing it.");
      return;
    }
    setEditor({
      id: uid(),
      kind:
        kind === "concept" && parent && !isScopeNode(parent) ? "leaf" : kind,
      title: "",
      description: "",
      summary: "",
      parent: parent && !isScopeNode(parent) ? parent.id : "",
      ...l,
      domain: parent?.domain || 0,
      status: "Growing",
      prerequisites: [],
      links: [],
    });
  };
  const update = (n) => save((d) => saveKnowledgeEntry(d, n));
  if (!area)
    return <p>Create a life area under Goals to plant your first tree.</p>;
  return (
    <div className={"orchard " + (compact ? "orchard-compact" : "")}>
      <div className="orchard-header">
        <div>
          <span className="orchard-eyebrow">
            {focusNode ? "FOCUSED WORKSPACE" : "YOUR KNOWLEDGE ECOSYSTEM"}
          </span>
          <h2>{focusNode?.title || area.name}</h2>
          <p>
            One life area. A forest of knowledge, with a grove for each
            sub-area.
          </p>
        </div>
        {!focusNode && (
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
        )}
      </div>
      {!compact && (
        <div className="orchard-toolbar">
          {!focusNode && (
            <Field label="Grove (sub-area)">
              <select
                value={branchId}
                onChange={(e) => {
                  setBranch(e.target.value);
                  setTree("");
                  setSelected(null);
                  setSearch("");
                  setIsolated(false);
                }}
              >
                <option value="">All groves in this forest</option>
                {area.subAreas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {(!focusNode || isScopeNode(focusNode)) && (
            <Field label="Knowledge tree">
              <select
                value={focusTree?.id || ""}
                onChange={(e) => {
                  setTree(e.target.value);
                  setSelected(e.target.value || null);
                }}
              >
                <option value="">
                  {effectiveGrove
                    ? "All trees in this grove"
                    : "All trees in this forest"}
                </option>
                {groveNodes
                  .filter((n) => n.kind === "tree")
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          {(!focusNode || isScopeNode(focusNode)) && (
            <Button
              primary
              onClick={() => {
                setTree("");
                create("tree");
              }}
            >
              <Plus size={16} />
              Add tree
            </Button>
          )}
          <Button onClick={() => setAction("suggestions")}>
            Growth suggestions
          </Button>
          <Button onClick={() => setAction("trash")}>
            <Trash2 size={16} />
            Pruned knowledge
          </Button>
          <label className="orchard-search">
            <Search size={16} />
            <input
              aria-label="Search this tree"
              placeholder="Find a branch, leaf, fruit or seed"
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
                {knowledgeLabel(n, data.concepts)} · {n.title}
              </button>
            ))}
        </div>
      )}
      <div className="orchard-workspace">
        <section className="card orchard-stage">
          <div className="orchard-legend">
            <span>
              <Sprout size={16} /> Forest → grove → tree · Roots, stem,
              branches, leaves & fruits
            </span>
            <span>
              {nodes.filter((n) => n.kind !== "fruit").length} knowledge objects
              · {nodes.filter((n) => n.kind === "fruit").length} fruits
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
                <linearGradient id={barkId}>
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
                    data-knowledge-connection="true"
                    stroke={
                      e.fruit && !focusNode ? "#ff7900" : `url(#${barkId})`
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
                  active =
                    (p.root
                      ? scopeId(area.id)
                      : p.branch && n.subAreaId
                        ? scopeId(area.id, n.subAreaId)
                        : id) === selected;
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
                          ? "Grove: " + n.title
                          : knowledgeLabel(n, data.concepts) + ": " + n.title
                    }
                    className={"orchard-node " + (active ? "is-selected" : "")}
                    opacity={
                      isolated && !p.root && !p.branch && !focusIds.has(id)
                        ? 0.12
                        : 1
                    }
                    onClick={() => {
                      if (p.root) {
                        setSelected(scopeId(area.id));
                        setIsolated(false);
                      } else if (p.branch) {
                        setBranch(n.subAreaId);
                        setTree("");
                        setSelected(
                          n.subAreaId ? scopeId(area.id, n.subAreaId) : null,
                        );
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
                          LIFE AREA · FOREST
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
                          {p.branch
                            ? "GROVE"
                            : knowledgeLabel(n, data.concepts).toUpperCase()}
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
          </div>
        </section>
        {!compact && (
          <aside className="card orchard-detail">
            {sel ? (
              <>
                <div className="orchard-eyebrow">
                  {sel.kind === "life-area"
                    ? "LIFE-AREA FOREST"
                    : sel.kind === "sub-area"
                      ? "GROVE"
                      : sel.kind === "fruit"
                        ? "KNOWLEDGE FRUIT"
                        : knowledgeLabel(sel, data.concepts).toUpperCase()}
                </div>
                <h2>{sel.title}</h2>
                {sel.lineage && (
                  <p className="muted">
                    {sel.lineage.action === "plant"
                      ? "Planted from"
                      : "Plucked from"}
                    : {sel.lineage.path}
                  </p>
                )}
                {sel.lineage &&
                  entries.some(
                    (n) => n.id === sel.lineage.sourceId && !n.trashedAt,
                  ) && (
                    <Button
                      onClick={() =>
                        open(entries.find((n) => n.id === sel.lineage.sourceId))
                      }
                    >
                      Open original source
                    </Button>
                  )}
                {sel.kind === "seed" && (
                  <Button primary onClick={() => setAction("grow-seed")}>
                    Grow seed
                  </Button>
                )}
                {onFocus && !isScaffold(sel) && !sel.trashedAt && (
                  <Button primary onClick={() => onFocus(sel)}>
                    Focus on this{" "}
                    {knowledgeLabel(sel, data.concepts).toLowerCase()}
                  </Button>
                )}
                <p className="muted">
                  {area.name} /{" "}
                  {area.subAreas.find((s) => s.id === loc(sel).subAreaId)
                    ?.name ||
                    (sel.kind === "life-area"
                      ? "Forest workspace"
                      : sel.standalone
                        ? "Independent knowledge & seeds"
                        : "Choose a sub-area")}
                </p>
                {isScopeNode(sel) ? (
                  <>
                    {sel.trashedAt ? (
                      <>
                        <p>This knowledge workspace has been pruned.</p>
                        <Button
                          onClick={() => save((d) => restoreNode(d, sel.id))}
                        >
                          Restore workspace
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="orchard-text">
                          {sel.description ||
                            "Explore this whole area of knowledge. Each action saves work here, separately from its concepts."}
                        </p>
                        <Button primary onClick={() => setAction("content")}>
                          Open content
                        </Button>
                        <Button onClick={() => create("tree", sel)}>
                          Grow a tree
                        </Button>
                      </>
                    )}
                  </>
                ) : sel.kind === "fruit" ? (
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
                    {sel.kind === "tree" && (
                      <>
                        <Button onClick={() => create("foundation", sel)}>
                          Add root
                        </Button>
                        <Button onClick={() => create("stem", sel)}>
                          Add stem
                        </Button>
                        <Button onClick={() => create("branch", sel)}>
                          Grow a branch
                        </Button>
                      </>
                    )}
                    {["branch", "sub-branch"].includes(sel.kind) && (
                      <>
                        <Button onClick={() => create("sub-branch", sel)}>
                          Grow a sub-branch
                        </Button>
                        <Button onClick={() => create("fruit", sel)}>
                          Grow a fruit
                        </Button>
                      </>
                    )}
                    {["foundation", "stem", "sub-branch"].includes(
                      sel.kind,
                    ) && (
                      <Button onClick={() => create("leaf", sel)}>
                        Grow a leaf
                      </Button>
                    )}
                    {knowledgeLabel(sel, data.concepts) === "Leaf" && (
                      <Button onClick={() => create("fruit", sel)}>
                        <Cherry size={16} />
                        Grow a fruit
                      </Button>
                    )}
                    {knowledgeLabel(sel, data.concepts) === "Branch" && (
                      <Button onClick={() => create("concept", sel)}>
                        <Plus size={16} />
                        Grow a leaf
                      </Button>
                    )}
                    {knowledgeLabel(sel, data.concepts) === "Leaf" && (
                      <p className="muted">
                        Atomic knowledge: a definition, fact, formula,
                        principle, term, example or distinction. Grow fruits to
                        explore what follows from it.
                      </p>
                    )}
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
                      Edit knowledge & placement
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
                    ["chew", "Chew"],
                    ["regurgitate", "Regurgitate"],
                    ["absorb", "Absorb / Take Root"],
                    ["taste", "Taste"],
                    ["apply", "Apply"],
                    ["plant", "Plant"],
                    ["pluck", "Pluck"],
                    ["connect", "Graft"],
                    ["compost", "Prune"],
                  ].map(([key, label]) => (
                    <Button
                      key={key}
                      disabled={Boolean(sel.trashedAt)}
                      onClick={() => setAction(key)}
                    >
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
                    No grafts yet. Graft ideas within this tree or across your
                    orchard.
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
                  Each life area is a forest; each sub-area is a grove. Grow
                  topic trees with foundational roots, a core stem, branches and
                  sub-branches. Leaves hold atomic knowledge, fruits support
                  deep study, and seeds hold new questions.
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
            notify(knowledgeLabel(n, data.concepts) + " saved.");
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
                  Explore knowledge
                </Button>
              </section>
            ))}
            {!insights(nodes).length && (
              <p>
                Grow branches and graft ideas to start finding growth
                opportunities.
              </p>
            )}
          </div>
        </Modal>
      )}
      {action === "trash" && (
        <Modal title="Pruned knowledge" onClose={() => setAction(null)}>
          <p>
            Pruned ideas are hidden from trees. Restoring keeps their text,
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
        [
          "content",
          "peel",
          "squeeze",
          "chew",
          "regurgitate",
          "absorb",
          "taste",
          "apply",
          "isolate",
        ].includes(action) && (
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
            Create an independent copy to study by itself. The original, its
            descendants and its home remain intact. The copy keeps its text,
            learning history, grafts and source lineage.
          </p>
          <Button
            primary
            onClick={() => {
              const next = pluckNode(data, sel.id);
              const copy = next.concepts.find(
                (n) => !data.concepts.some((old) => old.id === n.id),
              );
              save(next);
              setSelected(copy.id);
              setAction("isolate");
              notify("Independent copy created. The original is preserved.");
            }}
          >
            Copy & study independently
          </Button>
          {!isScopeNode(sel) && (
            <details>
              <summary>Move instead of copy</summary>
              <p>
                This relocates the original and its descendants into independent
                knowledge. Its lineage is retained.
              </p>
              <Button
                onClick={() => {
                  save((d) => pluckNode(d, sel.id, { move: true }));
                  setAction("isolate");
                }}
              >
                Move original & study independently
              </Button>
            </details>
          )}
        </Modal>
      )}
      {sel && ["plant", "grow-seed"].includes(action) && (
        <KnowledgePlant
          key={sel.id + action}
          node={sel}
          data={data}
          grow={action === "grow-seed"}
          close={() => setAction(null)}
          submit={(draft) => {
            const next =
              action === "plant"
                ? plantSeed(data, sel.id, draft)
                : growSeed(data, sel.id, draft);
            const target =
              action === "plant"
                ? next.concepts.find(
                    (n) => !data.concepts.some((old) => old.id === n.id),
                  )
                : next.concepts.find((n) => n.id === sel.id);
            save(next);
            setArea(target.areaId);
            setSelected(target.id);
            setAction(null);
            notify(
              action === "plant"
                ? "Seed planted with its source preserved."
                : "Your seed has grown into a branch.",
            );
          }}
        />
      )}
      {sel && action === "compost" && (
        <Modal title={"Prune · " + sel.title} onClose={() => setAction(null)}>
          <p>
            Remove knowledge that does not belong, is redundant, incorrect, or
            no longer useful. Pruning is recoverable.
          </p>
          {isScopeNode(sel) ? (
            <p>
              Archive this knowledge workspace and its knowledge branches.
              Notes, history and connections are preserved for restoration. The
              life-area catalog and its goals remain available.
            </p>
          ) : (
            <p>
              Move this idea and its{" "}
              {Math.max(0, descendants(sel.id, data.concepts).size - 1)}{" "}
              descendants out of the active tree. Text, notes, learning history
              and connections will be preserved. You can restore them from
              Pruned knowledge.
            </p>
          )}
          <Button
            onClick={() => {
              save((d) => compostNode(d, sel.id));
              setSelected(null);
              setAction(null);
              notify("Idea preserved in Pruned knowledge.");
            }}
          >
            Prune & preserve
          </Button>
        </Modal>
      )}
      {sel && action === "connect" && (
        <Connections
          key={sel.id}
          node={sel}
          data={{ ...data, concepts: entries }}
          close={() => setAction(null)}
          submit={(ids, details) => {
            save((d) => graftKnowledge(d, sel.id, ids, details));
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
      title={"Grow a " + knowledgeLabel(v, data.concepts).toLowerCase()}
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
        <Field label={knowledgeLabel(v, data.concepts) + " name"}>
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
            <Field label="Grove (sub-area)">
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
              <option value="">Directly from the grove</option>
            )}
            {data.concepts
              .filter(
                (n) =>
                  !isScaffold(n) &&
                  !isScopeNode(n) &&
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
        <VoiceField
          scope={v.id + ":editor"}
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
        </VoiceField>
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
            {"Save " + knowledgeLabel(v, data.concepts).toLowerCase()}
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
            <VoiceField
              scope={node.id + ":graft:" + id}
              slot="explanation"
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
            </VoiceField>
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
