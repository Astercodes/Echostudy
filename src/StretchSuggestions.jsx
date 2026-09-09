import React, { useMemo, useState } from "react";
import { Button, Field } from "./App";
import { knowledgeLabel } from "./knowledge-tree";
import {
  practiceNodes,
  knowledgeStretch,
  gapStretches,
  goalStretch,
  PRACTICE_ENVIRONMENTS,
  STRETCH_SOURCES,
} from "./stretch-engine";

export default function StretchSuggestions({ data, create }) {
  const [source, setSource] = useState("knowledge"),
    [query, setQuery] = useState(""),
    [nodeId, setNodeId] = useState(""),
    [goalId, setGoalId] = useState(""),
    [environment, setEnvironment] = useState("internal"),
    [challenge, setChallenge] = useState(1),
    [opportunity, setOpportunity] = useState("");
  const nodes = useMemo(() => practiceNodes(data), [data]);
  const gaps = useMemo(
    () => (source === "gap" ? gapStretches(data) : []),
    [data, source],
  );
  const node = nodes.find((n) => n.id === nodeId),
    goal = data.goals.find((g) => g.id === goalId);
  const suggestion =
    source === "knowledge" && node
      ? knowledgeStretch(data, node, environment, challenge)
      : source === "goal" && goal
        ? { ...goalStretch(goal), environment, challenge }
        : null;
  const matches = nodes
    .filter((n) =>
      `${n.title} ${knowledgeLabel(n, data.concepts)}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 40);
  return (
    <details className="card stretch-suggestions">
      <summary>Find a stretch opportunity</summary>
      <p>
        Start at any level, at any time. These editable starting points use your
        ecosystem, recorded gaps and goals; they are not AI-generated
        assessments.
      </p>
      <div className="form-grid">
        <Field label="Where does this stretch come from?">
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            {Object.entries(STRETCH_SOURCES).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Suggested practice environment">
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          >
            {Object.entries(PRACTICE_ENVIRONMENTS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Challenge level">
        <select
          value={challenge}
          onChange={(e) => setChallenge(Number(e.target.value))}
        >
          <option value={1}>1 · Small, supported attempt</option>
          <option value={2}>2 · Independent repetition</option>
          <option value={3}>3 · Adapt to a new constraint</option>
          <option value={4}>4 · Integrate under complexity</option>
        </select>
      </Field>
      {source === "knowledge" && (
        <>
          <Field label="Find knowledge to practise">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any forest, grove, tree, root, stem, branch, leaf or fruit"
            />
          </Field>
          <Field label="Knowledge starting point">
            <select value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
              <option value="">Choose knowledge</option>
              {node && !matches.some((n) => n.id === node.id) && (
                <option value={node.id}>{node.title}</option>
              )}
              {matches.map((n) => (
                <option key={n.id} value={n.id}>
                  {knowledgeLabel(n, data.concepts)} · {n.title}
                </option>
              ))}
            </select>
          </Field>
          <small>
            Showing up to 40 matches. Type a title to narrow the list.
          </small>
        </>
      )}
      {source === "goal" && (
        <Field label="Goal to practise toward">
          <select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">Choose a goal</option>
            {data.goals
              .filter((g) => g.progress < 100)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.level} · {g.title}
                </option>
              ))}
          </select>
        </Field>
      )}
      {suggestion && (
        <div className="stretch-suggestion">
          <h3>{suggestion.title}</h3>
          <p>{suggestion.objective}</p>
          <small>{suggestion.rationale}</small>
          <Button primary onClick={() => create(suggestion)}>
            Shape this stretch
          </Button>
        </div>
      )}
      {source === "gap" && (
        <>
          {!gaps.length && (
            <p>
              No recorded diagnostic gaps yet. You can still start a
              knowledge-driven or user-created stretch now.
            </p>
          )}
          {gaps.map((g) => (
            <div className="stretch-suggestion" key={g.gapId}>
              <h3>{g.title}</h3>
              <p>{g.rationale}</p>
              <Button onClick={() => create({ ...g, environment, challenge })}>
                Practise this gap
              </Button>
            </div>
          ))}
        </>
      )}
      {source === "life" && (
        <>
          <Field label="What is happening in your life?">
            <textarea
              value={opportunity}
              onChange={(e) => setOpportunity(e.target.value)}
              placeholder="I have a presentation on Friday"
            />
          </Field>
          <Button
            primary
            disabled={!opportunity.trim()}
            onClick={() =>
              create({
                source: "life",
                title: opportunity.trim(),
                opportunity: opportunity.trim(),
                environment,
                challenge,
                objective:
                  "Rehearse the ability this situation needs, then use it in the actual situation when appropriate.",
                success:
                  "Record the result, feedback and what to improve. Link the relevant knowledge below.",
              })
            }
          >
            Turn this into a stretch
          </Button>
        </>
      )}
      {source === "user" && (
        <>
          <p>
            Describe your own practice, connect relevant knowledge, and
            optionally schedule a repeat.
          </p>
          <Button
            primary
            onClick={() => create({ source: "user", environment, challenge })}
          >
            Create my own stretch
          </Button>
        </>
      )}
    </details>
  );
}
