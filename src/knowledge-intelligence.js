import {
  knowledgeEntries,
  isScaffold,
  scopeId,
  locationOf,
} from "./knowledge-tree.js";

export const normalizeKnowledge = (value) =>
  String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const text = (value) => (typeof value === "string" ? value.trim() : "");
const DAY = 86400000;
const time = (value) =>
  Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
const latest = (attempts) => {
  const map = new Map();
  for (const a of [...attempts].sort((a, b) => time(a.at) - time(b.at)))
    map.set(a.questionId || a.question || a.id || "assessment", a);
  return [...map.values()];
};
const prescriptions = {
  "Definition gaps": "peel",
  "Nuance gaps": "squeeze",
  "Reasoning gaps": "chew",
  "Recall gaps": "regurgitate",
  "Connection gaps": "absorb",
  "Retention gaps": "absorb",
};
const stops = new Set(
  "the and with from that this your their about into have what which when where how why for are can you our its has not but will should understanding knowledge concept study learn learning".split(
    " ",
  ),
);
const tokens = (value) =>
  new Set(
    normalizeKnowledge(value)
      .split(" ")
      .filter((w) => w.length > 3 && !stops.has(w)),
  );

export function knowledgeIntelligence(
  data,
  { focusIds, now = Date.now() } = {},
) {
  const all = knowledgeEntries(data).filter((n) => !isScaffold(n));
  const byId = new Map(all.map((n) => [n.id, n]));
  const active = all.filter((n) => {
    const home = locationOf(n, data.concepts, data.lifeAreas);
    return (
      !n.trashedAt &&
      !data.concepts.some(
        (s) =>
          s.trashedAt &&
          (s.id === scopeId(home.areaId) ||
            s.id === scopeId(home.areaId, home.subAreaId)),
      ) &&
      !isHidden(n)
    );
  });
  function isHidden(n) {
    const seen = new Set();
    let p = byId.get(n.parent);
    while (p && !seen.has(p.id)) {
      seen.add(p.id);
      if (p.trashedAt) return true;
      p = byId.get(p.parent);
    }
    return false;
  }
  const activeIds = new Set(active.map((n) => n.id));
  const names = new Map();
  for (const n of active)
    for (const title of [
      n.title,
      ...(Array.isArray(n.aliases) ? n.aliases : []),
    ]) {
      const key = normalizeKnowledge(title);
      if (!names.has(key)) names.set(key, []);
      names.get(key).push(n);
    }
  const selected = focusIds ? new Set(focusIds) : null;
  const subjects = active.filter((n) => !selected || selected.has(n.id));
  const notesByNode = new Map(),
    sessionsByNode = new Map();
  for (const note of data.notes || [])
    for (const id of note.concepts || []) {
      if (!notesByNode.has(id)) notesByNode.set(id, []);
      notesByNode.get(id).push(note);
    }
  for (const s of data.sessions || []) {
    if (!sessionsByNode.has(s.conceptId)) sessionsByNode.set(s.conceptId, []);
    sessionsByNode.get(s.conceptId).push(s);
  }
  const corpus = new Map(
    active.map((n) => [
      n.id,
      [
        n.title,
        n.description,
        ...Object.values(n.learning || {}).flatMap((v) =>
          Object.values(v || {}).filter((x) => typeof x === "string"),
        ),
        ...(notesByNode.get(n.id) || []).map((v) => v.text),
      ]
        .filter(Boolean)
        .join(" "),
    ]),
  );
  const assessmentCache = new Map(
    active.map((n) => [
      n.id,
      latest(
        n.learning?.test?.attempts || n.learning?.taste?.attempts || [],
      ).filter((a) => Number.isFinite(a.accuracy)),
    ]),
  );
  const assessed = (n) => assessmentCache.get(n.id) || [];
  const evidence = (n) =>
    Boolean(
      text(n.description) ||
      (sessionsByNode.get(n.id) || []).length ||
      (notesByNode.get(n.id) || []).length ||
      Object.values(n.learning || {}).some((v) =>
        Object.values(v || {}).some(
          (x) => text(x) || (Array.isArray(x) && x.length),
        ),
      ),
    );
  const ready = (n) => {
    const a = assessed(n);
    return a.length
      ? a.every(
          (x) =>
            x.accuracy >= 80 &&
            ![
              "Misconception",
              "Knowledge gap",
              "Incorrect",
              "Lucky/uncertain answer",
            ].includes(x.result),
        )
      : n.status === "Confident";
  };
  const readPrereqs = (n) => [
    ...new Set([
      ...(n.prerequisites || []).filter((p) => typeof p === "string"),
      ...text(n.learning?.peel?.prerequisites)
        .split(/\n/)
        .filter((v) => /^\s*[-*•]\s+/.test(v))
        .map((v) => v.replace(/^\s*[-*•]\s+/, "").trim())
        .filter((v) => v.split(/\s+/).length <= 8),
    ]),
  ];
  const prerequisiteCache = new Map(active.map((n) => [n.id, readPrereqs(n)]));
  const prereqs = (n) => prerequisiteCache.get(n.id) || [];
  const linksByNode = new Map(active.map((n) => [n.id, new Set()]));
  const childrenByNode = new Map();
  const titleIndex = new Map(),
    prerequisiteIndex = new Map();
  const titleTokens = new Map(active.map((n) => [n.id, tokens(n.title)]));
  const index = (map, key, id) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(id);
  };
  for (const n of active) {
    for (const id of n.links || [])
      if (activeIds.has(id)) {
        linksByNode.get(n.id).add(id);
        linksByNode.get(id).add(n.id);
      }
    if (!childrenByNode.has(n.parent)) childrenByNode.set(n.parent, []);
    childrenByNode.get(n.parent).push(n);
    for (const word of titleTokens.get(n.id)) index(titleIndex, word, n.id);
    for (const p of prereqs(n))
      index(prerequisiteIndex, normalizeKnowledge(p), n.id);
  }
  const outgoing = (n) => linksByNode.get(n.id);
  const report = [];
  function add(n, kind, title, why, next, action, priority = 50, extra = {}) {
    const sessionGoals = (sessionsByNode.get(n.id) || []).map((s) => s.goalId);
    const goal = (data.goals || []).find(
      (g) => [n.goalId, ...sessionGoals].includes(g.id) && g.progress < 100,
    );
    report.push({
      id: `${n.id}:${kind}:${extra.targetId || extra.topic || ""}`,
      concept: n.id,
      kind,
      title,
      body: why,
      evidence: why,
      next,
      action,
      priority: priority + (goal ? 5 : 0),
      basis: "Recorded evidence",
      goal: goal?.title,
      ...extra,
    });
  }
  const dependencyEdges = new Map(
    active.map((n) => [
      n.id,
      prereqs(n).flatMap((p) =>
        (names.get(normalizeKnowledge(p)) || []).map((x) => x.id),
      ),
    ]),
  );
  const reaches = (from, to, seen = new Set()) => {
    if (from === to) return true;
    if (seen.has(from)) return false;
    seen.add(from);
    return (dependencyEdges.get(from) || []).some((id) =>
      reaches(id, to, seen),
    );
  };
  for (const n of subjects) {
    for (const stretch of (data.stretches || []).filter(s => s.status === "completed" && s.knowledgeIds?.includes(n.id) && s.studyGap?.trim() && !s.gapResolved)) {
      add(n, "practice-gap", `Practice revealed a gap: ${n.title}`, `During “${stretch.title}”: ${stretch.studyGap}`, "Return to the source, investigate the gap with Chew, then try another stretch. Mark the gap addressed in your practice result when ready.", "chew", 94, { topic: stretch.id, basis: "Your recorded Stretch reflection" });
    }
    const attempts = assessed(n),
      engaged = evidence(n),
      links = outgoing(n),
      sessions = sessionsByNode.get(n.id) || [];
    // Named outline items give us an expected body of knowledge without
    // inventing a curriculum or treating arbitrary prose as prerequisites.
    const outlineTopics = [...new Set([
      ...text(n.learning?.peel?.components).split("\n").filter(v=>/^\s*[-*•]\s+/.test(v)).map(v=>v.replace(/^\s*[-*•]\s+/,"")),
      ...text(n.description).split("\n").filter(v=>/^#{2,4}\s+/.test(v)).map(v=>v.replace(/^#{2,4}\s+/,"")),
    ].map(v=>v.trim()).filter(v=>v.length>3&&v.length<90&&v.split(/\s+/).length<=8))];
    for(const topic of outlineTopics) if(normalizeKnowledge(topic)!==normalizeKnowledge(n.title) && !names.has(normalizeKnowledge(topic))) {
      add(n,"coverage",`Develop the outlined topic: ${topic}`,`Your saved outline for “${n.title}” names “${topic}”, but it has no matching active concept anywhere in the ecosystem.`,"Check whether this deserves its own concept. Plant it if you want to develop and assess it separately.","plant",57,{topic,basis:"Topic named in your study outline"});
    }
    for (const prerequisite of prereqs(n)) {
      const matches = names.get(normalizeKnowledge(prerequisite)) || [];
      if (!matches.length)
        add(
          n,
          "prerequisite",
          `Missing prerequisite: ${prerequisite}`,
          `“${n.title}” lists “${prerequisite}” as a prerequisite, but no active concept or alias matches it in any forest.`,
          `Plant “${prerequisite}”, then define and test it before returning here.`,
          "plant",
          95,
          { topic: prerequisite, basis: "Explicit prerequisite" },
        );
      else if (matches.some((x) => reaches(x.id, n.id)))
        add(
          n,
          "structure",
          `Check a prerequisite cycle around ${n.title}`,
          `The recorded prerequisite chain loops back to this source through “${prerequisite}”.`,
          "Review whether this is a prerequisite or a related idea; correct the source prerequisites.",
          "edit",
          88,
          { topic: prerequisite },
        );
      else if (!matches.some(ready))
        add(
          n,
          "prerequisite",
          `Strengthen ${prerequisite} first`,
          `This prerequisite exists, but readiness is not established: assessment evidence is weak or no confident status has been recorded.`,
          `Open “${matches[0].title}” and assess it before advancing.`,
          "test",
          85,
          { targetId: matches[0].id, basis: "Missing readiness evidence" },
        );
    }
    const weak = attempts.filter(
      (a) =>
        a.accuracy < 80 ||
        [
          "Misconception",
          "Knowledge gap",
          "Incorrect",
          "Partially correct",
          "Lucky/uncertain answer",
        ].includes(a.result),
    );
    const groups = new Map();
    for (const a of weak) {
      const gap = a.gap || "Understanding gaps";
      if (!groups.has(gap)) groups.set(gap, []);
      groups.get(gap).push(a);
    }
    for (const [gap, items] of groups)
      add(
        n,
        "understanding",
        `${gap.replace(/ gaps$/, " gap")}: ${n.title}`,
        `${items.length} latest question result(s) need attention: ${items.map((a) => `${a.question || a.coverage || "Assessment"} (${a.accuracy}%, ${a.result || "self-assessed"})`).join("; ")}`,
        `Revisit the weak material with ${prescriptions[gap] || "Test"}, then retest the same question.`,
        prescriptions[gap] || "test",
        items.some((a) => a.result === "Misconception") ? 98 : 90,
        { topic: gap, basis: "Self-assessed Test evidence" },
      );
    const over = attempts.filter(
      (a) => Number.isFinite(a.confidence) && a.confidence - a.accuracy > 20,
    );
    if (over.length)
      add(
        n,
        "calibration",
        `Check confidence in ${n.title}`,
        `${over.length} latest answer(s) have confidence more than 20 points above assessed accuracy.`,
        "Explain from memory before checking the source, then compare confidence with accuracy.",
        "regurgitate",
        80,
        { basis: "Self-assessed calibration" },
      );
    const recall = [...(n.learning?.regurgitate?.attempts || [])]
      .sort((a, b) => time(a.at) - time(b.at))
      .at(-1);
    if (recall && Number.isFinite(recall.accuracy) && recall.accuracy < 80)
      add(
        n,
        "recall",
        `Recall gap: ${n.title}`,
        `Your latest recorded recall accuracy is ${recall.accuracy}%.`,
        "Recall without notes, compare with the source, and record the missing ideas.",
        "regurgitate",
        88,
      );
    if (engaged && !attempts.length && !recall)
      add(
        n,
        "assessment",
        `Find out what you know about ${n.title}`,
        "Content or study activity exists, but there is no scored Test or recorded recall evidence.",
        "Run a diagnostic Test to separate familiarity from demonstrated understanding.",
        "test",
        65,
        { basis: "Missing assessment evidence" },
      );
    if (engaged) {
      const fields = n.learning?.peel || {},
        chew = n.learning?.chew || {};
      const gaps = [
        !text(fields.definitions) &&
          !text(fields.formal_definition) &&
          "a definition",
        !text(fields.mechanisms) &&
          !text(chew.reason) &&
          "an explanation of how or why",
        !text(fields.examples) && !text(chew.work) && "a worked example",
      ].filter(Boolean);
      if (gaps.length)
        add(
          n,
          "coverage",
          `Make the foundations explicit: ${n.title}`,
          `The structured study fields do not yet document ${gaps.join(", ")}. This does not establish that you lack this knowledge.`,
          "Record or verify these foundations in Peel; use an existing resource where possible.",
          "peel",
          45,
          { basis: "Documentation gap" },
        );
      const refs = (data.resources || []).filter(
        (r) =>
          (r.concepts || []).includes(n.id) ||
          (r.knowledgeRefs || []).some((x) => x.nodeId === n.id),
      );
      if (!refs.length)
        add(
          n,
          "evidence",
          `Add a source for ${n.title}`,
          "This studied source has no linked learning material or reference.",
          "Attach a book, report, lecture or other source and record the relevant pages or timestamp.",
          "content",
          40,
          { basis: "Missing source evidence" },
        );
      const dates = [n.reviewed, ...attempts.map((a) => a.at), recall?.at]
          .map(time)
          .filter(Boolean),
        last = Math.max(0, ...dates);
      const studied = Math.max(
        0,
        ...sessions.map((s) => time(s.completedAt || s.date)),
      );
      const interval =
        weak.length || recall?.accuracy < 80
          ? 3
          : attempts.length && attempts.every((a) => a.accuracy >= 90)
            ? 14
            : 7;
      if (
        (last && now - last > interval * DAY) ||
        (!last && studied && now - studied > 7 * DAY)
      )
        add(
          n,
          "review",
          `Review ${n.title}`,
          last
            ? `The latest recorded review/assessment is ${Math.floor((now - last) / DAY)} days old; the current evidence suggests a ${interval}-day review interval.`
            : "Study was completed over a week ago with no recorded review.",
          "Test recall before rereading and record a fresh assessment.",
          "regurgitate",
          60,
          { basis: "Review schedule heuristic" },
        );
      if (ready(n) && !(n.applied || n.learning?.apply?.entries?.length))
        add(
          n,
          "application",
          `Take ${n.title} into practice`,
          "Readiness is recorded, but this concept has no explicit application record. Area-level Stretch activity cannot prove this particular concept was applied.",
          "Use Stretch to practise this concept, then document its application on the source.",
          "content",
          50,
          { basis: "Missing concept-level application evidence" },
        );
    }
    const question = text(n.learning?.squeeze?.questions);
    if (question)
      add(
        n,
        "questions",
        `Resolve the questions in ${n.title}`,
        `Your Open questions field contains: ${question.slice(0, 350)}`,
        "Investigate the question, update the field when resolved, or Plant it as a learning question.",
        "squeeze",
        70,
        { basis: "Learner-recorded open question" },
      );
    if (n.kind === "seed")
      add(
        n,
        "questions",
        `Develop your question: ${n.title}`,
        "This source is a seed that has not yet been grown into a branch or tree.",
        "Clarify the learning question, find a source, then grow the seed when its scope is clear.",
        "grow-seed",
        55,
      );
    if (engaged) {
      const body = normalizeKnowledge(corpus.get(n.id)),
        ownTokens = tokens(corpus.get(n.id));
      const candidateIds = new Set(
        [...ownTokens].flatMap((word) => [...(titleIndex.get(word) || [])]),
      );
      for (const p of prereqs(n))
        for (const id of prerequisiteIndex.get(normalizeKnowledge(p)) || [])
          candidateIds.add(id);
      const candidates = [...candidateIds]
        .map((id) => byId.get(id))
        .filter(
          (x) =>
            x.id !== n.id &&
            !links.has(x.id) &&
            x.parent !== n.id &&
            n.parent !== x.id &&
            !x.lineage?.sourceId,
        )
        .map((x) => {
          const title = normalizeKnowledge(x.title),
            mention = title.length >= 5 && ` ${body} `.includes(` ${title} `);
          const overlap = [...titleTokens.get(x.id)].filter((t) =>
            ownTokens.has(t),
          );
          const shared = prereqs(n).filter((p) =>
            prereqs(x).some(
              (q) => normalizeKnowledge(p) === normalizeKnowledge(q),
            ),
          );
          return {
            x,
            mention,
            overlap,
            shared,
            score: mention
              ? 100
              : shared.length
                ? 70
                : overlap.length >= 2
                  ? 40 + overlap.length
                  : 0,
          };
        })
        .filter((c) => c.score)
        .sort((a, b) => b.score - a.score || a.x.title.localeCompare(b.x.title))
        .slice(0, 2);
      for (const c of candidates)
        add(
          n,
          "connection",
          `Consider linking ${n.title} → ${c.x.title}`,
          c.mention
            ? `Your saved content mentions “${c.x.title}”, but no graft joins these sources.`
            : c.shared.length
              ? `These sources share the recorded prerequisite(s): ${c.shared.join(", ")}.`
              : `Shared terms in your content and the target title: ${c.overlap.join(", ")}.`,
          "Inspect both sources and decide what the relationship means before grafting.",
          "connect",
          c.mention ? 72 : 42,
          {
            targetId: c.x.id,
            basis: c.mention
              ? "Text mention · candidate connection"
              : "Lexical/structural candidate",
            candidate: true,
          },
        );
      if (!links.size && !candidates.length)
        add(
          n,
          "connection",
          `Explore connections for ${n.title}`,
          "This source has no active cross-links. There is not enough matching evidence to name a reliable target.",
          "Describe its relationships in Absorb, or add prerequisite concepts and related resources.",
          "absorb",
          30,
          { basis: "Graph gap" },
        );
    }
    const children = childrenByNode.get(n.id) || [];
    if (children.length >= 3) {
      const untested = children.filter(
        (x) =>
          !assessed(x).length && !x.learning?.regurgitate?.attempts?.length,
      );
      if (untested.length)
        add(
          n,
          "branch",
          `Unassessed knowledge under ${n.title}`,
          `${untested.length} of ${children.length} immediate branches/concepts have no recorded assessment: ${untested
            .slice(0, 5)
            .map((x) => x.title)
            .join(", ")}.`,
          "Start with one unassessed concept and record a Test result.",
          "test",
          52,
          { targetId: untested[0].id, basis: "Branch assessment coverage" },
        );
    }
  }
  const unique = [...new Map(report.map((s) => [s.id, s])).values()].sort(
    (a, b) => b.priority - a.priority || a.title.localeCompare(b.title),
  );
  return {
    suggestions: unique,
    scanned: subjects.length,
    globalCount: active.length,
    assessed: subjects.filter((n) => assessed(n).length).length,
    generatedAt: now,
  };
}
