import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Brain,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Clock,
  Check,
  ChevronRight,
} from "lucide-react";
import { supabase } from "./auth";
import { getFile } from "./files";
import { knowledgeEntries } from "./knowledge-tree";
import {
  STRUCTURES,
  RECALL_MODES,
  VERDICTS,
  localStructure,
  validateStructure,
  newDeck,
  questions,
  recallChecklist,
  localFeedback,
  validateFeedback,
  recordAttempt,
  coverage,
} from "./mastery-engine";
import "./mastery.css";

const date = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
const empty = {
  title: "",
  source: "",
  resourceId: "",
  reference: "",
  nodeId: "",
};
export default function KnowledgeMastery({ data, save, onFocus }) {
  const [selected, setSelected] = useState(null),
    [creating, setCreating] = useState(false),
    [stage, setStage] = useState("structure"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  const decks = data.masteryDecks || [],
    deck = decks.find((d) => d.id === selected),
    input = data.masteryInput || empty;
  const nodes = knowledgeEntries(data).filter(
    (n) => !n.trashedAt && n.id !== "root",
  );
  const updateInput = (patch) =>
    save((d) => ({
      ...d,
      masteryInput: { ...(d.masteryInput || empty), ...patch },
    }));
  const updateDeck = (fn) =>
    save((d) => ({
      ...d,
      masteryDecks: (d.masteryDecks || []).map((x) => {
        if (x.id !== selected) return x;
        const next = fn(x);
        if (
          JSON.stringify(next.concepts) !== JSON.stringify(x.concepts) ||
          JSON.stringify(next.relationships) !== JSON.stringify(x.relationships)
        )
          return {
            ...next,
            review: {},
            revision: (x.revision || 1) + 1,
            dueAt: Date.now(),
          };
        return next;
      }),
    }));
  const open = (d) => {
    setSelected(d.id);
    setCreating(false);
    setError("");
    setStage(d.draft?.feedback ? "verify" : d.draft ? "recall" : "structure");
  };
  async function ai(payload) {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) throw Error("Please sign in again.");
    controller.current = new AbortController();
    const timer = setTimeout(() => controller.current?.abort(), 65000);
    try {
      const r = await fetch("/api/knowledge-mastery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.session.access_token,
        },
        body: JSON.stringify(payload),
        signal: controller.current.signal,
      });
      let result;
      try {
        result = await r.json();
      } catch {
        throw Error(
          "Semantic AI is unavailable here. Use local mode or learner review.",
        );
      }
      if (!r.ok)
        throw Error(result.error || "AI unavailable. Your draft is safe.");
      return result.result;
    } finally {
      clearTimeout(timer);
    }
  }
  async function create(useAI) {
    setError("");
    setBusy(true);
    try {
      const structure = useAI
        ? await ai({
            operation: "analyze",
            source: input.source,
            title: input.title,
          })
        : localStructure(input.source, input.title);
      validateStructure(structure, input.source);
      const value = newDeck(input.source, structure, {
        nodeId: input.nodeId,
        resourceId: input.resourceId,
        reference: input.reference,
      });
      save((d) => ({
        ...d,
        masteryDecks: [...(d.masteryDecks || []), value],
        masteryInput: empty,
      }));
      open(value);
    } catch (e) {
      setError(
        e.name === "AbortError"
          ? "The request took too long. Your source is saved."
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function importFile(file, resourceId = "") {
    setError("");
    try {
      if (!file)
        throw Error(
          "This file is unavailable on this device. Paste the relevant passage instead.",
        );
      if (
        file.size > 1024 * 1024 ||
        !(/\.(txt|md)$/i.test(file.name || "") || file.type === "text/plain")
      )
        throw Error(
          "Use a TXT or Markdown file up to 1 MB. For PDFs and other documents, paste the relevant text with a page reference.",
        );
      const source = await file.text();
      if (source.length > 18000)
        throw Error(
          "This file exceeds 18,000 characters. Paste a smaller section; no content was truncated.",
        );
      updateInput({ source, resourceId, title: input.title || file.name });
    } catch (e) {
      setError(e.message);
    }
  }
  async function verify(useAI) {
    setError("");
    setBusy(true);
    try {
      const draft = deck.draft;
      const result = useAI
        ? await ai({
            operation: "verify",
            source: deck.source,
            deck: {
              title: deck.title,
              structure: deck.structure,
              summary: deck.summary,
              concepts: deck.concepts,
              relationships: deck.relationships,
              review: deck.review,
            },
            mode: draft.mode,
            answer: draft.answer,
          })
        : localFeedback(deck, draft.mode, draft.answer);
      if (useAI) validateFeedback(result, deck, draft.mode, draft.answer);
      updateDeck((d) => ({ ...d, draft: { ...d.draft, feedback: result } }));
      setStage("verify");
    } catch (e) {
      setError(
        e.name === "AbortError"
          ? "The request took too long. Your answer is saved."
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  function start(mode) {
    setError("");
    if (!recallChecklist(deck, mode).length && mode !== "Application") {
      setError(
        "Add the relevant terms, categories or factual relationships before practising this mode.",
      );
      return;
    }
    try {
      validateStructure(deck, deck.source);
      updateDeck((d) => ({
        ...d,
        draft: {
          mode,
          answer: "",
          confidence: 3,
          difficulty: "Moderate",
          startedAt: Date.now(),
        },
      }));
      setStage("recall");
    } catch (e) {
      setError(e.message);
    }
  }
  const field = (label, value, onChange, props = {}) => (
    <label className="kme-field">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </label>
  );
  const errorView = error && (
    <p role="alert" className="kme-error">
      {error}
    </p>
  );
  const leave = () => {
    if (busy) return;
    setSelected(null);
    setCreating(false);
    setError("");
  };
  if (!deck && !creating)
    return (
      <section className="kme">
        <header className="kme-hero">
          <div>
            <span>KNOWLEDGE MASTERY ENGINE</span>
            <h2>Grow it. Recall it. Make it yours.</h2>
            <p>
              Reconstruct the structure of what you know, find what is missing,
              and return before it fades.
            </p>
          </div>
          <Brain size={64} />
        </header>
        <div className="kme-top">
          <h3>Your mastery library</h3>
          <button className="btn primary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            Structure knowledge
          </button>
        </div>
        <div className="kme-stats">
          <div>
            <strong>{decks.length}</strong>
            <span>Knowledge structures</span>
          </div>
          <div>
            <strong>{decks.filter((d) => d.dueAt <= Date.now()).length}</strong>
            <span>Ready for retrieval</span>
          </div>
          <div>
            <strong>{decks.reduce((s, d) => s + d.attempts.length, 0)}</strong>
            <span>Recorded reviews</span>
          </div>
        </div>
        {!decks.length && (
          <div className="kme-empty">
            <BookOpen size={32} />
            <h3>Understanding is the beginning.</h3>
            <p>
              Bring a passage or lecture note. Shape its essential concepts,
              practise without the source, then check what you recalled.
            </p>
            <button className="btn" onClick={() => setCreating(true)}>
              Add your first source
            </button>
          </div>
        )}
        <div className="kme-library">
          {[...decks]
            .sort((a, b) => a.dueAt - b.dueAt)
            .map((d) => (
              <button key={d.id} className="kme-deck" onClick={() => open(d)}>
                <span>
                  {d.structure} · {d.origin}
                </span>
                <h3>{d.title}</h3>
                <p>
                  {d.concepts.filter((c) => c.essential).length} essential
                  concepts · {d.attempts.length} reviews
                </p>
                <footer>
                  <span>
                    {d.draft
                      ? "Resume saved answer"
                      : d.dueAt <= Date.now()
                        ? "Ready for retrieval"
                        : "Review " + date(d.dueAt)}
                  </span>
                  <ChevronRight size={18} />
                </footer>
              </button>
            ))}
        </div>
      </section>
    );
  if (creating)
    return (
      <section className="kme">
        <button className="text-btn" disabled={busy} onClick={leave}>
          <ArrowLeft size={16} />
          Mastery library
        </button>
        <h2>Start with your source.</h2>
        <p>
          Your original passage stays separate from its editable structure. Only
          an explicit AI request sends the passage to Gemini.
        </p>
        {errorView}
        <fieldset disabled={busy} className="kme-form">
          {field("Title", input.title, (v) => updateInput({ title: v }), {
            maxLength: 300,
          })}
          <label className="kme-field">
            Import a text document
            <input
              type="file"
              accept=".txt,.md,text/plain"
              onChange={(e) => {
                importFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
          <label className="kme-field">
            Resource library
            <select
              value={input.resourceId}
              onChange={async (e) => {
                const id = e.target.value;
                updateInput({ resourceId: id });
                if (id) {
                  const r = data.resources.find((r) => r.id === id);
                  if (r.kind === "text") {
                    try {
                      await importFile(await getFile(id), id);
                    } catch {
                      setError(
                        "The resource could not be loaded. Paste its text below.",
                      );
                    }
                  }
                }
              }}
            >
              <option value="">No linked resource</option>
              {data.resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </label>
          {field(
            "Source reference: page, chapter or timestamp",
            input.reference,
            (v) => updateInput({ reference: v }),
            { maxLength: 500 },
          )}
          <label className="kme-field">
            Place in the Knowledge Ecosystem
            <select
              value={input.nodeId}
              onChange={(e) => updateInput({ nodeId: e.target.value })}
            >
              <option value="">Choose later</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title} · {n.kind}
                </option>
              ))}
            </select>
          </label>
          <label className="kme-field">
            Source passage
            <textarea
              rows={12}
              maxLength={18000}
              value={input.source}
              onChange={(e) => updateInput({ source: e.target.value })}
            />
            <small>
              {input.source.length.toLocaleString()} / 18,000 characters · Draft
              saved automatically
            </small>
          </label>
          <div className="kme-actions">
            <button
              className="btn primary"
              disabled={!input.source.trim()}
              onClick={() => create(true)}
            >
              <Sparkles size={16} />
              {busy ? "Structuring…" : "Analyze with AI"}
            </button>
            <button
              className="btn"
              disabled={!input.source.trim()}
              onClick={() => create(false)}
            >
              Create local checklist
            </button>
          </div>
          <p className="muted">
            Local mode preserves source statements and suggests a structure
            type. You refine its concepts yourself; it does not perform semantic
            analysis.
          </p>
        </fieldset>
      </section>
    );
  const draft = deck.draft,
    last = deck.attempts.at(-1);
  return (
    <section className="kme">
      <div className="kme-top">
        <button className="text-btn" onClick={leave} disabled={busy}>
          <ArrowLeft size={16} />
          Mastery library
        </button>
        <span>
          {stage === "recall"
            ? "Source hidden · Answer saved automatically"
            : deck.origin}
        </span>
      </div>
      <h2>{deck.title}</h2>
      {stage !== "recall" && (
        <div className="kme-tabs">
          {["structure", "practice", "progress"].map((s) => (
            <button
              className={"btn " + (stage === s ? "primary" : "")}
              disabled={busy || (s === "structure" && Boolean(draft))}
              key={s}
              onClick={() => {
                setStage(s);
                setError("");
              }}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}
      {errorView}
      {stage === "structure" && (
        <>
          <div className="kme-note">
            <strong>{deck.structure}</strong>
            <p>{deck.summary}</p>
            <small>
              Review every essential concept and qualifier against the original.
              A source quote confirms provenance, not the completeness of an AI
              interpretation.
            </small>
          </div>
          <div className="kme-grid">
            <div>
              {field(
                "Structure title",
                deck.title,
                (v) => updateDeck((d) => ({ ...d, title: v })),
                { maxLength: 300 },
              )}
              <label className="kme-field">
                Knowledge type
                <select
                  value={deck.structure}
                  onChange={(e) =>
                    updateDeck((d) => ({ ...d, structure: e.target.value }))
                  }
                >
                  {STRUCTURES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="kme-field">
                Linked ecosystem source
                <select
                  value={deck.nodeId || ""}
                  onChange={(e) =>
                    updateDeck((d) => ({ ...d, nodeId: e.target.value }))
                  }
                >
                  <option value="">Choose a source</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title} · {n.kind}
                    </option>
                  ))}
                </select>
              </label>
              {deck.nodeId && (
                <button
                  className="text-btn"
                  onClick={() => {
                    const n = nodes.find((n) => n.id === deck.nodeId);
                    if (n) onFocus(n);
                  }}
                >
                  Open ecosystem source
                </button>
              )}
              <h3>Original source</h3>
              <p className="kme-source">{deck.source}</p>
              <small>
                {data.resources.find((r) => r.id === deck.resourceId)?.title}{" "}
                {deck.reference}
              </small>
            </div>
            <div>
              <div className="kme-top">
                <h3>Editable hierarchy</h3>
                <button
                  className="btn"
                  onClick={() =>
                    updateDeck((d) => ({
                      ...d,
                      concepts: [
                        ...d.concepts,
                        {
                          id: crypto.randomUUID(),
                          parent: "",
                          label: "New concept",
                          detail: "",
                          quote: "",
                          category: "concept",
                          essential: true,
                          exact: false,
                        },
                      ],
                    }))
                  }
                  disabled={deck.concepts.length >= 80}
                >
                  <Plus size={15} />
                  Concept
                </button>
              </div>
              <Hierarchy deck={deck} updateDeck={updateDeck} />
            </div>
          </div>
          <Relationships deck={deck} updateDeck={updateDeck} />
          <button className="btn primary" onClick={() => setStage("practice")}>
            Prepare active recall
            <ChevronRight size={16} />
          </button>
        </>
      )}
      {stage === "practice" && (
        <div className="kme-practice">
          <h3>Reconstruct, without looking.</h3>
          <p>
            Choose what to retrieve. The source and checklist will be hidden
            until you submit your answer. Editing the structure preserves past
            review snapshots.
          </p>
          {draft && (
            <button className="btn primary" onClick={() => setStage("recall")}>
              Resume saved recall
            </button>
          )}
          <div className="kme-library">
            {RECALL_MODES.map((mode) => (
              <button
                className="kme-deck"
                key={mode}
                disabled={Boolean(draft)}
                onClick={() => start(mode)}
              >
                <h3>{mode}</h3>
                <p>{questions(deck, mode).prompt}</p>
                <span>Begin recall →</span>
              </button>
            ))}
          </div>
          <small>
            {questions(deck, "Full reconstruction").focusCount} concepts ready
            for retrieval. Review weak concepts after checking your answer.
          </small>
        </div>
      )}
      {stage === "recall" && draft && (
        <div className="kme-recall">
          <span>{draft.mode.toUpperCase()}</span>
          <h3>{questions(deck, draft.mode).prompt}</h3>
          <label className="kme-field">
            Your reconstruction
            <textarea
              autoFocus
              rows={14}
              maxLength={18000}
              value={draft.answer}
              disabled={busy}
              onChange={(e) =>
                updateDeck((d) => ({
                  ...d,
                  draft: { ...d.draft, answer: e.target.value, feedback: null },
                }))
              }
            />
          </label>
          <div className="kme-grid">
            <label className="kme-field">
              Confidence before feedback
              <select
                disabled={busy}
                value={draft.confidence}
                onChange={(e) =>
                  updateDeck((d) => ({
                    ...d,
                    draft: { ...d.draft, confidence: Number(e.target.value) },
                  }))
                }
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                  </option>
                ))}
              </select>
            </label>
            <label className="kme-field">
              Recall difficulty
              <select
                disabled={busy}
                value={draft.difficulty}
                onChange={(e) =>
                  updateDeck((d) => ({
                    ...d,
                    draft: { ...d.draft, difficulty: e.target.value },
                  }))
                }
              >
                {["Easy", "Moderate", "Hard"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="kme-actions">
            <button
              className="btn primary"
              disabled={busy || !draft.answer.trim()}
              onClick={() => verify(true)}
            >
              {busy ? "Checking…" : "Verify with AI"}
            </button>
            <button
              className="btn"
              disabled={busy || !draft.answer.trim()}
              onClick={() => verify(false)}
            >
              Reveal and review myself
            </button>
          </div>
          <small>
            AI verification sends your source, checklist and answer to Gemini.
            You can review locally instead.
          </small>
        </div>
      )}
      {stage === "verify" && draft?.feedback && (
        <>
          <div className="kme-note">
            <strong>{draft.feedback.origin}</strong>
            <p>{draft.feedback.notes}</p>
            <small>
              Check ambiguous judgments against the source. Unsupported means
              not established here, not necessarily false. You may correct any
              assessment.
            </small>
          </div>
          <div className="kme-grid">
            <div>
              <h3>Your answer</h3>
              <p className="kme-source">{draft.answer}</p>
              <details>
                <summary>Original source and reference</summary>
                <p className="kme-source">{deck.source}</p>
                <small>{deck.reference}</small>
              </details>
            </div>
            <div>
              <h3>Completeness checklist</h3>
              {draft.feedback.items.map((item, index) => {
                const c = recallChecklist(deck, draft.mode).find(
                  (c) => c.id === item.id,
                );
                return (
                  <article className="kme-verdict" key={item.id}>
                    <strong>{c?.label}</strong>
                    <p>{c?.detail}</p>
                    <blockquote>{c?.quote}</blockquote>
                    <p>{item.reason}</p>
                    {item.evidence && (
                      <small>Your answer: “{item.evidence}”</small>
                    )}
                    <label className="kme-field">
                      Assessment for {c?.label}
                      <select
                        aria-label={"Assessment for " + c?.label}
                        value={item.status}
                        onChange={(e) =>
                          updateDeck((d) => ({
                            ...d,
                            draft: {
                              ...d.draft,
                              feedback: {
                                ...d.draft.feedback,
                                reviewedByLearner: true,
                                items: d.draft.feedback.items.map((x, i) =>
                                  i === index
                                    ? { ...x, status: e.target.value }
                                    : x,
                                ),
                              },
                            },
                          }))
                        }
                      >
                        {VERDICTS.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label className="kme-check">
                      <input
                        type="checkbox"
                        checked={item.qualifierOmitted}
                        onChange={(e) =>
                          updateDeck((d) => ({
                            ...d,
                            draft: {
                              ...d.draft,
                              feedback: {
                                ...d.draft.feedback,
                                reviewedByLearner: true,
                                items: d.draft.feedback.items.map((x, i) =>
                                  i === index
                                    ? {
                                        ...x,
                                        qualifierOmitted: e.target.checked,
                                      }
                                    : x,
                                ),
                              },
                            },
                          }))
                        }
                      />
                      A condition or qualifier was omitted
                    </label>
                  </article>
                );
              })}
              {draft.mode === "Application" && (
                <label className="kme-field">
                  Application assessment
                  <select
                    value={draft.feedback.application?.status || "uncertain"}
                    onChange={(e) =>
                      updateDeck((d) => ({
                        ...d,
                        draft: {
                          ...d.draft,
                          feedback: {
                            ...d.draft.feedback,
                            reviewedByLearner: true,
                            application: {
                              status: e.target.value,
                              reason:
                                d.draft.feedback.application?.reason ||
                                "Learner reviewed application",
                            },
                          },
                        },
                      }))
                    }
                  >
                    {VERDICTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <p>{draft.feedback.application?.reason}</p>
                </label>
              )}
            </div>
          </div>
          {draft.feedback.unsupported.length > 0 && (
            <div className="kme-note">
              <h3>Not established by this source</h3>
              {draft.feedback.unsupported.map((x, i) => (
                <p key={i}>
                  “{x.quote}” · {x.reason}
                </p>
              ))}
            </div>
          )}
          <div className="kme-note">
            <h3>Fluency and next practice</h3>
            <p>{draft.feedback.fluency}</p>
            <p>
              Definition gaps: Peel. Nuance gaps: Squeeze. Reasoning gaps: Chew.
              Recall gaps: Regurgitate. Connection gaps: Absorb. Retention gaps:
              Take Root.
            </p>
          </div>
          <button
            className="btn primary"
            onClick={() => {
              try {
                const next = recordAttempt(deck, draft);
                updateDeck(() => next);
                setStage("progress");
                setError("");
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            <Check size={16} />
            Save review and schedule retrieval
          </button>
        </>
      )}
      {stage === "progress" && (
        <Progress
          deck={deck}
          last={last}
          onPractice={() => setStage("practice")}
        />
      )}
    </section>
  );
}

function Hierarchy({ deck, updateDeck }) {
  const change = (id, patch) =>
    updateDeck((d) => ({
      ...d,
      concepts: d.concepts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  function branch(parent = "", depth = 0) {
    return deck.concepts
      .filter((c) => c.parent === parent)
      .map((c) => (
        <details className="kme-concept" key={c.id}>
          <summary>
            {c.label || "Untitled concept"}{" "}
            {c.essential && <small>Essential</small>}
          </summary>
          <div className="kme-concept-edit">
            <label className="kme-field">
              Concept label
              <input
                maxLength={300}
                value={c.label}
                onChange={(e) => change(c.id, { label: e.target.value })}
              />
            </label>
            <label className="kme-field">
              Meaning
              <textarea
                maxLength={3000}
                value={c.detail}
                onChange={(e) => change(c.id, { detail: e.target.value })}
              />
            </label>
            <label className="kme-field">
              Exact source quotation
              <textarea
                value={c.quote}
                onChange={(e) => change(c.id, { quote: e.target.value })}
              />
            </label>
            <label className="kme-field">
              Parent
              <select
                value={c.parent}
                onChange={(e) => {
                  const parent = e.target.value;
                  let p = parent;
                  while (p) {
                    if (p === c.id) return;
                    p = deck.concepts.find((x) => x.id === p)?.parent;
                  }
                  change(c.id, { parent });
                }}
              >
                <option value="">Main category</option>
                {deck.concepts
                  .filter((x) => x.id !== c.id)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.label}
                    </option>
                  ))}
              </select>
            </label>
            <label className="kme-field">
              Concept type
              <select
                value={c.category}
                onChange={(e) => change(c.id, { category: e.target.value })}
              >
                {["concept", "term", "qualifier", "example"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="kme-check">
              <input
                type="checkbox"
                checked={c.essential}
                onChange={(e) => change(c.id, { essential: e.target.checked })}
              />
              Essential to complete recall
            </label>
            <label className="kme-check">
              <input
                type="checkbox"
                checked={c.exact}
                onChange={(e) => change(c.id, { exact: e.target.checked })}
              />
              Exact terminology required
            </label>
            <button
              className="text-btn"
              onClick={() =>
                updateDeck((d) => ({
                  ...d,
                  concepts: d.concepts
                    .filter((x) => x.id !== c.id)
                    .map((x) =>
                      x.parent === c.id ? { ...x, parent: c.parent } : x,
                    ),
                  relationships: d.relationships.filter(
                    (r) => r.from !== c.id && r.to !== c.id,
                  ),
                }))
              }
            >
              Remove from checklist
            </button>
          </div>
          {branch(c.id, depth + 1)}
        </details>
      ));
  }
  return <div>{branch()}</div>;
}
function Relationships({ deck, updateDeck }) {
  const [value, setValue] = useState({
      from: "",
      to: "",
      label: "",
      kind: "factual",
      quote: "",
    }),
    [error, setError] = useState("");
  return (
    <section className="kme-note">
      <h3>Semantic connections</h3>
      <p>
        Connect sequence, dependency, cause, comparison or function. Memory aids
        stay separate from factual relationships.
      </p>
      {deck.relationships.map((r, i) => (
        <div className="kme-connection" key={i}>
          <strong>
            {deck.concepts.find((c) => c.id === r.from)?.label} →{" "}
            {deck.concepts.find((c) => c.id === r.to)?.label}
          </strong>
          <p>
            {r.label} · {r.kind}
          </p>
          <blockquote>{r.quote}</blockquote>
          <button
            className="text-btn"
            onClick={() =>
              updateDeck((d) => ({
                ...d,
                relationships: d.relationships.filter((_, j) => j !== i),
              }))
            }
          >
            Remove connection
          </button>
        </div>
      ))}
      <details>
        <summary>Add a connection</summary>
        <div className="kme-grid">
          {["from", "to"].map((k) => (
            <label key={k} className="kme-field">
              {k === "from" ? "Source concept" : "Target concept"}
              <select
                value={value[k]}
                onChange={(e) => setValue({ ...value, [k]: e.target.value })}
              >
                <option value="">Choose concept</option>
                {deck.concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label className="kme-field">
          Relationship explanation
          <input
            value={value.label}
            maxLength={1000}
            onChange={(e) => setValue({ ...value, label: e.target.value })}
          />
        </label>
        <label className="kme-field">
          Connection kind
          <select
            value={value.kind}
            onChange={(e) => setValue({ ...value, kind: e.target.value })}
          >
            <option value="factual">Factual relationship</option>
            <option value="mnemonic">Memory aid</option>
          </select>
        </label>
        <label className="kme-field">
          Exact source evidence
          <textarea
            value={value.quote}
            onChange={(e) => setValue({ ...value, quote: e.target.value })}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button
          className="btn"
          onClick={() => {
            try {
              validateStructure(
                { ...deck, relationships: [...deck.relationships, value] },
                deck.source,
              );
              updateDeck((d) => ({
                ...d,
                relationships: [...d.relationships, value],
              }));
              setValue({
                from: "",
                to: "",
                label: "",
                kind: "factual",
                quote: "",
              });
              setError("");
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Save connection
        </button>
      </details>
    </section>
  );
}
function Progress({ deck, onPractice }) {
  const attempts = deck.attempts,
    current = attempts.filter((a) => a.revision === (deck.revision || 1)),
    last = current.at(-1),
    latest = (mode) => [...current].reverse().find((a) => a.mode === mode),
    metric = (mode, filter) => {
      const a = latest(mode);
      if (!a) return "Not assessed";
      const items = filter
        ? a.feedback.items.filter((i) =>
            a.checklist?.find((c) => c.id === i.id && filter(c)),
          )
        : a.feedback.items;
      const v = coverage(items).percent;
      return v === null ? "Not assessed" : v + "%";
    };
  const weak = deck.concepts.filter(
    (c) => deck.review[c.id] && deck.review[c.id].status !== "correct",
  );
  return (
    <div>
      <div className="kme-stats">
        {[
          [
            "Essential coverage",
            metric("Full reconstruction", (c) => c.essential),
          ],
          ["Terminology", metric("Terminology")],
          ["Relationships", metric("Relationships")],
          [
            "Delayed recall",
            (() => {
              const a = [...current]
                .reverse()
                .find((a) => a.delayed && a.mode === "Full reconstruction");
              return a?.coverage == null ? "Not assessed" : a.coverage + "%";
            })(),
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="kme-note">
        <Clock size={20} />
        <h3>
          {deck.dueAt <= Date.now()
            ? "Ready for retrieval"
            : "Next review: " + date(deck.dueAt)}
        </h3>
        <p>
          Correct, confident recall gradually increases spacing. Gaps, hard
          recall and low confidence return sooner. These are practice
          indicators, not proof of complete mastery.
        </p>
        <button className="btn primary" onClick={onPractice}>
          Practise again
        </button>
      </div>
      {weak.length > 0 && (
        <div className="kme-note">
          <h3>Give these ideas attention next</h3>
          {weak.map((c) => (
            <p key={c.id}>
              {c.label} · {deck.review[c.id].status} · Review{" "}
              {date(deck.review[c.id].dueAt)}
            </p>
          ))}
        </div>
      )}
      <p>
        Application:{" "}
        {latest("Application")?.feedback.application?.status || "Not assessed"}.
        A written scenario does not establish performance in real situations.
      </p>
      {last && (
        <p>
          Last confidence: {last.confidence}/5 ·{" "}
          {last.coverage === null
            ? "No concept coverage scored"
            : `Recall coverage: ${last.coverage}%`}
          {last.coverage !== null && last.confidence >= 4 && last.coverage < 70
            ? " · Confidence exceeded demonstrated recall. Revisit the missing ideas."
            : ""}
        </p>
      )}
      <h3>Retrieval history</h3>
      <p className="muted">
        Metrics describe the current checklist. Earlier checklist versions
        remain in this history.
      </p>
      {!attempts.length ? (
        <p>No scored reviews yet.</p>
      ) : (
        <ol className="kme-history">
          {[...attempts].reverse().map((a) => (
            <li key={a.id}>
              <details>
                <summary>
                  {date(a.at)} · {a.mode} ·{" "}
                  {a.coverage === null
                    ? "Application review"
                    : a.coverage + "% coverage"}{" "}
                  · {a.feedback.origin}
                  {a.feedback.reviewedByLearner ? " · Learner adjusted" : ""}
                </summary>
                <p className="kme-source">{a.answer}</p>
                {a.feedback.items.map((i) => (
                  <p key={i.id}>
                    {a.checklist?.find((c) => c.id === i.id)?.label} ·{" "}
                    {i.status}
                  </p>
                ))}
                <p>{a.feedback.fluency}</p>
              </details>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
