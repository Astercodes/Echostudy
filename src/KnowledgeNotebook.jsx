import React, { useState } from "react";
import { knowledgeLineage } from "./knowledge-tree";
import { SourceOpen } from "./KnowledgeSources";

export default function KnowledgeNotebook({ data, entries, open }) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(0);
  const references = new Map();
  for (const r of data.resources)
    for (const ref of r.knowledgeRefs || []) {
      if (!references.has(ref.nodeId)) references.set(ref.nodeId, []);
      references.get(ref.nodeId).push({ r, ref });
    }
  const records = entries
    .filter((n) => !n.trashedAt)
    .flatMap((node) => {
      const kinds = [];
      if (node.standalone || node.learning?.pluck)
        kinds.push([
          "pluck",
          "Plucked studies",
          node.standalone ? "isolate" : "management-pluck",
        ]);
      if (node.kind === "seed" || node.learning?.plant)
        kinds.push(["plant", "Seeds & planting", "management-plant"]);
      if (Object.keys(node.grafts || {}).length)
        kinds.push(["graft", "Grafts", "connect"]);
      const refs = references.get(node.id) || [];
      if (refs.length) kinds.push(["sources", "Learning resources", "content"]);
      return kinds.map(([kind, title, action]) => ({
        node,
        kind,
        title,
        action,
        refs,
      }));
    });
  const filtered = records.filter(
    ({ node, kind }) =>
      (filter === "all" || kind === filter) &&
      [
        node.title,
        knowledgeLineage(data, node).path,
        node.lineage?.path,
        node.description,
        JSON.stringify(node.learning || {}),
        JSON.stringify(node.grafts || {}),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 10) - 1),
  );
  return (
    <details className="knowledge-notebook">
      <summary>Knowledge Notebook · {records.length} records</summary>
      <p>
        Find independent studies, planting notes, grafts and references across
        all forests. Plucked studies are kept here without adding clutter to the
        map. Existing content and lineage are preserved.
      </p>
      <label>
        Search notebook
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search titles, lineage or saved notes"
        />
      </label>
      <label>
        Notebook collection{" "}
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
        >
          {[
            ["all", "All collections"],
            ["pluck", "Plucked studies"],
            ["plant", "Seeds & planting"],
            ["graft", "Grafts"],
            ["sources", "Learning resources"],
          ].map(([v, t]) => (
            <option value={v} key={v}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <div className="notebook-list">
        {filtered
          .slice(currentPage * 10, currentPage * 10 + 10)
          .map(({ node, kind, title, action, refs }) => (
            <article className="notebook-record" key={node.id + kind}>
              <small>{title}</small>
              <strong>{node.title}</strong>
              <small>{knowledgeLineage(data, node).path}</small>
              {node.lineage && <small>Origin: {node.lineage.path}</small>}
              <div className="row-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => open(node, action)}
                >
                  {kind === "pluck" && node.standalone
                    ? "Resume independent study"
                    : kind === "graft"
                      ? "Review grafts"
                      : kind === "plant"
                        ? "Review planting notes"
                        : "Open content"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => open(node, "content")}
                >
                  Read / edit content
                </button>
              </div>
              {kind === "sources" && (
                <details>
                  <summary>Resource references · {refs.length}</summary>
                  {refs.map(({ r, ref }) => (
                    <article className="source-reference" key={ref.id}>
                      <strong>{r.title}</strong>
                      <p>
                        {ref.action} → {ref.component} · {ref.locator}
                      </p>
                      <p>{ref.citation}</p>
                      <SourceOpen resource={r} />
                    </article>
                  ))}
                </details>
              )}
            </article>
          ))}
      </div>
      {!filtered.length && <p>No matching records yet.</p>}
      {filtered.length > 10 && (
        <div className="row-actions">
          <button
            type="button"
            className="btn"
            disabled={!currentPage}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous records
          </button>
          <span>
            Page {currentPage + 1} of {Math.ceil(filtered.length / 10)}
          </span>
          <button
            type="button"
            className="btn"
            disabled={(currentPage + 1) * 10 >= filtered.length}
            onClick={() => setPage(currentPage + 1)}
          >
            Next records
          </button>
        </div>
      )}
    </details>
  );
}
