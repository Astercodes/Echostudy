export const LEARNING_MODES = {
  peel: {
    title: "Peel",
    meaning: "Understand layer by layer",
    fields: [
      ["foundations", "Foundations", "What basic ideas does this rest on?"],
      ["prerequisites", "Prerequisites", "What must you understand first?"],
      [
        "definitions",
        "Definitions",
        "Define the concept precisely in your own words.",
      ],
      ["mechanisms", "Mechanisms", "How and why does it work?"],
      ["components", "Components", "What parts make up the whole?"],
      [
        "assumptions",
        "Assumptions",
        "What must be true for this explanation to hold?",
      ],
      ["examples", "Examples", "Start with a simple example, then vary it."],
      [
        "advanced",
        "Advanced layers",
        "What becomes visible with deeper understanding?",
      ],
    ],
  },
  squeeze: {
    title: "Squeeze",
    meaning: "Study deeply",
    fields: [
      ["nuances", "Nuances", "Which subtleties are easily missed?"],
      ["implications", "Implications", "What follows from this idea?"],
      ["debates", "Debates", "Where do interpretations disagree, and why?"],
      [
        "edgeCases",
        "Edge cases",
        "When does this break down or behave differently?",
      ],
      [
        "relationships",
        "Relationships",
        "How does it connect to other knowledge?",
      ],
      [
        "evidence",
        "Evidence",
        "What supports or challenges it? Include sources.",
      ],
      ["questions", "Open questions", "What is still unclear or unresolved?"],
      ["applications", "Applications", "Where might this be useful?"],
    ],
  },
};
export function defaultQuestions(node) {
  return [
    {
      id: "recall",
      kind: "Explain from memory",
      prompt: `Explain ${node.title} from memory.`,
      answer: node.learning?.peel?.definitions || "",
    },
    {
      id: "mechanism",
      kind: "Answer a question",
      prompt: `How does ${node.title} work, and why?`,
      answer: node.learning?.peel?.mechanisms || "",
    },
    {
      id: "problem",
      kind: "Solve a problem",
      prompt: `Describe a problem involving ${node.title}, then solve it without notes.`,
      answer: "",
    },
    {
      id: "contrast",
      kind: "Distinguish concepts",
      prompt: `Compare ${node.title} with a similar concept. What is the crucial difference?`,
      answer: "",
    },
    {
      id: "limits",
      kind: "Expose weak understanding",
      prompt: `What assumptions or limits of ${node.title} can you explain? Where are you uncertain?`,
      answer: node.learning?.peel?.assumptions || "",
    },
  ];
}
