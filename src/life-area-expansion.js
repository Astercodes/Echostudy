// Additive catalog revision: existing names and IDs are never replaced.
export const additionalSubAreas = {
  faith: ["Obedience"],
  mind: ["Synthesis"],
  emotional: [
    "Coping strategies",
    "Emotional vocabulary",
    "Managing uncertainty",
    "Psychological wellbeing",
  ],
  skills: ["Professional skills", "Deliberate practice", "Certifications"],
  relationships: ["Peer relationships"],
  marriage: ["Fidelity", "Sexual intimacy"],
  parenting: ["Fertility and family planning"],
  home: [
    "Meal planning",
    "Home maintenance",
    "Household systems",
    "Family administration",
    "Hosting/hospitality",
  ],
  discipline: ["Personal organization"],
  recreation: ["Cultural experiences", "Personal style"],
  purpose: [
    "Major life transitions",
    "Grief/loss",
    "Mortality",
    "End-of-life planning",
    "Aging and life course",
    "Intellectual legacy",
  ],
};
export const additionalAreas = [
  [
    "identity",
    "Identity & self-knowledge",
    "#ffd7b0",
    [
      "Identity",
      "Values",
      "Beliefs",
      "Worldview",
      "Strengths",
      "Weaknesses",
      "Personality",
      "Gifts",
      "Talents",
      "Convictions",
      "Boundaries",
      "Self-concept",
      "Personal standards",
      "Self-respect",
      "Authenticity",
      "Sense of meaning",
    ],
  ],
  [
    "character",
    "Character & virtue",
    "#173dc5",
    [
      "Integrity",
      "Honesty",
      "Humility",
      "Courage",
      "Patience",
      "Kindness",
      "Responsibility",
      "Faithfulness",
      "Self-control",
      "Diligence",
      "Generosity",
      "Compassion",
      "Justice",
      "Reliability",
      "Teachability",
      "Perseverance",
    ],
  ],
  [
    "cognitive",
    "Cognitive & brain development",
    "#009cde",
    [
      "Attention",
      "Concentration",
      "Memory",
      "Working memory",
      "Processing speed",
      "Comprehension",
      "Cognitive flexibility",
      "Spatial reasoning",
      "Numerical reasoning",
      "Verbal reasoning",
      "Metacognition",
      "Cognitive endurance",
      "Brain health",
    ],
  ],
  [
    "communication",
    "Communication & expression",
    "#ff7900",
    [
      "Speaking",
      "Writing",
      "Listening",
      "Reading",
      "Vocabulary",
      "Articulation",
      "Storytelling",
      "Presentation",
      "Persuasion",
      "Negotiation",
      "Nonverbal communication",
      "Difficult conversations",
      "Public speaking",
      "Multilingual communication",
    ],
  ],
  [
    "leadership",
    "Leadership & influence",
    "#07529a",
    [
      "Self-leadership",
      "People leadership",
      "Management",
      "Delegation",
      "Coaching",
      "Mentoring",
      "Decision-making",
      "Conflict management",
      "Organizational leadership",
      "Team building",
      "Influence",
      "Governance",
      "Change management",
      "Succession",
    ],
  ],
  [
    "civic",
    "Community, citizenship & civic life",
    "#dcefff",
    [
      "Citizenship",
      "Civic knowledge",
      "Laws",
      "Voting",
      "Community participation",
      "Volunteering",
      "Public institutions",
      "Social responsibility",
      "Neighborhood involvement",
      "Advocacy",
      "Civic literacy",
      "National/global awareness",
    ],
  ],
  [
    "digital",
    "Digital & information life",
    "#009cde",
    [
      "Digital identity",
      "Online reputation",
      "Cybersecurity",
      "Privacy",
      "Social media",
      "Screen time",
      "Information consumption",
      "Information hygiene",
      "AI literacy",
      "Digital organization",
      "Files/data",
      "Digital communication",
      "Digital wellbeing",
    ],
  ],
  [
    "safety",
    "Safety, security & preparedness",
    "#ffd7b0",
    [
      "Personal safety",
      "Home security",
      "Cybersecurity",
      "Financial protection",
      "Emergency preparedness",
      "First aid",
      "Disaster readiness",
      "Legal preparedness",
      "Insurance",
      "Document security",
      "Travel safety",
      "Risk awareness",
    ],
  ],
];
const normalize = (s) => s.trim().toLowerCase();
function append(area, names, prefix) {
  const subAreas = [...area.subAreas];
  names.forEach((name, i) => {
    if (subAreas.some((s) => normalize(s.name) === normalize(name))) return;
    let id = `${prefix}-${i + 1}`;
    while (subAreas.some((s) => s.id === id)) id += "-new";
    subAreas.push({ id, name });
  });
  return { ...area, subAreas };
}
export function expandLifeAreas(areas) {
  const result = areas.map((a) =>
    append(a, additionalSubAreas[a.id] || [], `${a.id}-expansion`),
  );
  for (const [id, name, color, names] of additionalAreas) {
    // Reuse a user-created equivalent category without changing its ID or name.
    const index = result.findIndex(
      (a) => normalize(a.name) === normalize(name),
    );
    if (index >= 0)
      result[index] = append(
        result[index],
        names,
        `${result[index].id}-expansion`,
      );
    else {
      let newId = id;
      while (result.some((a) => a.id === newId)) newId += "-catalog";
      result.push(
        append(
          { id: newId, name, color, subAreas: [] },
          names,
          `${newId}-expansion`,
        ),
      );
    }
  }
  return result;
}
