import React, { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { knowledgeLabel } from "./knowledge-tree";
import { Field, Button } from "./App";

function savedText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(savedText).join(" ");
  if (value && typeof value === "object")
    return Object.entries(value)
      .filter(
        ([key]) =>
          !["id", "at", "createdAt", "updatedAt", "questionId"].includes(key),
      )
      .map(([, v]) => savedText(v))
      .join(" ");
  return "";
}
export default function EcosystemSearch({
  nodes,
  data,
  search,
  setSearch,
  open,
}) {
  const [type, setType] = useState(""),
    [status, setStatus] = useState(""),
    [contains, setContains] = useState(""),
    [limit, setLimit] = useState(20);
  const active = Boolean(search.trim() || type || status || contains);
  const results = useMemo(
    () =>
      nodes.filter((n) => {
        if (type && knowledgeLabel(n, data.concepts) !== type) return false;
        if (status && (n.status || "Growing") !== status) return false;
        const notes = (data.notes || []).filter((note) =>
          note.concepts?.includes(n.id),
        );
        const resources = (data.resources || []).filter(
          (r) =>
            r.concepts?.includes(n.id) ||
            r.knowledgeRefs?.some((ref) => ref.nodeId === n.id),
        );
        const content = [
          n.description,
          n.summary,
          savedText(n.learning),
          ...notes.map((note) =>
            [note.text, note.quote].filter(Boolean).join(" "),
          ),
        ]
          .filter(Boolean)
          .join(" ");
        const grafted = Boolean(
          n.links?.length || Object.keys(n.grafts || {}).length,
        );
        if (contains === "content" && !content.trim()) return false;
        if (contains === "resources" && !resources.length) return false;
        if (contains === "grafts" && !grafted) return false;
        if (contains === "unlinked" && grafted) return false;
        const haystack = [n.title, content, ...resources.map((r) => r.title)]
          .join(" ")
          .toLowerCase();
        return search
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .every((word) => haystack.includes(word));
      }),
    [nodes, data, search, type, status, contains],
  );
  const change = (setter, value) => {
    setter(value);
    setLimit(20);
  };
  return (
    <section
      className="ecosystem-search-panel"
      aria-label="Search and filter knowledge"
    >
      <div className="ecosystem-search-row">
        <label className="orchard-search">
          <Search size={19} />
          <input
            aria-label="Search this tree"
            placeholder="Search titles, saved content, study notes or resource names…"
            value={search}
            onChange={(e) => change(setSearch, e.target.value)}
          />
        </label>
        {search && (
          <button
            type="button"
            className="icon-btn"
            aria-label="Clear search text"
            onClick={() => change(setSearch, "")}
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="ecosystem-search-filters">
        <Field label="Knowledge type">
          <select
            value={type}
            onChange={(e) => change(setType, e.target.value)}
          >
            <option value="">All types</option>
            {[
              "Forest",
              "Grove",
              "Tree",
              "Root",
              "Stem",
              "Branch",
              "Sub-branch",
              "Leaf",
              "Fruit",
              "Seed",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Knowledge progress">
          <select
            value={status}
            onChange={(e) => change(setStatus, e.target.value)}
          >
            <option value="">Any progress</option>
            <option>Growing</option>
            <option>Confident</option>
          </select>
        </Field>
        <Field label="Content and connections">
          <select
            value={contains}
            onChange={(e) => change(setContains, e.target.value)}
          >
            <option value="">Everything</option>
            <option value="content">Has saved content</option>
            <option value="resources">Has linked resources</option>
            <option value="grafts">Has grafts</option>
            <option value="unlinked">No grafts yet</option>
          </select>
        </Field>
        {active && (
          <Button
            onClick={() => {
              setSearch("");
              setType("");
              setStatus("");
              setContains("");
              setLimit(20);
            }}
          >
            Clear search & filters
          </Button>
        )}
      </div>
      <small>
        Search within the selected forest, grove or focused tree. Filters
        combine to narrow your results.
      </small>
      {active && (
        <>
          <p className="ecosystem-result-count" role="status">
            {results.length} matching{" "}
            {results.length === 1 ? "source" : "sources"}
          </p>
          <div className="orchard-results">
            {results.slice(0, limit).map((n) => (
              <button key={n.id} onClick={() => open(n)}>
                <strong>{n.title}</strong>
                <small>
                  {knowledgeLabel(n, data.concepts)} · {n.status || "Growing"}
                </small>
              </button>
            ))}
          </div>
          {!results.length && (
            <p className="ecosystem-search-empty">
              No sources match. Try fewer filters or choose a broader forest or
              grove.
            </p>
          )}
          {results.length > limit && (
            <Button onClick={() => setLimit(limit + 20)}>
              Show more results ({results.length - limit})
            </Button>
          )}
        </>
      )}
    </section>
  );
}
