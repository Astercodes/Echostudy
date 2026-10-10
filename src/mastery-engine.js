export const STRUCTURES = [
  "Definition",
  "Classification",
  "Process",
  "Causal explanation",
  "Comparison",
  "Argument",
  "Mixed",
];
export const RECALL_MODES = [
  "Full reconstruction",
  "Focused recall",
  "Categories",
  "Terminology",
  "Relationships",
  "Application",
];
export const VERDICTS = [
  "correct",
  "partial",
  "missing",
  "inaccurate",
  "uncertain",
];
const id = () => globalThis.crypto.randomUUID();
export function detectStructure(text) {
  if (/\b(first|then|finally|steps?|stages?)\b/i.test(text)) return "Process";
  if (/\b(causes?|because|therefore|results? in)\b/i.test(text))
    return "Causal explanation";
  if (/\b(whereas|unlike|compared|versus)\b/i.test(text)) return "Comparison";
  if (/\b(argues?|claim|counterargument|evidence)\b/i.test(text))
    return "Argument";
  if (/\b(types?|categories|includes?|consists?|protects?)\b/i.test(text))
    return "Classification";
  if (/\b(is|refers to|defined as)\b/i.test(text)) return "Definition";
  return "Mixed";
}
export function localStructure(source, title) {
  if (!source.trim() || source.length > 18000)
    throw Error(
      "Use between 1 and 18,000 characters. Split longer material into sections.",
    );
  const lines = source
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const pieces = lines
    .flatMap((line) => line.match(/[^.!?]+(?:[.!?]+|$)/g) || [line])
    .map((s) => s.trim())
    .filter(Boolean);
  if (pieces.length > 80)
    throw Error(
      "Use a smaller section with no more than 80 statements. Your source has not been truncated.",
    );
  return {
    title: title.trim() || "Untitled knowledge",
    structure: detectStructure(source),
    origin: "Local draft",
    summary:
      "Source statements preserved as a starting checklist. Edit the hierarchy and split statements into essential concepts before practising. This is not semantic AI analysis.",
    concepts: pieces.map((quote, i) => ({
      id: "c" + i,
      parent: "",
      label: quote.slice(0, 100),
      detail: quote,
      quote,
      essential: true,
      exact: false,
      category: "concept",
    })),
    relationships: [],
  };
}
export function validateStructure(value, source) {
  if (
    !value ||
    !STRUCTURES.includes(value.structure) ||
    typeof value.title !== "string" ||
    value.title.length > 300 ||
    typeof value.summary !== "string" ||
    value.summary.length > 3000 ||
    !Array.isArray(value.concepts) ||
    !value.concepts.length ||
    value.concepts.length > 80 ||
    !Array.isArray(value.relationships) ||
    value.relationships.length > 120
  )
    throw Error("The structure is incomplete. Try a smaller source section.");
  const ids = new Set(value.concepts.map((c) => c.id));
  if (ids.size !== value.concepts.length)
    throw Error("Duplicate concept identifiers.");
  for (const c of value.concepts) {
    if (
      ["id", "parent", "label", "detail", "quote", "category"].some(
        (k) => typeof c[k] !== "string",
      ) ||
      !c.id ||
      !c.label.trim() ||
      c.label.length > 300 ||
      c.detail.length > 3000 ||
      !c.quote.trim() ||
      !source.includes(c.quote) ||
      typeof c.essential !== "boolean" ||
      typeof c.exact !== "boolean" ||
      !["concept", "term", "qualifier", "example"].includes(c.category) ||
      (c.parent && !ids.has(c.parent))
    )
      throw Error("Every concept needs a valid source quotation and parent.");
    const seen = new Set([c.id]);
    let p = c.parent;
    while (p) {
      if (seen.has(p)) throw Error("The hierarchy contains a cycle.");
      seen.add(p);
      p = value.concepts.find((x) => x.id === p)?.parent;
    }
  }
  for (const r of value.relationships)
    if (
      !ids.has(r.from) ||
      !ids.has(r.to) ||
      r.from === r.to ||
      !["factual", "mnemonic"].includes(r.kind) ||
      typeof r.label !== "string" ||
      !r.label.trim() ||
      r.label.length > 1000 ||
      typeof r.quote !== "string" ||
      (r.kind === "factual" && (!r.quote.trim() || !source.includes(r.quote)))
    )
      throw Error("Factual relationships require an exact source quotation.");
  return value;
}
export function questions(deck, mode, now = Date.now()) {
  const ranked = [...deck.concepts].sort(
    (a, b) =>
      Number(b.essential) - Number(a.essential) ||
      (deck.review?.[a.id]?.dueAt || 0) - (deck.review?.[b.id]?.dueAt || 0),
  );
  const type = {
    Definition: "Define the idea, its scope and any exceptions.",
    Classification:
      "Reconstruct the main categories and the details belonging to each.",
    Process:
      "Reconstruct the sequence, dependencies and conditions for each step.",
    "Causal explanation":
      "Explain the mechanism, causes, conditions and supporting evidence.",
    Comparison:
      "Explain the similarities, differences and conditions that matter.",
    Argument: "Reconstruct the claim, evidence, assumptions and objections.",
    Mixed: "Reconstruct the central idea, essential details and connections.",
  }[deck.structure];
  const prompts = {
    "Full reconstruction": type,
    "Focused recall":
      "Explain these priority ideas, including conditions and connections: " +
      recallChecklist(deck, "Focused recall")
        .map((c) => c.label)
        .join("; "),
    Categories:
      "Name the main categories and organize their essential details from memory.",
    Terminology: "Recall the essential terms and explain what each one means.",
    Relationships:
      "Explain how the concepts connect. Distinguish factual connections from memory aids.",
    Application:
      "Describe a new situation where this knowledge applies. Explain your decision and its limitations.",
  };
  return {
    prompt: prompts[mode],
    focusCount: ranked.filter((c) => (deck.review?.[c.id]?.dueAt || 0) <= now)
      .length,
  };
}
export function recallChecklist(deck, mode) {
  if (mode === "Application") return [];
  if (mode === "Focused recall")
    return [...deck.concepts]
      .sort((a, b) => {
        const priority = (c) =>
          !deck.review?.[c.id]
            ? 1
            : deck.review[c.id].status === "correct"
              ? 2
              : 0;
        return (
          priority(a) - priority(b) ||
          (deck.review?.[a.id]?.dueAt || 0) - (deck.review?.[b.id]?.dueAt || 0)
        );
      })
      .slice(0, 5);
  if (mode === "Relationships")
    return deck.relationships
      .filter((r) => r.kind === "factual")
      .map((r) => ({
        id: JSON.stringify([r.from, r.to, r.label]),
        label: r.label,
        detail: r.label,
        quote: r.quote,
        essential: true,
        category: "relationship",
        exact: false,
      }));
  return deck.concepts.filter((c) =>
    mode === "Terminology"
      ? c.exact || c.category === "term"
      : mode === "Categories"
        ? !c.parent
        : true,
  );
}
export function localFeedback(deck, mode, answer) {
  return {
    origin: "Learner review",
    items: recallChecklist(deck, mode).map((c) => ({
      id: c.id,
      status: "uncertain",
      reason:
        "Review meaning, qualifiers and context. Matching words alone cannot establish accuracy.",
      evidence: "",
      qualifierOmitted: false,
    })),
    unsupported: [],
    fluency:
      "Read your answer aloud. Introduce the main idea, group related points, explain how each group connects, and finish with its significance.",
    application: null,
    notes:
      "No semantic assessment has been performed. Valid paraphrases should count as correct.",
  };
}
export function validateFeedback(value, deck, mode, answer) {
  const list = recallChecklist(deck, mode),
    ids = new Set(list.map((c) => c.id));
  if (
    !value ||
    !Array.isArray(value.items) ||
    value.items.length !== ids.size ||
    new Set(value.items.map((i) => i.id)).size !== ids.size ||
    !Array.isArray(value.unsupported) ||
    value.unsupported.length > 30 ||
    typeof value.fluency !== "string" ||
    typeof value.notes !== "string"
  )
    throw Error("The assessment is incomplete. Use learner review instead.");
  for (const i of value.items)
    if (
      !ids.has(i.id) ||
      !VERDICTS.includes(i.status) ||
      typeof i.reason !== "string" ||
      typeof i.evidence !== "string" ||
      typeof i.qualifierOmitted !== "boolean" ||
      (i.evidence && !answer.includes(i.evidence)) ||
      (["correct", "partial", "inaccurate"].includes(i.status) && !i.evidence)
    )
      throw Error("Assessment evidence could not be verified.");
  for (const a of value.unsupported)
    if (
      typeof a.quote !== "string" ||
      !a.quote ||
      !answer.includes(a.quote) ||
      typeof a.reason !== "string"
    )
      throw Error("Unsupported addition references could not be verified.");
  const normalized = (text) =>
    " " +
    text
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim() +
    " ";
  for (const item of value.items) {
    const concept = list.find((c) => c.id === item.id);
    if (
      concept.exact &&
      item.status === "correct" &&
      !normalized(answer).includes(normalized(concept.label))
    ) {
      item.status = "partial";
      item.reason +=
        " The checklist requires the exact term, which was not present in this response.";
    }
  }
  if (
    mode === "Application" &&
    (!value.application ||
      !VERDICTS.includes(value.application.status) ||
      typeof value.application.reason !== "string")
  )
    throw Error("Application assessment is missing.");
  return value;
}
export function coverage(items) {
  const resolved = items.filter((i) => i.status !== "uncertain");
  return {
    percent: resolved.length
      ? Math.round(
          (100 *
            items.filter((i) => i.status === "correct" && !i.qualifierOmitted)
              .length) /
            items.length,
        )
      : null,
    pending: items.length - resolved.length,
  };
}
export function recordAttempt(
  deck,
  { answer, mode, feedback, confidence, difficulty, startedAt },
  now = Date.now(),
) {
  if (!answer.trim()) throw Error("Write your reconstruction first.");
  if (
    feedback.items.some((i) => i.status === "uncertain") ||
    (mode === "Application" &&
      (!feedback.application || feedback.application.status === "uncertain"))
  )
    throw Error("Resolve uncertain items before recording a scored review.");
  const review = { ...deck.review };
  for (const i of feedback.items) {
    const previous = review[i.id] || {};
    const strong = i.status === "correct" && !i.qualifierOmitted;
    const intervalDays = strong
      ? confidence < 3 || difficulty === "Hard"
        ? 1
        : previous.lastAt && now - previous.lastAt < 86400000
          ? previous.intervalDays
          : Math.min(
              60,
              Math.max(2, Math.round((previous.intervalDays || 1) * 2.2)),
            )
      : 1;
    review[i.id] = {
      intervalDays,
      dueAt: now + intervalDays * 86400000,
      lastAt: now,
      status: strong
        ? "correct"
        : i.status === "correct"
          ? "partial"
          : i.status,
    };
  }
  const previousSameMode = [...(deck.attempts || [])]
    .reverse()
    .find((a) => a.mode === mode && a.revision === (deck.revision || 1));
  const attempt = {
    id: id(),
    at: now,
    startedAt,
    mode,
    revision: deck.revision || 1,
    answer,
    confidence,
    difficulty,
    feedback,
    coverage: coverage(feedback.items).percent,
    delayed: Boolean(previousSameMode && now - previousSameMode.at >= 86400000),
    checklist: recallChecklist(deck, mode),
  };
  const dueAt = Math.min(
    ...deck.concepts.map((c) => review[c.id]?.dueAt || now + 86400000),
    ...Object.values(review).map((r) => r.dueAt),
  );
  return {
    ...deck,
    review,
    dueAt,
    attempts: [...(deck.attempts || []), attempt],
    draft: null,
  };
}
export function newDeck(source, structure, location = {}) {
  return {
    id: id(),
    title: structure.title,
    structure: structure.structure,
    summary: structure.summary,
    origin: structure.origin || "Learner structure",
    revision: 1,
    concepts: structure.concepts,
    relationships: structure.relationships,
    source,
    ...location,
    createdAt: Date.now(),
    review: {},
    attempts: [],
    dueAt: Date.now(),
  };
}

