import React, { useMemo, useState } from "react";
import { Modal, Button, Field } from "./App";
import { knowledgeIntelligence } from "./knowledge-intelligence";
import "./knowledge-intelligence.css";

export default function KnowledgeIntelligence({ data, focusIds, close, act }) {
  const report = useMemo(
    () => knowledgeIntelligence(data, { focusIds }),
    [data, focusIds],
  );
  const [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [limit, setLimit] = useState(12);
  const categories = [...new Set(report.suggestions.map((s) => s.kind))];
  const visible = report.suggestions.filter(
    (s) =>
      (filter === "all" || filter === s.kind) &&
      `${s.title} ${s.evidence}`.toLowerCase().includes(query.toLowerCase()),
  );
  const labels = {
    peel: "Open Peel",
    squeeze: "Open Squeeze",
    chew: "Open Chew",
    regurgitate: "Practise recall",
    absorb: "Open Absorb",
    test: "Assess understanding",
    plant: "Plant prerequisite",
    connect: "Open Graft",
    content: "Open source",
    edit: "Review prerequisites",
    "grow-seed": "Grow seed",
  };
  return (
    <Modal title="Knowledge intelligence · Growth suggestions" onClose={close}>
      <div className="knowledge-intelligence">
        <p>
          Find what needs attention, why it matters, and what to study next.
          Prerequisites and connection candidates are checked across all your
          forests.
        </p>
        <div className="intelligence-summary">
          <span>
            <strong>{report.scanned}</strong> sources in this view
          </span>
          <span>
            <strong>{report.assessed}</strong> with scored Tests
          </span>
          <span>
            <strong>{report.suggestions.length}</strong> findings to review
          </span>
        </div>
        <p className="intelligence-method">
          Analysis uses your content, graph, self-assessments, references and
          study records. Suggested connections use text and structural matches;
          they require your judgment. Missing records do not prove missing
          ability.
        </p>
        <div className="intelligence-filters">
          <Field label="Gap category">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setLimit(12);
              }}
            >
              <option value="all">All findings</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Search findings">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(12);
              }}
              placeholder="Find a concept or gap"
            />
          </Field>
        </div>
        <div className="intelligence-findings">
          {visible.slice(0, limit).map((s, i) => (
            <article key={s.id} className="intelligence-finding">
              <div className="intelligence-priority">
                {i === 0 && filter === "all" && !query
                  ? "Suggested next step · "
                  : ""}
                {s.priority >= 85
                  ? "High priority"
                  : s.priority >= 60
                    ? "Next to address"
                    : "Worth exploring"}{" "}
                · {s.basis}
              </div>
              <h3>{s.title}</h3>
              <p>{s.evidence}</p>
              {s.goal && <small>Supports your goal: {s.goal}</small>}
              <p className="intelligence-next">{s.next}</p>
              <div className="row-actions">
                <Button primary onClick={() => act(s)}>
                  {labels[s.action] || "Explore"}
                </Button>
                {s.targetId && (
                  <Button
                    onClick={() =>
                      act({
                        ...s,
                        action: "content",
                        concept: s.targetId,
                        targetId: null,
                      })
                    }
                  >
                    Inspect related source
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
        {!visible.length && (
          <p className="empty">
            No findings match this view. This is not a certification of mastery:
            add explicit prerequisites, study notes and Test evidence to reveal
            more gaps.
          </p>
        )}
        {visible.length > limit && (
          <Button onClick={() => setLimit(limit + 12)}>
            Show more findings ({visible.length - limit})
          </Button>
        )}
        <details>
          <summary>How this analysis works</summary>
          <p>
            Latest results for each question take precedence over old failures.
            Self-assessed accuracy below 80%, recorded misconceptions and
            uncertain answers trigger diagnostic follow-up. Prerequisites match
            titles or aliases across the active ecosystem. Review intervals are
            3 days for weak evidence, 14 days for strong assessment results,
            otherwise 7 days. Connections are suggestions, never added
            automatically. Goal relevance increases priority only when there is
            an explicit source or study-session link. The engine cannot
            establish that a field covers everything in a discipline without a
            supplied curriculum.
          </p>
        </details>
      </div>
    </Modal>
  );
}
