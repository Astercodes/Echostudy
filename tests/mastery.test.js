import test from "node:test";
import assert from "node:assert/strict";
import {
  localStructure,
  validateStructure,
  validateFeedback,
  newDeck,
  recordAttempt,
  localFeedback,
  recallChecklist,
  coverage,
  questions,
  validMasteryState,
} from "../src/mastery-engine.js";
import { createHandler } from "../api/knowledge-mastery.js";
const source =
  "Cybersecurity protects systems, networks and data. Access is allowed only with authorization.";
const structure = {
  title: "Cybersecurity",
  structure: "Classification",
  summary: "Protection and conditions",
  concepts: [
    {
      id: "assets",
      parent: "",
      label: "Protected assets",
      detail: "Systems, networks and data",
      quote: "systems, networks and data",
      essential: true,
      exact: false,
      category: "concept",
    },
    {
      id: "authorization",
      parent: "assets",
      label: "Authorization",
      detail: "Access requires authorization",
      quote: "Access is allowed only with authorization.",
      essential: true,
      exact: true,
      category: "qualifier",
    },
  ],
  relationships: [],
};
test("local input retains source statements and refuses silent truncation", () => {
  const s = localStructure(source, "Security");
  assert.equal(s.concepts.map((c) => c.quote).join(" "), source);
  assert.equal(s.origin, "Local draft");
  assert.throws(() => localStructure("A".repeat(18001), "Long"));
  assert.throws(() => localStructure("Sentence. ".repeat(81), "Long"));
});
test("structure validates exact source evidence, cycles and relationships", () => {
  assert.equal(validateStructure(structure, source), structure);
  assert.throws(() =>
    validateStructure(
      {
        ...structure,
        concepts: structure.concepts.map((c) => ({ ...c, quote: "Invented" })),
      },
      source,
    ),
  );
  assert.throws(() =>
    validateStructure(
      {
        ...structure,
        concepts: structure.concepts.map((c) => ({ ...c, parent: c.id })),
      },
      source,
    ),
  );
  assert.throws(() =>
    validateStructure(
      {
        ...structure,
        relationships: [
          {
            from: "assets",
            to: "authorization",
            label: "depends on",
            kind: "factual",
            quote: "",
          },
        ],
      },
      source,
    ),
  );
});
test("word matching never silently awards semantic correctness", () => {
  const d = newDeck(source, structure);
  const f = localFeedback(
    d,
    "Full reconstruction",
    "Access is allowed without authorization.",
  );
  assert.ok(f.items.every((i) => i.status === "uncertain"));
  assert.equal(coverage(f.items).percent, null);
  assert.throws(() =>
    recordAttempt(d, {
      answer: "Wrong",
      mode: "Full reconstruction",
      feedback: f,
      confidence: 5,
      difficulty: "Easy",
    }),
  );
});
test("valid paraphrase verdicts and answer evidence are retained", () => {
  const answer =
    "Digital systems, data and networks are protected. Authorization is required for access.";
  const f = {
    items: structure.concepts.map((c) => ({
      id: c.id,
      status: "correct",
      reason: "Equivalent meaning",
      evidence: answer,
      qualifierOmitted: false,
    })),
    unsupported: [],
    fluency: "Clear sequence",
    application: null,
    notes: "Source grounded",
  };
  assert.equal(
    validateFeedback(f, structure, "Full reconstruction", answer),
    f,
  );
  assert.throws(() =>
    validateFeedback(
      {
        ...f,
        items: f.items.map((i) => ({ ...i, evidence: "fabricated quotation" })),
      },
      structure,
      "Full reconstruction",
      answer,
    ),
  );
  assert.throws(() =>
    validateFeedback(
      { ...f, items: [f.items[0], f.items[0]] },
      structure,
      "Full reconstruction",
      answer,
    ),
  );
});
test("exact terminology requirements cannot silently accept a synonym as exact recall", () => {
  const answer = "Systems, networks and data. Permission needed.";
  const f = {
    ...localFeedback(structure, "Full reconstruction", answer),
    items: structure.concepts.map((c) => ({
      id: c.id,
      status: "correct",
      reason: "Equivalent meaning",
      evidence: answer,
      qualifierOmitted: false,
    })),
  };
  assert.equal(
    validateFeedback(f, structure, "Full reconstruction", answer).items[1]
      .status,
    "partial",
  );
});
test("backup validation accepts drafts, preserves history and rejects cycles and malformed feedback", () => {
  const d = newDeck(source, structure);
  assert.equal(validMasteryState({ masteryDecks: [d] }), true);
  assert.equal(
    validMasteryState({
      masteryDecks: [
        { ...d, concepts: [{ ...d.concepts[0], parent: "assets" }] },
      ],
    }),
    false,
  );
  assert.equal(
    validMasteryState({
      masteryDecks: [{ ...d, attempts: [{ answer: { bad: true } }] }],
    }),
    false,
  );
  assert.equal(
    validMasteryState({
      masteryDecks: [
        { ...d, concepts: [{ ...d.concepts[0], label: "", quote: "" }] },
      ],
    }),
    true,
  );
  assert.equal(validMasteryState({}), true);
});
test("same day repetition cannot expand successful review intervals", () => {
  const d = newDeck(source, structure);
  const feedback = localFeedback(d, "Full reconstruction", "Answer");
  feedback.items = feedback.items.map((i) => ({ ...i, status: "correct" }));
  const input = {
    mode: "Full reconstruction",
    answer: "Answer",
    feedback,
    confidence: 5,
    difficulty: "Easy",
  };
  const first = recordAttempt(d, input, 1000),
    second = recordAttempt(first, input, 2000);
  assert.equal(
    second.review.assets.intervalDays,
    first.review.assets.intervalDays,
  );
});
test("weak and low confidence concepts return sooner; qualifier omissions are not complete recall", () => {
  const d = newDeck(source, structure);
  const f = localFeedback(d, "Full reconstruction", "Reconstruction");
  f.items = f.items.map((i, index) => ({
    ...i,
    status: "correct",
    qualifierOmitted: index === 1,
  }));
  const result = recordAttempt(
    d,
    {
      mode: "Full reconstruction",
      answer: "Reconstruction",
      feedback: f,
      confidence: 5,
      difficulty: "Easy",
    },
    1000,
  );
  assert.equal(result.attempts[0].coverage, 50);
  assert.equal(result.review.authorization.intervalDays, 1);
  assert.equal(result.review.assets.intervalDays, 2);
  assert.equal(
    recallChecklist(result, "Focused recall")[0].id,
    "authorization",
  );
  assert.match(questions(result, "Focused recall").prompt, /Authorization/);
  const second = recordAttempt(
    result,
    {
      mode: "Full reconstruction",
      answer: "Again",
      feedback: f,
      confidence: 1,
      difficulty: "Hard",
    },
    2000,
  );
  assert.equal(second.review.assets.intervalDays, 1);
  assert.equal(second.attempts[1].delayed, false);
  assert.deepEqual(result.attempts[0].checklist, structure.concepts);
});
function res() {
  return {
    code: 0,
    setHeader() {},
    status(c) {
      this.code = c;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
const req = (body) => ({
  method: "POST",
  headers: { authorization: "Bearer test" },
  body,
});
test("mastery endpoint requires authentication and configured provider", async () => {
  let called = 0;
  const handler = createHandler({
    env: {},
    fetcher: async () => {
      called++;
      return { ok: true, json: async () => ({ id: "u" }) };
    },
  });
  let r = res();
  await handler({ ...req({}), headers: {} }, r);
  assert.equal(r.code, 401);
  assert.equal(called, 0);
  r = res();
  await handler(req({ operation: "analyze", source }), r);
  assert.equal(r.code, 503);
  assert.match(r.body.error, /local/);
});
test("AI structure rejects hallucinated citations and handles provider quota", async () => {
  for (const scenario of ["valid", "badquote", "quota"]) {
    const r = res();
    const handler = createHandler({
      env: { GEMINI_API_KEY: "secret", GEMINI_MASTERY_MODEL: "test-model" },
      limits: new Map(),
      fetcher: async (url) =>
        url.endsWith("/user")
          ? { ok: true, json: async () => ({ id: "u" }) }
          : scenario === "quota"
            ? { ok: false, status: 429 }
            : {
                ok: true,
                json: async () => ({
                  candidates: [
                    {
                      finishReason: "STOP",
                      content: {
                        parts: [
                          {
                            text: JSON.stringify(
                              scenario === "badquote"
                                ? {
                                    ...structure,
                                    concepts: structure.concepts.map((c) => ({
                                      ...c,
                                      quote: "hallucinated",
                                    })),
                                  }
                                : structure,
                            ),
                          },
                        ],
                      },
                    },
                  ],
                }),
              },
    });
    await handler(req({ operation: "analyze", source }), r);
    assert.equal(
      r.code,
      scenario === "valid" ? 200 : scenario === "quota" ? 429 : 502,
    );
    assert.ok(!JSON.stringify(r.body).includes("secret"));
  }
});