// Backups may include an unfinished edit, so quotations are checked on practice,
// while persistence validates shape and hierarchy without discarding drafts.
export function validMasteryState(state) {
  const strings = (value, keys) =>
    value && keys.every((k) => typeof value[k] === "string");
  const concepts = (list) =>
    Array.isArray(list) &&
    list.length <= 80 &&
    list.every(
      (c) =>
        strings(c, ["id", "parent", "label", "detail", "quote", "category"]) &&
        typeof c.essential === "boolean" &&
        typeof c.exact === "boolean",
    );
  const feedback = (f) =>
    f &&
    Array.isArray(f.items) &&
    f.items.every(
      (i) =>
        strings(i, ["id", "status", "reason", "evidence"]) &&
        VERDICTS.includes(i.status) &&
        typeof i.qualifierOmitted === "boolean",
    ) &&
    Array.isArray(f.unsupported) &&
    f.unsupported.every((a) => strings(a, ["quote", "reason"])) &&
    strings(f, ["origin", "fluency", "notes"]) &&
    (!f.application ||
      (strings(f.application, ["status", "reason"]) &&
        VERDICTS.includes(f.application.status)));
  if (
    state.masteryInput !== undefined &&
    !strings(state.masteryInput, [
      "title",
      "source",
      "resourceId",
      "reference",
      "nodeId",
    ])
  )
    return false;
  if (state.masteryDecks === undefined) return true;
  if (
    !Array.isArray(state.masteryDecks) ||
    new Set(state.masteryDecks.map((d) => d?.id)).size !==
      state.masteryDecks.length
  )
    return false;
  return state.masteryDecks.every((d) => {
    if (
      !strings(d, [
        "id",
        "title",
        "source",
        "summary",
        "origin",
        "structure",
      ]) ||
      !STRUCTURES.includes(d.structure) ||
      d.source.length > 18000 ||
      !concepts(d.concepts) ||
      new Set(d.concepts.map((c) => c.id)).size !== d.concepts.length ||
      !Array.isArray(d.relationships) ||
      !d.relationships.every(
        (r) =>
          strings(r, ["from", "to", "label", "kind", "quote"]) &&
          ["factual", "mnemonic"].includes(r.kind),
      ) ||
      !Number.isFinite(d.dueAt) ||
      !d.review ||
      typeof d.review !== "object" ||
      !Object.values(d.review).every(
        (r) =>
          r &&
          Number.isFinite(r.dueAt) &&
          Number.isFinite(r.intervalDays) &&
          VERDICTS.includes(r.status),
      ) ||
      !Array.isArray(d.attempts)
    )
      return false;
    for (const c of d.concepts) {
      let p = c;
      const seen = new Set();
      while (p) {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        if (p.parent && !d.concepts.some((x) => x.id === p.parent))
          return false;
        p = d.concepts.find((x) => x.id === p.parent);
      }
    }
    if (
      d.draft &&
      (!strings(d.draft, ["mode", "answer", "difficulty"]) ||
        !RECALL_MODES.includes(d.draft.mode) ||
        !Number.isFinite(d.draft.confidence) ||
        (d.draft.feedback && !feedback(d.draft.feedback)))
    )
      return false;
    return d.attempts.every(
      (a) =>
        strings(a, ["id", "mode", "answer", "difficulty"]) &&
        Number.isFinite(a.at) &&
        Number.isFinite(a.confidence) &&
        Array.isArray(a.checklist) &&
        a.checklist.every((c) => strings(c, ["id", "label"])) &&
        feedback(a.feedback),
    );
  });
}
