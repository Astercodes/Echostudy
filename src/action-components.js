const fields = (groups) =>
  Object.entries(groups).flatMap(([group, labels]) =>
    labels
      .split("|")
      .map((label) => [
        label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        label,
        `Record your ${label.toLowerCase()} for this knowledge. Include examples, reasoning or sources where relevant.`,
        group,
      ]),
  );
export const ACTION_COMPONENTS = {
  tasteExplore: {
    title: "Taste",
    meaning:
      "Explore: What am I about to learn, and is it worth going deeper? Keep this a light first encounter.",
    outcome:
      "I know what this is about and whether I want or need to explore it further.",
    fields: fields({
      Explore:
        "Quick Meaning|Big Idea|Why It Matters|Problem It Addresses|Where It Appears|Simple Example|Analogy|Interesting Insight|Prerequisite Preview|Complexity Preview|Learning Preview|Key Question",
    }),
  },
  peel: {
    outcome:
      "I understand what this is, what it is built upon, what it is made of, and how it basically works.",
    fields: fields({
      Orientation: "Concept Overview|Purpose|Context|Significance",
      Foundations:
        "Prerequisites|Foundational Principles|Prior Concepts|Background|Origin",
      Language:
        "Formal Definition|Plain-Language Definition|Key Terms|Notation/Symbols",
      Anatomy: "Parts|Structure|Roles|Inputs & Outputs",
      Mechanics: "How It Works|Process|Cause & Effect|Rules",
      Boundaries: "What It Is|What It Isn't|Common Confusions|Scope",
      Grounding: "Basic Example|Worked Example|Analogy|Visual Representation",
    }),
  },
  squeeze: {
    outcome:
      "I understand the depth, nuance, relationships, conditions and implications of this knowledge.",
    fields: fields({
      Principles: "Core Principles|Key Ideas|Essential Takeaways",
      Relationships:
        "Dependencies|Interactions|Cause-and-Effect Relationships|Cross-Concept Relationships",
      Patterns: "Recurring Patterns|Trends|Signals/Indicators|Sequences",
      "Assumptions & Conditions":
        "Explicit Assumptions|Hidden Assumptions|Necessary Conditions|Sufficient Conditions|Contextual Conditions",
      Nuance:
        "Exceptions|Edge Cases|Limitations|Ambiguities|Controversies/Debates|Alternative Perspectives",
      "Trade-offs": "Strengths|Weaknesses|Benefits|Costs|Risks|Constraints",
      Comparison:
        "Similarities|Differences|Alternatives|When to Use Which|Commonly Confused Distinctions",
      Implications:
        "Direct Implications|Second-Order Effects|Broader Significance|Practical Implications",
      Evidence:
        "Supporting Evidence|Counterevidence|Important Research/Data|Strength of Evidence|Source/Authority Context",
      "Expert Layer":
        "Expert Insights|Common Novice Mistakes|Professional Heuristics|Non-obvious Insights|Advanced Considerations",
    }),
  },
  chew: {
    outcome:
      "I can manipulate and reason with this knowledge rather than merely recognize it.",
    fields: fields({
      "Explain & Organize":
        "Restate|Explain|Teach Back|Decompose|Reconstruct|Categorize|Compare & Contrast|Sequence",
      Reason:
        "Reason|Analyze|Predict|Infer|Diagnose|Spot Errors|Correct Errors|Complete|Solve",
      Create:
        "Generate Examples|Generate Counterexamples|Create Analogies|Question|Defend|Challenge|Perspective Shift",
    }),
  },
  absorb: {
    outcome: "This knowledge has become part of my mental model.",
    fields: fields({
      Integrate:
        "Reflection|Meaning Making|Prior-Knowledge Connection|New Connections|Reconciliation|Misconception Revision|Synthesis|Mental Model Formation|Abstraction|Generalization|Contextualization|Personal Connection|Perspective Integration|Knowledge Compression|Insight Capture|Question Capture|Metacognitive Reflection|Knowledge Placement",
    }),
  },
  regurgitate: {
    title: "Regurgitate",
    fields: fields({
      Retrieve:
        "Free Recall|Focused Recall|Definition Recall|Fact Recall|Principle Recall|Process Recall|Structural Recall|Relationship Recall|Visual Recall|Formula/Notation Recall|Example Recall|Example Generation|Cued Recall|Progressive Hinting|Teach From Memory|Problem From Memory|Error Review|Confidence Calibration",
    }),
  },
  plant: {
    title: "Plant",
    fields: fields({
      "Intentional growth":
        "Seed/learning question|Purpose for learning|Desired outcome|Existing knowledge|Initial scope|Intended depth|Forest selection|Grove selection|Tree/Branch placement|Prerequisites|Related knowledge|Resource starting points|Guiding questions|Growth priority|Suggested learning path",
    }),
  },
  pluck: {
    title: "Pluck",
    fields: fields({
      "Independent study plan":
        "Selected knowledge|Reason for isolation|Original lineage|Retained context|Prerequisite links|Dependency links|Related knowledge|Desired new scope|Independent status|Destination|Study depth|Independent study pathway",
    }),
  },
  graft: {
    title: "Graft",
    fields: fields({
      Relationship:
        "Source knowledge|Target knowledge|Connection discovery|Connection type|Explanation|Direction|Dependency|Strength|Evidence for connection|Cross-Tree connection|Cross-Grove connection|Cross-Forest connection|Shared concepts|Conflicts|Implications of connection|Connection visualization",
    }),
  },
  prune: {
    title: "Prune",
    fields: fields({
      Diagnose:
        "Misconception detection|Incorrect knowledge|Outdated knowledge|Redundancy|Duplicate knowledge|Irrelevant material|Weak evidence|Unnecessary complexity|Overgrown concepts|Missing boundaries|Structural misplacement|Conflicting knowledge",
      Refine:
        "Merge opportunities|Split opportunities|Reclassification|Correction|Removal|Archive/history preservation|Post-pruning integrity check",
    }),
  },
  test: {
    title: "Test",
    fields: fields({
      "Knowledge Coverage":
        "Definitions|Facts|Principles|Processes|Relationships",
      "Understanding Assessment":
        "Explain why|Explain how|Distinguish concepts|Identify examples/non-examples",
      "Reasoning Assessment":
        "Analysis|Inference|Prediction|Diagnosis|Evaluation",
      "Scenario Assessment": "Novel situations|Cases|Contextual questions",
      Feedback:
        "Why correct|Why incorrect|Correct reasoning|Knowledge requiring review|Recommended Study Action",
      "Performance Review":
        "Depth|Weak areas|Strengths|Consistency|Improvement",
    }),
  },
};
export const RECALL_MODES = ACTION_COMPONENTS.regurgitate.fields.map(
  (f) => f[1],
);
export const TEST_FORMATS = [
  "Multiple choice",
  "Multiple response",
  "True/false with justification",
  "Fill-in-the-blank",
  "Matching",
  "Short answer",
  "Long answer",
  "Oral response",
  "Diagram labeling/reconstruction",
  "Calculation",
  "Problem solving",
];
export const TEST_DIFFICULTIES = [
  "Foundational",
  "Basic",
  "Intermediate",
  "Advanced",
  "Expert/challenge",
];
export const GRAFT_TYPES = [
  "Depends on",
  "Supports",
  "Extends",
  "Contradicts",
  "Similar to",
  "Different from",
  "Part of",
  "Causes",
  "Influences",
  "Example of",
  "Applied in",
];
export function expandLearningModes(modes) {
  for (const key of ["peel", "squeeze", "chew", "absorb"]) {
    const existing = modes[key].fields;
    const names = new Set(existing.map((f) => f[1].toLowerCase()));
    const keys = new Set(existing.map((f) => f[0]));
    modes[key] = {
      ...modes[key],
      outcome: ACTION_COMPONENTS[key].outcome,
      fields: [
        ...existing,
        ...ACTION_COMPONENTS[key].fields.filter(
          (f) => !names.has(f[1].toLowerCase()) && !keys.has(f[0]),
        ),
      ],
    };
  }
  modes.tasteExplore = ACTION_COMPONENTS.tasteExplore;
}
