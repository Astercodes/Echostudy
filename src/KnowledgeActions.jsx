import React, { useState } from "react";
import { Modal, Field, Button } from "./App";
import { LEARNING_MODES, defaultQuestions } from "./knowledge-learning";
import { uid } from "./model";
import { VoiceField, VoiceScope } from "./VoiceField";
export default function KnowledgeActions({ node, mode, data, persist, close }) {
  return (
    <VoiceScope.Provider value={node.id + ":" + mode}>
      <ActionContent
        node={node}
        mode={mode}
        data={data}
        persist={persist}
        close={close}
      />
    </VoiceScope.Provider>
  );
}
function ActionContent({ node, mode, data, persist, close }) {
  if (LEARNING_MODES[mode])
    return <Layers node={node} mode={mode} persist={persist} close={close} />;
  if (mode === "regurgitate")
    return <Regurgitate node={node} persist={persist} close={close} />;
  if (mode === "taste")
    return <Taste node={node} persist={persist} close={close} />;
  if (mode === "apply")
    return <Apply node={node} persist={persist} close={close} />;
  return (
    <Content
      node={node}
      mode={mode}
      data={data}
      persist={persist}
      close={close}
    />
  );
}
function Layers({ node, mode, persist, close }) {
  const spec = LEARNING_MODES[mode],
    values = node.learning?.[mode] || {};
  const [active, setActive] = useState(spec.fields[0][0]);
  const field = spec.fields.find((f) => f[0] === active),
    filled = spec.fields.filter(([key]) => values[key]?.trim()).length;
  return (
    <Modal title={`${spec.title} · ${node.title}`} onClose={close}>
      <div className="learning-workspace">
        <p className="learning-meaning">{spec.meaning}</p>
        <p className="muted">
          {filled} of {spec.fields.length} sections explored · Your writing is
          saved as you go.
        </p>
        <div className="learning-layout">
          <div
            className="learning-layer-nav"
            role="tablist"
            aria-label={`${spec.title} sections`}
          >
            {spec.fields.map(([key, label], i) => (
              <button
                key={key}
                role="tab"
                aria-selected={active === key}
                onClick={() => setActive(key)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {label}
                {values[key]?.trim() && <small>●</small>}
              </button>
            ))}
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
          <Button primary onClick={close}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
function Content({ node, mode, data, persist, close }) {
  return (
    <Modal
      title={
        (mode === "isolate" ? "Pluck · Independent study · " : "Content · ") +
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
        <p className="muted">Saved as you write.</p>
        <VoiceField
          label={
            ["life-area", "sub-area"].includes(node.kind)
              ? "Workspace content"
              : "Fruit content"
          }
        >
          <textarea
            rows={12}
            value={node.description || ""}
            onChange={(e) => persist({ description: e.target.value })}
          />
        </VoiceField>
        {mode === "isolate" && (
          <>
            <h3>Your investigation</h3>
            {Object.entries(LEARNING_MODES).map(([mode, spec]) => (
              <details key={mode}>
                <summary>
                  {spec.title} · {spec.meaning}
                </summary>
                {spec.fields
                  .filter(([key]) => node.learning?.[mode]?.[key])
                  .map(([key, label]) => (
                    <section key={key}>
                      <h4>{label}</h4>
                      <p className="orchard-text">{node.learning[mode][key]}</p>
                    </section>
                  ))}
              </details>
            ))}
            <h3>Linked notes</h3>
            {data.notes
              .filter((n) => n.concepts?.includes(node.id))
              .map((n) => (
                <blockquote key={n.id}>
                  {n.quote && <mark>{n.quote}</mark>}
                  <p>{n.text}</p>
                </blockquote>
              ))}
            <h3>Learning history</h3>
            <p>
              {node.learning?.taste?.attempts?.length || 0} self-tests ·{" "}
              {node.learning?.apply?.entries?.length || 0} applications recorded
            </p>
          </>
        )}
        <div className="form-actions">
          <Button primary onClick={close}>
            Return to tree
          </Button>
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
                write({ draft: "", corrections: "" });
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
