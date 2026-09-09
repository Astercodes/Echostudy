import React, { useState } from "react";
import { Modal, Field, Button } from "./App";
import { VoiceField } from "./VoiceField";
import { uid } from "./model";
import { defaultQuestions } from "./knowledge-learning";
import { TEST_FORMATS, TEST_DIFFICULTIES } from "./action-components";
import ActionComponents from "./ActionComponents";
const diagnoses = [
  "Correct",
  "Incorrect",
  "Partially correct",
  "Lucky/uncertain answer",
  "Misconception",
  "Knowledge gap",
];
const prescriptions = {
  "Definition gaps": "Peel",
  "Nuance gaps": "Squeeze",
  "Reasoning gaps": "Chew",
  "Recall gaps": "Regurgitate",
  "Connection gaps": "Absorb",
  "Retention gaps": "Take Root",
};
export function testProfile(attempts) {
  const scored = attempts.filter((a) => Number.isFinite(a.accuracy));
  const mean = (xs) =>
    xs.length
      ? Math.round(xs.reduce((s, a) => s + a.accuracy, 0) / xs.length)
      : null;
  const accuracy = mean(scored),
    recent = mean(scored.slice(-5)),
    previous = mean(scored.slice(-10, -5));
  return {
    count: scored.length,
    accuracy,
    improvement:
      recent !== null && previous !== null ? recent - previous : null,
    consistency:
      scored.length > 1
        ? Math.round(
            100 -
              Math.sqrt(
                scored.reduce((s, a) => s + (a.accuracy - accuracy) ** 2, 0) /
                  scored.length,
              ),
          )
        : null,
  };
}
export default function KnowledgeTest({ node, persist, close }) {
  // Existing Taste quizzes remain intact and become the starting Test bank/history.
  const values = node.learning?.test || node.learning?.taste || {};
  const questions = values.questions?.length
    ? values.questions
    : defaultQuestions(node);
  const [section, setSection] = useState("practice"),
    [index, setIndex] = useState(0),
    [revealed, setReveal] = useState(false),
    [recorded, setRecorded] = useState(false);
  const q = questions[Math.min(index, questions.length - 1)],
    attempts = values.attempts || [];
  const draft = values.diagnostics?.[q.id] || {},
    response = values.drafts?.[q.id] || "";
  const write = (patch) =>
    persist({ learning: { ...node.learning, test: { ...values, ...patch } } });
  const edit = (patch) =>
    write({
      diagnostics: { ...values.diagnostics, [q.id]: { ...draft, ...patch } },
    });
  const format = q.format || "Long answer",
    choices = (q.options || "").split("\n").filter(Boolean);
  const profile = testProfile(attempts);
  const select = (i) => {
    setIndex(i);
    setReveal(false);
    setRecorded(false);
  };
  const changeQuestion = (i, patch) =>
    write({
      questions: questions.map((x, j) => (j === i ? { ...x, ...patch } : x)),
    });
  const answer = (value) => {
    write({ drafts: { ...values.drafts, [q.id]: value } });
    setRecorded(false);
  };
  return (
    <Modal title={"Test · " + node.title} onClose={close}>
      <div className="learning-workspace">
        <p className="learning-meaning">
          Assess: What do I currently know, and where are my gaps?
        </p>
        <p>
          Test at any point. These results are self-assessed against your
          references. They do not mark a fruit ripe or move it into Stretch.
        </p>
        <div className="segmented">
          {["practice", "questions", "profile"].map((s) => (
            <button key={s} onClick={() => setSection(s)}>
              {s === "questions"
                ? "Questions & answers"
                : s === "profile"
                  ? "Performance & history"
                  : "Practice"}
            </button>
          ))}
        </div>
        {section === "practice" && (
          <>
            <Field label="Test question">
              <select
                value={index}
                onChange={(e) => select(Number(e.target.value))}
              >
                {questions.map((x, i) => (
                  <option key={x.id} value={i}>
                    {i + 1}. {x.prompt}
                  </option>
                ))}
              </select>
            </Field>
            <p>
              {format} · {q.difficulty || "Foundational"} ·{" "}
              {q.coverage || "Definitions"}
            </p>
            <h3>{q.prompt}</h3>
            <Field label="Confidence before answer (%)">
              <input
                type="number"
                min="0"
                max="100"
                disabled={revealed || Boolean(response)}
                value={draft.confidence ?? 50}
                onChange={(e) =>
                  edit({
                    confidence: Math.max(
                      0,
                      Math.min(100, Number(e.target.value)),
                    ),
                  })
                }
              />
            </Field>
            {choices.length > 0 &&
              ["Multiple choice", "Multiple response"].includes(format) && (
                <fieldset>
                  <legend>Answer choices</legend>
                  {choices.map((option, i) => (
                    <label className="check-field" key={i}>
                      <input
                        type={
                          format === "Multiple choice" ? "radio" : "checkbox"
                        }
                        name={node.id + q.id}
                        checked={response.split("\n").includes(option)}
                        onChange={(e) =>
                          answer(
                            format === "Multiple choice"
                              ? option
                              : (e.target.checked
                                  ? [
                                      ...response.split("\n").filter(Boolean),
                                      option,
                                    ]
                                  : response
                                      .split("\n")
                                      .filter((x) => x !== option)
                                ).join("\n"),
                          )
                        }
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
              )}
            <VoiceField
              scope={node.id + ":test:" + q.id}
              label="Your test answer"
            >
              <textarea
                rows={7}
                value={response}
                onChange={(e) => answer(e.target.value)}
                placeholder={
                  format === "Diagram labeling/reconstruction"
                    ? "Reconstruct using labeled text, arrows or diagram notation; explain each part."
                    : format === "Matching"
                      ? "Write your matched pairs and reasoning."
                      : format === "Oral response"
                        ? "Record your response below and insert its transcript."
                        : "Answer without consulting the reference; include your reasoning."
                }
              />
            </VoiceField>
            {!revealed ? (
              <Button
                primary
                disabled={!response.trim()}
                onClick={() => setReveal(true)}
              >
                Reveal reference & assess
              </Button>
            ) : (
              <>
                <h3>Reference answer & reasoning</h3>
                <p className="orchard-text">
                  {q.answer ||
                    "No reference saved. Check a trusted source before assigning accuracy."}
                </p>
                <Field label="Diagnostic result">
                  <select
                    value={draft.result || "Knowledge gap"}
                    onChange={(e) => edit({ result: e.target.value })}
                  >
                    {diagnoses.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Assessed accuracy (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={draft.accuracy ?? ""}
                    onChange={(e) =>
                      edit({
                        accuracy:
                          e.target.value === ""
                            ? null
                            : Math.max(
                                0,
                                Math.min(100, Number(e.target.value)),
                              ),
                      })
                    }
                  />
                </Field>
                <Field label="Gap requiring attention">
                  <select
                    value={draft.gap || "Definition gaps"}
                    onChange={(e) => edit({ gap: e.target.value })}
                  >
                    {Object.keys(prescriptions).map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </Field>
                <VoiceField
                  scope={node.id + ":test:" + q.id}
                  label="Feedback and correct reasoning"
                >
                  <textarea
                    value={draft.feedback || ""}
                    onChange={(e) => edit({ feedback: e.target.value })}
                    placeholder="Why correct or incorrect? What reasoning, evidence and knowledge need review?"
                  />
                </VoiceField>
                <Button
                  primary
                  disabled={recorded || !Number.isFinite(draft.accuracy)}
                  onClick={() => {
                    const accuracy = draft.accuracy;
                    write({
                      attempts: [
                        ...attempts,
                        {
                          id: uid(),
                          questionId: q.id,
                          question: q.prompt,
                          reference: q.answer,
                          response,
                          format,
                          coverage: q.coverage || "Definitions",
                          difficulty: q.difficulty || "Foundational",
                          confidence: draft.confidence ?? 50,
                          accuracy,
                          result: draft.result || "Knowledge gap",
                          gap: draft.gap || "Definition gaps",
                          feedback: draft.feedback || "",
                          at: new Date().toISOString(),
                        },
                      ],
                    });
                    setRecorded(true);
                  }}
                >
                  Save diagnostic result
                </Button>
                {recorded && (
                  <p role="status">
                    Result saved.{" "}
                    {draft.accuracy < 100
                      ? "Suggested next action: " +
                        prescriptions[draft.gap || "Definition gaps"]
                      : "Review again later to check retention."}
                  </p>
                )}
                {recorded && (
                  <Button
                    onClick={() => {
                      const level = TEST_DIFFICULTIES.indexOf(
                        q.difficulty || "Foundational",
                      );
                      const target = Math.max(
                        0,
                        Math.min(
                          4,
                          level +
                            (draft.accuracy >= 80
                              ? 1
                              : draft.accuracy < 50
                                ? -1
                                : 0),
                        ),
                      );
                      const candidates = questions
                        .map((x, i) => ({
                          i,
                          d: Math.abs(
                            TEST_DIFFICULTIES.indexOf(
                              x.difficulty || "Foundational",
                            ) - target,
                          ),
                        }))
                        .filter((x) => x.i !== index)
                        .sort((a, b) => a.d - b.d);
                      if (candidates.length) select(candidates[0].i);
                    }}
                  >
                    Next adaptive question
                  </Button>
                )}
                <p>
                  Adaptive selection uses your assessed accuracy to choose the
                  nearest suitable difficulty from your saved question bank. Add
                  questions at several levels for useful adaptation.
                </p>
              </>
            )}
          </>
        )}
        {section === "questions" && (
          <>
            {questions.map((x, i) => (
              <section className="taste-question" key={x.id}>
                <Field label={"Question format " + (i + 1)}>
                  <select
                    value={x.format || "Long answer"}
                    onChange={(e) =>
                      changeQuestion(i, { format: e.target.value })
                    }
                  >
                    {TEST_FORMATS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                <Field label={"Question difficulty " + (i + 1)}>
                  <select
                    value={x.difficulty || "Foundational"}
                    onChange={(e) =>
                      changeQuestion(i, { difficulty: e.target.value })
                    }
                  >
                    {TEST_DIFFICULTIES.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                <Field label={"Knowledge coverage " + (i + 1)}>
                  <select
                    value={x.coverage || "Definitions"}
                    onChange={(e) =>
                      changeQuestion(i, { coverage: e.target.value })
                    }
                  >
                    {[
                      "Definitions",
                      "Facts",
                      "Principles",
                      "Processes",
                      "Relationships",
                      "Understanding",
                      "Reasoning",
                      "Scenario",
                    ].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                <VoiceField
                  scope={node.id + ":test:bank:" + x.id}
                  label={"Question " + (i + 1)}
                >
                  <textarea
                    value={x.prompt}
                    onChange={(e) =>
                      changeQuestion(i, { prompt: e.target.value })
                    }
                  />
                </VoiceField>
                {["Multiple choice", "Multiple response", "Matching"].includes(
                  x.format,
                ) && (
                  <Field label={"Options or matching items " + (i + 1)}>
                    <textarea
                      value={x.options || ""}
                      placeholder="One option or item per line"
                      onChange={(e) =>
                        changeQuestion(i, { options: e.target.value })
                      }
                    />
                  </Field>
                )}
                <VoiceField
                  scope={node.id + ":test:bank:" + x.id}
                  label={"Reference answer " + (i + 1)}
                >
                  <textarea
                    value={x.answer || ""}
                    onChange={(e) =>
                      changeQuestion(i, { answer: e.target.value })
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
                    {
                      id: uid(),
                      prompt: "",
                      answer: "",
                      format: "Short answer",
                      difficulty: "Foundational",
                    },
                  ],
                })
              }
            >
              Add question
            </Button>
          </>
        )}
        {section === "profile" && (
          <>
            <h3>Performance profile</h3>
            <p>
              {profile.count} scored attempts · Accuracy:{" "}
              {profile.accuracy ?? "—"}% · Consistency:{" "}
              {profile.consistency ?? "—"}% · Improvement:{" "}
              {profile.improvement === null
                ? "More attempts needed"
                : profile.improvement + " percentage points"}
            </p>
            <p>
              Consistency reflects variation in your assessed scores.
              Improvement compares the latest five scored attempts with up to
              five preceding attempts; question difficulty may differ.
            </p>
            {[
              "Definitions",
              "Facts",
              "Principles",
              "Processes",
              "Relationships",
              "Understanding",
              "Reasoning",
              "Scenario",
            ].map((c) => {
              const xs = attempts.filter(
                (a) => a.coverage === c && Number.isFinite(a.accuracy),
              );
              const avg = xs.length
                ? Math.round(xs.reduce((s, a) => s + a.accuracy, 0) / xs.length)
                : null;
              return (
                <p key={c}>
                  {c}:{" "}
                  {avg === null
                    ? "Not assessed"
                    : avg +
                      "% · " +
                      (avg >= 80 ? "Strength" : "Needs attention")}
                </p>
              );
            })}
            {[...attempts].reverse().map((a) => (
              <article className="taste-question" key={a.id}>
                <h4>{a.question}</h4>
                <p>
                  {a.result || a.rating} ·{" "}
                  {a.accuracy ?? "Unscored legacy attempt"}
                  {Number.isFinite(a.accuracy) ? "%" : ""} · {a.difficulty}
                </p>
                <p className="orchard-text">{a.response}</p>
                <p>{a.feedback}</p>
                {Number.isFinite(a.confidence) &&
                  Number.isFinite(a.accuracy) && (
                    <p>
                      Confidence {a.confidence}% / accuracy {a.accuracy}%:{" "}
                      {a.confidence - a.accuracy > 15
                        ? "Possible overconfidence"
                        : a.accuracy - a.confidence > 15
                          ? "Possible underconfidence"
                          : "Broadly calibrated"}
                    </p>
                  )}
                {a.gap && (
                  <p>
                    {a.gap} → {prescriptions[a.gap]}
                  </p>
                )}
              </article>
            ))}
            {!attempts.length && <p>No attempts yet.</p>}
          </>
        )}
        <ActionComponents
          mode="test"
          scope={node.id + ":test:components"}
          values={values.components}
          onChange={(components) => write({ components })}
        />
        <p>
          I know what I currently know, what I don't know, and what needs
          attention next.
        </p>
        <Button onClick={close}>Done</Button>
      </div>
    </Modal>
  );
}
