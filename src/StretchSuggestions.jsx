import React, { useMemo, useState } from "react";
import { Button, Field } from "./App";
import { knowledgeLabel } from "./knowledge-tree";
import { ENVIRONMENTS, relatedPracticeKnowledge } from "./stretch-practice";
import {
  Network,
  ScanSearch,
  Target,
  CalendarDays,
  PencilLine,
} from "lucide-react";
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
    [opportunity, setOpportunity] = useState(""),
    [opportunityDate, setOpportunityDate] = useState(""),
    [selectedLinks, setSelectedLinks] = useState([]),
    [capability, setCapability] = useState(""),
    [knowledgeNeed, setKnowledgeNeed] = useState(""),
    [evidenceTarget, setEvidenceTarget] = useState("");
  const nodes = useMemo(() => practiceNodes(data), [data]);
  const gaps = useMemo(
    () => (source === "gap" ? gapStretches(data, environment, challenge) : []),
    [data, source, environment, challenge],
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
  const related = relatedPracticeKnowledge(
    data,
    nodes,
    source === "goal" ? goal?.title : opportunity,
    goal?.areaId,
  );
  const sourceDetails = {
    knowledge: [Network, "Exercise what you are learning"],
    gap: [ScanSearch, "Work on a difficulty you found"],
    goal: [Target, "Work backward from an outcome"],
    life: [CalendarDays, "Use a real opportunity"],
    user: [PencilLine, "Design your own practice"],
  };
  const linkPicker = (
    <div className="stretch-related">
      <h3>Related knowledge</h3>
      <p>
        Choose what belongs in this practice. Matches use words in your
        description and knowledge titles.
      </p>
      {related.map(({ node, shared }) => (
        <label key={node.id}>
          <input
            type="checkbox"
            checked={selectedLinks.includes(node.id)}
            onChange={(e) =>
              setSelectedLinks(
                e.target.checked
                  ? [...selectedLinks, node.id]
                  : selectedLinks.filter((id) => id !== node.id),
              )
            }
          />
          <span>
            {node.title}
            <small>
              {knowledgeLabel(node, data.concepts)} · matches{" "}
              {shared.join(", ")}
            </small>
          </span>
        </label>
      ))}
      {!related.length && (
        <small>
          No title matches yet. You can search and link sources when shaping
          this stretch.
        </small>
      )}
    </div>
  );
  return (
    <section
      className="stretch-suggestions"
      aria-label="Discover stretch opportunities"
    >
      <span className="eyebrow">FIVE WAYS TO BEGIN</span>
      <h2>Where will your next stretch come from?</h2>
      <p>
        A concept, a gap, a goal, something happening in life—or an idea of your
        own. Choose a starting point and make it practical.
      </p>
      <div className="stretch-source-cards" aria-label="Opportunity source">
        {Object.entries(STRETCH_SOURCES).map(([id, label]) => {
          const [Icon, description] = sourceDetails[id];
          return (
            <button
              key={id}
              type="button"
              aria-pressed={source === id}
              onClick={() => {
                setSource(id);
                setSelectedLinks([]);
              }}
            >
              <Icon size={23} />
              <strong>{label}</strong>
              <small>{description}</small>
            </button>
          );
        })}
      </div>
      <div className="card stretch-discovery-body">
        <h3>Choose your practice environment</h3>
        <div className="stretch-environments">
          {Object.entries(ENVIRONMENTS).map(([id, env]) => (
            <button
              key={id}
              type="button"
              aria-pressed={environment === id}
              onClick={() => setEnvironment(id)}
              style={{ "--environment-color": env.color }}
            >
              <strong>{env.title}</strong>
              <span>{env.subtitle}</span>
            </button>
          ))}
        </div>
        <p className="muted">
          {ENVIRONMENTS[environment].description} You can start in any
          environment.
        </p>
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
              <select
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
              >
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
          <>
            <Field label="Goal to practise toward">
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
              >
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
            {goal && (
              <>
                <div className="stretch-backward">
                  <div>
                    <small>DESIRED OUTCOME</small>
                    <strong>{goal.title}</strong>
                  </div>
                  <div>
                    <small>CAPABILITY TO DEMONSTRATE</small>
                    <Field label="Capability needed for this goal">
                      <textarea
                        value={capability}
                        onChange={(e) => setCapability(e.target.value)}
                        placeholder="What must you become able to do?"
                      />
                    </Field>
                  </div>
                  <div>
                    <small>SUPPORTING KNOWLEDGE</small>
                    <Field label="Knowledge needed for this goal">
                      <textarea
                        value={knowledgeNeed}
                        onChange={(e) => setKnowledgeNeed(e.target.value)}
                        placeholder="What must you understand to do it?"
                      />
                    </Field>
                  </div>
                </div>
                {linkPicker}
                <Field label="Evidence that would demonstrate progress">
                  <input
                    value={evidenceTarget}
                    onChange={(e) => setEvidenceTarget(e.target.value)}
                    placeholder="An observable result, artifact, feedback or measure"
                  />
                </Field>
              </>
            )}
          </>
        )}
        {suggestion && (
          <div className="stretch-suggestion">
            <h3>{suggestion.title}</h3>
            <p>{suggestion.objective}</p>
            <small>{suggestion.rationale}</small>
            <Button
              primary
              onClick={() =>
                create({
                  ...suggestion,
                  ...(source === "goal"
                    ? {
                        knowledgeIds: selectedLinks,
                        capabilityNeed: capability,
                        knowledgeNeed,
                        evidenceTarget,
                        objective: capability
                          ? `Practise ${capability}. ${knowledgeNeed ? `Draw on: ${knowledgeNeed}.` : ""} ${suggestion.objective}`
                          : suggestion.objective,
                        success: evidenceTarget || suggestion.success,
                      }
                    : {}),
                })
              }
            >
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
            <Field label="Describe a gap you noticed">
              <textarea
                value={opportunity}
                onChange={(e) => setOpportunity(e.target.value)}
                placeholder="From Test, Check Ripeness, Chew, recall or your own experience: what can you not do yet?"
              />
            </Field>
            {opportunity.trim() && (
              <>
                {linkPicker}
                <Button
                  onClick={() =>
                    create({
                      source: "gap",
                      environment,
                      challenge,
                      title: "Practise a difficulty I identified",
                      objective: opportunity,
                      reportedGap: opportunity,
                      knowledgeIds: selectedLinks,
                      success:
                        "Try the task, identify where it breaks down, then compare a revised attempt with the first.",
                    })
                  }
                >
                  Practise my recorded gap
                </Button>
              </>
            )}
            {gaps.map((g) => (
              <div className="stretch-suggestion" key={g.gapId}>
                <h3>{g.title}</h3>
                <p>{g.rationale}</p>
                <Button
                  onClick={() => create({ ...g, environment, challenge })}
                >
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
            <Field label="When is this opportunity?">
              <input
                type="date"
                value={opportunityDate}
                onChange={(e) => setOpportunityDate(e.target.value)}
              />
            </Field>
            {opportunity.trim() && linkPicker}
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
                  knowledgeIds: selectedLinks,
                  ...(opportunityDate ? { date: opportunityDate } : {}),
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
      </div>
    </section>
  );
}
