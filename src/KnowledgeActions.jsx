import React, { useState, useContext } from "react";
import { KnowledgeSourceContext } from "./KnowledgeSources";
import { Modal, Field, Button } from "./App";
import { LEARNING_MODES, defaultQuestions } from "./knowledge-learning";
import { uid } from "./model";
import { VoiceField, VoiceScope } from "./VoiceField";
import ActionComponents from "./ActionComponents";
import { RECALL_MODES } from "./action-components";
import KnowledgeTest from "./KnowledgeTest";
import SourceContentEditor from "./SourceContentEditor";
import { sourceDocuments } from "./source-content";
import { knowledgeEntries, saveKnowledgeEntry } from "./knowledge-tree";
export default function KnowledgeActions({ node, mode, data, persist, close }) {
  const [currentMode, setCurrentMode] = useState(mode);
  const sourceContext = useContext(KnowledgeSourceContext);
  const [documentId, setDocument] = useState(node.id);
  const documents = sourceDocuments(data, node);
  const activeNode = documents.find(n => n.id === documentId) || node;
  const write = activeNode.id === node.id ? persist : patch => sourceContext.save(d => {
    const latest = knowledgeEntries(d).find(n => n.id === activeNode.id);
    return latest ? saveKnowledgeEntry(d, {...latest,...patch}) : d;
  });
  return (
    <KnowledgeSourceContext.Provider
      value={{ ...sourceContext, node: activeNode, action: currentMode }}
    >
      <VoiceScope.Provider value={activeNode.id + ":" + currentMode}>
        <ActionContent
          key={activeNode.id + currentMode}
          node={activeNode}
          mode={currentMode}
          data={data}
          persist={write}
          documents={documents}
          selectDocument={id => {setDocument(id);setCurrentMode("isolate");}}
          close={
            ["isolate", "content"].includes(mode) && !["isolate", "content"].includes(currentMode)
              ? () => setCurrentMode(mode)
              : close
          }
          switchMode={setCurrentMode}
        />
      </VoiceScope.Provider>
    </KnowledgeSourceContext.Provider>
  );
}
function ActionContent({ node, mode, data, persist, close, switchMode, documents, selectDocument }) {
  if (mode === "taste")
    return (
      <Layers node={node} mode="tasteExplore" persist={persist} close={close} />
    );
  if (mode === "test")
    return <KnowledgeTest node={node} persist={persist} close={close} />;
  if (LEARNING_MODES[mode])
    return <Layers node={node} mode={mode} persist={persist} close={close} />;
  if (mode === "regurgitate")
    return <Regurgitate node={node} persist={persist} close={close} />;
  if (mode === "apply")
    return <Apply node={node} persist={persist} close={close} />;
  return (
    <Content
      node={node}
      mode={mode}
      data={data}
      persist={persist}
      close={close}
      switchMode={switchMode}
      documents={documents}
      selectDocument={selectDocument}
    />
  );
}
function Layers({ node, mode, persist, close }) {
  const spec = LEARNING_MODES[mode],
    values = node.learning?.[mode] || {};
  const [active, setActive] = useState(spec.fields[0][0]);
  const [search, setSearch] = useState("");
  const field = spec.fields.find((f) => f[0] === active),
    filled = spec.fields.filter(([key]) => values[key]?.trim()).length;
  const sections = new Map();
  for (const f of spec.fields) {
    const group = f[3] || "Components";
    if (![f[1], group].join(" ").toLowerCase().includes(search.toLowerCase()))
      continue;
    if (!sections.has(group)) sections.set(group, []);
    sections.get(group).push(f);
  }
  return (
    <Modal title={`${spec.title} · ${node.title}`} onClose={close}>
      <div className="learning-workspace">
        <p className="learning-meaning">{spec.meaning}</p>
        <Field label="Find a component">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components or groups"
          />
        </Field>
        <p className="muted">
          {filled} of {spec.fields.length} components explored · Your writing is
          saved as you go.
        </p>
        <div className="learning-layout">
          <div className="learning-mobile-selector">
            <Field label="Study component">
              <select
                value={active}
                onChange={(e) => setActive(e.target.value)}
              >
                {[...sections].map(([group, fields]) => (
                  <optgroup key={group} label={group}>
                    {fields.map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                        {values[key]?.trim() ? " · Has notes" : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          </div>
          <div
            className="learning-layer-nav"
            role="tablist"
            aria-label={`${spec.title} sections`}
          >
            {[...sections].map(([group, fields]) => (
              <section className="learning-component-section" key={group}>
                <h4>{group}</h4>
                {fields.map(([key, label]) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active === key}
                    onClick={() => setActive(key)}
                  >
                    {label}
                    {values[key]?.trim() && (
                      <small aria-label="Has notes">✓</small>
                    )}
                  </button>
                ))}
              </section>
            ))}
            {!sections.size && <p className="muted">No matching components.</p>}
          </div>
          <div role="tabpanel" aria-label={field[1]}>
            <h3>{field[1]}</h3>
            <p>{field[2]}</p>
            <VoiceField label={field[1]}>
              <textarea
                rows={12}
                value={values[active] || ""}
                onChange={(e) =>
                  persist({
                    learning: {
                      ...node.learning,
                      [mode]: { ...values, [active]: e.target.value },
                    },
                    reviewed: new Date().toISOString(),
                  })
                }
              />
            </VoiceField>
            <details>
              <summary>Read source content</summary>
              <p className="orchard-text">
                {node.description ||
                  "No source text yet. Add it through Open content."}
              </p>
            </details>
          </div>
        </div>
        <div className="form-actions">
          {spec.outcome && <p>{spec.outcome}</p>}
          <Button primary onClick={close}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
function Content({ node, mode, data, persist, close, switchMode, documents, selectDocument }) {
  const [saved, setSaved] = useState(false);
  return (
    <Modal
      title={
        (mode === "isolate" ? "Pluck · Focused study · " : "Content · ") +
        node.title
      }
      onClose={close}
    >
      <div
        className={
          mode === "isolate" ? "knowledge-focus" : "learning-workspace"
        }
      >
        <p className="learning-meaning">
          {mode === "isolate"
            ? "One idea. Your full attention."
            : "The text held inside this idea."}
        </p>
        <p className="muted">
          Content, action notes and references are saved within this source as you write.
        </p>
        {documents.length > 1 && <Field label="Source content"><select value={node.id} onChange={e=>selectDocument(e.target.value)}>{documents.map((doc,i)=><option key={doc.id} value={doc.id}>{i===0 ? "Original source" : doc.lineage?.action === "plant" ? "Planted idea" : "Earlier Pluck"} · {doc.title}</option>)}</select></Field>}
        <SourceContentEditor node={node} data={data} persist={patch=>{setSaved(false);persist(patch);}}/>
        {mode === "isolate" && (
          <>
            <h3>Your investigation</h3>
            <p>
              Open an action to write, record audio and attach sources to its
              components. Your work stays embedded in this source.
            </p>
            <div className="fruit-actions">
              {[
                ["taste", "Taste"],
                ["peel", "Peel"],
                ["squeeze", "Squeeze"],
                ["chew", "Chew"],
                ["regurgitate", "Regurgitate"],
                ["absorb", "Absorb / Take Root"],
                ["test", "Test"],
              ].map(([key, title]) => (
                <Button key={key} onClick={() => switchMode(key)}>
                  {title}
                </Button>
              ))}
            </div>
            <h3>Learning history</h3>
            <p>
              {node.learning?.test?.attempts?.length ??
                node.learning?.taste?.attempts?.length ??
                0}{" "}
              self-tests · {node.learning?.apply?.entries?.length || 0}{" "}
              applications recorded
            </p>
          </>
        )}
        <div className="form-actions">
          <Button
            primary
            onClick={() => {
              persist({
                description: node.description || "",
                updatedAt: new Date().toISOString(),
              });
              setSaved(true);
            }}
          >
            Save study content
          </Button>
          {saved && <p role="status">Study content saved.</p>}
          <Button onClick={close}>Return to ecosystem</Button>
        </div>
      </div>
    </Modal>
  );
}
function Taste({ node, persist, close }) {
  const values = node.learning?.taste || {},
    questions = values.questions || defaultQuestions(node);
  const [tab, setTab] = useState("practice"),
    [index, setIndex] = useState(0),
    [revealed, setReveal] = useState(false),
    [recorded, setRecorded] = useState(false);
  const q = questions[Math.min(index, questions.length - 1)],
    answer = values.drafts?.[q.id] || "";
  const write = (patch) =>
    persist({ learning: { ...node.learning, taste: { ...values, ...patch } } });
  const attempts = values.attempts || [];
  return (
    <Modal title={"Taste · " + node.title} onClose={close}>
      <div className="learning-workspace">
        <p className="learning-meaning">
          Test understanding before consulting your notes.
        </p>
        <div className="segmented">
          <button
            className={tab === "practice" ? "active" : ""}
            onClick={() => setTab("practice")}
          >
            Practice
          </button>
          <button
            className={tab === "questions" ? "active" : ""}
            onClick={() => setTab("questions")}
          >
            Questions & answers
          </button>
          <button
            className={tab === "history" ? "active" : ""}
            onClick={() => setTab("history")}
          >
            Attempt history ({attempts.length})
          </button>
        </div>
        {tab === "practice" ? (
          <>
            <Field label="Practice question">
              <select
                value={index}
                onChange={(e) => {
                  setIndex(Number(e.target.value));
                  setReveal(false);
                  setRecorded(false);
                }}
              >
                {questions.map((q, i) => (
                  <option key={q.id} value={i}>
                    {i + 1}. {q.kind}
                  </option>
                ))}
              </select>
            </Field>
            <h3>{q.prompt}</h3>
            <VoiceField
              scope={node.id + ":taste:" + q.id}
              label="Your answer from memory"
            >
              <textarea
                rows={7}
                value={answer}
                onChange={(e) => {
                  write({
                    drafts: { ...values.drafts, [q.id]: e.target.value },
                  });
                  setRecorded(false);
                }}
              />
            </VoiceField>
            {!revealed ? (
              <Button
                primary
                disabled={!answer.trim()}
                onClick={() => setReveal(true)}
              >
                Reveal reference & assess
              </Button>
            ) : (
              <div className="taste-reveal">
                <h3>Reference answer</h3>
                <p className="orchard-text">
                  {q.answer ||
                    "No reference answer saved. Check your sources and notes, then assess honestly. You can add a reference in Questions & answers."}
                </p>
                <p>This is your self-assessment, not an automatic grade.</p>
                <div className="fruit-actions">
                  {[
                    "Needs work",
                    "Partly understood",
                    "Explained confidently",
                  ].map((r) => (
                    <Button
                      key={r}
                      disabled={recorded}
                      onClick={() => {
                        write({
                          attempts: [
                            ...attempts,
                            {
                              id: uid(),
                              question: q.prompt,
                              reference: q.answer,
                              response: answer,
                              rating: r,
                              at: new Date().toISOString(),
                            },
                          ],
                        });
                        setRecorded(true);
                      }}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
                {recorded && (
                  <p role="status">
                    Attempt saved. Use weak points to guide your next study.
                  </p>
                )}
              </div>
            )}
          </>
        ) : tab === "questions" ? (
          <>
            <p className="muted">
              Create quizzes, problems or comparisons. Reference answers stay
              hidden during practice.
            </p>
            {questions.map((q, i) => (
              <section className="taste-question" key={q.id}>
                <VoiceField label={`Question ${i + 1}`}>
                  <textarea
                    value={q.prompt}
                    onChange={(e) =>
                      write({
                        questions: questions.map((x, j) =>
                          j === i ? { ...x, prompt: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </VoiceField>
                <VoiceField label={`Reference answer ${i + 1}`}>
                  <textarea
                    value={q.answer}
                    onChange={(e) =>
                      write({
                        questions: questions.map((x, j) =>
                          j === i ? { ...x, answer: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </VoiceField>
              </section>
            ))}
            <Button
              onClick={() =>
                write({
                  questions: [
                    ...questions,
                    { id: uid(), kind: "My question", prompt: "", answer: "" },
                  ],
                })
              }
            >
              Add question
            </Button>
          </>
        ) : (
          <div className="learning-history">
            {[...attempts].reverse().map((a) => (
              <article key={a.id}>
                <small>
                  {new Date(a.at).toLocaleString()} · {a.rating}
                </small>
                <h3>{a.question}</h3>
                <p className="orchard-text">{a.response}</p>
              </article>
            ))}
            {!attempts.length && (
              <p>
                No attempts yet. Answer a question, reveal its reference, then
                assess your understanding.
              </p>
            )}
          </div>
        )}
        <div className="form-actions">
          <Button onClick={close}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}
function Apply({ node, persist, close }) {
  const values = node.learning?.apply || {},
    draft = values.draft || {},
    entries = values.entries || [];
  const write = (patch) =>
    persist({ learning: { ...node.learning, apply: { ...values, ...patch } } });
  return (
    <Modal title={"Apply · " + node.title} onClose={close}>
      <div className="learning-workspace">
        <p className="learning-meaning">
          Put this knowledge to work and record what happens.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            persist({
              applied: true,
              learning: {
                ...node.learning,
                apply: {
                  ...values,
                  draft: {},
                  entries: [
                    ...entries,
                    { ...draft, id: uid(), at: new Date().toISOString() },
                  ],
                },
              },
            });
          }}
        >
          <Field label="Application type">
            <select
              value={draft.type || "Real-life situation"}
              onChange={(e) =>
                write({ draft: { ...draft, type: e.target.value } })
              }
            >
              {[
                "Real-life situation",
                "Problem",
                "Case",
                "Project",
                "Decision",
                "Scenario",
                "Experiment",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          {[
            [
              "context",
              "Situation or problem",
              "Where will you use this concept?",
            ],
            [
              "plan",
              "How you will apply it",
              "Describe the decision, experiment or practical steps.",
            ],
            [
              "evidence",
              "Evidence of doing",
              "What did you actually do? Add observations, results or an evidence link.",
            ],
            [
              "outcome",
              "Outcome and learning",
              "What happened? What worked or failed?",
            ],
            ["next", "Next application", "What will you change or try next?"],
          ].map(([key, label, hint]) => (
            <VoiceField key={key} label={label}>
              <textarea
                required={["context", "evidence", "outcome"].includes(key)}
                placeholder={hint}
                value={draft[key] || ""}
                onChange={(e) =>
                  write({ draft: { ...draft, [key]: e.target.value } })
                }
              />
            </VoiceField>
          ))}
          <p className="muted">
            Your draft saves as you write. Record an application after doing the
            work; a plan alone is not a completed application.
          </p>
          <Button primary type="submit">
            Record application
          </Button>
        </form>
        <h3>Application history ({entries.length})</h3>
        <div className="learning-history">
          {[...entries].reverse().map((e) => (
            <article key={e.id}>
              <small>
                {new Date(e.at).toLocaleString()} ·{" "}
                {e.type || "Real-life situation"}
              </small>
              <h3>{e.context}</h3>
              <p className="orchard-text">{e.evidence}</p>
              <p className="orchard-text">{e.outcome}</p>
              {e.next && <p>Next: {e.next}</p>}
            </article>
          ))}
        </div>
        <div className="form-actions">
          <Button onClick={close}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}

function Regurgitate({ node, persist, close }) {
  const values = node.learning?.regurgitate || {},
    attempts = values.attempts || [];
  const [reveal, setReveal] = useState(false),
    [history, setHistory] = useState(false);
  const write = (patch) =>
    persist({
      learning: { ...node.learning, regurgitate: { ...values, ...patch } },
    });
  return (
    <Modal title={"Regurgitate · " + node.title} onClose={close}>
      <div className="learning-workspace">
        <p className="learning-meaning">Recall it from memory.</p>
        <Field label="Recall method">
          <select
            value={values.method || "Free Recall"}
            onChange={(e) => write({ method: e.target.value })}
          >
            {RECALL_MODES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <VoiceField label="Recall focus or cue">
          <textarea
            value={values.cue || ""}
            onChange={(e) => write({ cue: e.target.value })}
            placeholder="Optional aspect, cue or problem to recall. Source content stays hidden."
          />
        </VoiceField>
        <Field label="Recall confidence before comparison (%)">
          <input
            type="number"
            min="0"
            max="100"
            value={values.confidence ?? 50}
            onChange={(e) =>
              write({
                confidence: Math.max(0, Math.min(100, Number(e.target.value))),
              })
            }
          />
        </Field>
        <details>
          <summary>Optional progressive hints</summary>
          <p>Hints are learner-authored. Open only when needed.</p>
          <details>
            <summary>Edit hint ladder</summary>
            <VoiceField label="Hint ladder">
              <textarea
                value={values.hints || ""}
                onChange={(e) => write({ hints: e.target.value })}
                placeholder="Write increasingly helpful cues, one per line."
              />
            </VoiceField>
          </details>
          {(values.hints || "")
            .split("\n")
            .filter(Boolean)
            .map((hint, i) => (
              <details key={i}>
                <summary>Hint {i + 1}</summary>
                {hint}
              </details>
            ))}
        </details>
        <p>
          Without opening your notes, reconstruct the idea: its meaning,
          reasoning, examples, and connections. Your draft saves as you write.
        </p>
        <VoiceField label="Recall from memory">
          <textarea
            rows={10}
            value={values.draft || ""}
            onChange={(e) => write({ draft: e.target.value })}
          />
        </VoiceField>
        {!reveal ? (
          <Button
            primary
            disabled={!values.draft?.trim()}
            onClick={() => {
              write({
                attempts: [
                  ...attempts,
                  {
                    id: uid(),
                    text: values.draft,
                    reference: node.description || "",
                    method: values.method || "Free Recall",
                    confidence: values.confidence ?? 50,
                    at: new Date().toISOString(),
                  },
                ],
              });
              setReveal(true);
            }}
          >
            Save recall & compare
          </Button>
        ) : (
          <>
            <p role="status">Recall saved before revealing your notes.</p>
            <Field label="Recall accuracy after comparison (%)">
              <input
                type="number"
                min="0"
                max="100"
                value={values.accuracy ?? ""}
                onChange={(e) => {
                  const accuracy =
                    e.target.value === ""
                      ? null
                      : Math.max(0, Math.min(100, Number(e.target.value)));
                  write({
                    accuracy,
                    attempts: attempts.map((a, i) =>
                      i === attempts.length - 1 ? { ...a, accuracy } : a,
                    ),
                  });
                }}
              />
            </Field>
            {Number.isFinite(values.accuracy) && (
              <p>
                Confidence {values.confidence ?? 50}% / recalled accuracy{" "}
                {values.accuracy}%:{" "}
                {(values.confidence ?? 50) - values.accuracy > 15
                  ? "Possible overconfidence"
                  : values.accuracy - (values.confidence ?? 50) > 15
                    ? "Possible underconfidence"
                    : "Broadly calibrated"}
                . Based on your comparison with the source.
              </p>
            )}
            <ActionComponents
              mode="regurgitate"
              values={values.components}
              scope={node.id + ":regurgitate:review"}
              onChange={(components) => write({ components })}
            />
            <details open>
              <summary>Source content</summary>
              <p className="orchard-text">
                {node.description || "No source text saved yet."}
              </p>
            </details>
            <VoiceField label="Gaps and corrections">
              <textarea
                rows={5}
                value={values.corrections || ""}
                placeholder="What did you miss, distort, or remember clearly?"
                onChange={(e) => {
                  const correction = e.target.value;
                  write({
                    corrections: correction,
                    attempts: attempts.map((a, i) =>
                      i === attempts.length - 1
                        ? { ...a, corrections: correction }
                        : a,
                    ),
                  });
                }}
              />
            </VoiceField>
            <Button
              onClick={() => {
                write({ draft: "", corrections: "", accuracy: null });
                setReveal(false);
                setHistory(false);
              }}
            >
              New recall
            </Button>
          </>
        )}
        <div className="form-actions">
          <Button onClick={() => setHistory(!history)}>
            {history ? "Hide" : "Show"} recall history ({attempts.length})
          </Button>
          <Button onClick={close}>Done</Button>
        </div>
        {history && (
          <div className="learning-history">
            {[...attempts].reverse().map((a) => (
              <article key={a.id}>
                <small>{new Date(a.at).toLocaleString()}</small>
                <p className="orchard-text">{a.text}</p>
                {a.corrections && <p>Gaps and corrections: {a.corrections}</p>}
              </article>
            ))}
            {!attempts.length && <p>No saved recalls yet.</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
