import React from "react";
import copy from "./landing-copy.json";
import { ArrowRight } from "lucide-react";
import { EcosystemStory } from "./LandingStory";
import "./landing-copy.css";
import { editorialSections } from "./LandingEditorial";

const ids = {
  "THE PROBLEM": "how-it-works",
  "THE IDEA": "ecosystem",
  "RESOURCE LIBRARY": "resources",
  STUDY: "study-actions",
  "STUDY WORKSPACE": "grow",
  "KNOWLEDGE ECOSYSTEM": "cultivate",
  "FROM LEARNING TO DOING": "practice",
  "LEARNING + DOING": "learning-loop",
  HARVEST: "harvest",
  BARNS: "barns-story",
  GOALS: "goals-story",
  GROWTH: "growth-story",
  "WHO ECOSTUDY IS FOR": "learners",
};
const planned = {
  "Choose a capacity you want to intentionally build, create a focused Build, and develop it over 7, 30, 90 days, or your own timeframe.":
    "Planned: focused Capacity Builds over 7, 30, 90 days, or your own timeframe.",
  "And keep your focus with a built-in timer or Pomodoro sessions with scheduled breaks.":
    "Keep your focus with the built-in timer. Pomodoro sessions with scheduled breaks are planned.",
  "Or choose your own timeframe.":
    "Custom goal horizons are planned; daily through yearly goals are available.",
  "And discover patterns in how you learn best.":
    "Personalized analysis of how you learn best is planned.",
};
function text(line) {
  return (planned[line] || line).replaceAll("EcoStudy", "ecostudy");
}
function Inline({ value }) {
  return text(value)
    .split(/(\*\*.*?\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <React.Fragment key={i}>{part.replace(/^\*|\*$/g, "")}</React.Fragment>
      ),
    );
}
function Section({ section, navigate, index }) {
  const heading = section.lines.findIndex((line) => line.startsWith("# "));
  const title =
    heading >= 0
      ? section.lines[heading].slice(2)
      : "Built for people who intend to keep growing.";
  const body = section.lines.slice(heading >= 0 ? heading + 1 : 1);
  const groups = [];
  let current = { title: "", lines: [] };
  for (const line of body) {
    if (/^#{2,3} /.test(line)) {
      if (current.title || current.lines.length) groups.push(current);
      current = { title: line.replace(/^#+ /, ""), lines: [] };
    } else current.lines.push(line);
  }
  if (current.title || current.lines.length) groups.push(current);
  return (
    <section
      className={`copy-section copy-${ids[section.name]}`}
      id={ids[section.name]}
    >
      <header>
        <span className="eyebrow">{text(section.name)}</span>
        <h2>{text(title)}</h2>
        <p>
          {text(
            section.lines[0]?.startsWith("### ")
              ? section.lines[0].slice(4)
              : "",
          )}
        </p>
      </header>
      <div className="copy-groups">
        {groups.map((group, i) => (
          <article
            key={i}
            className={group.title ? "copy-card" : "copy-prose"}
            id={
              group.title === "Students"
                ? "students"
                : group.title === "Lifelong Learners"
                  ? "lifelong-learners"
                  : undefined
            }
          >
            {group.title && <h3>{text(group.title)}</h3>}
            {group.title === "Check Ripeness" && (
              <span className="copy-planned">Planned readiness assessment</span>
            )}
            {group.lines.map((line, j) =>
              line.includes("→**") && !line.includes("Study →") ? (
                <button
                  key={j}
                  className="text-btn"
                  onClick={() => navigate("signup")}
                >
                  <Inline value={line.replace("→", "")} />
                  <ArrowRight size={16} />
                </button>
              ) : (
                <p
                  key={j}
                  className={
                    line.startsWith("**") &&
                    line.endsWith("**") &&
                    line.length < 42
                      ? "copy-pill"
                      : ""
                  }
                >
                  <Inline value={line} />
                </p>
              ),
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
export default function LandingCopy({ navigate }) {
  const sections = copy.filter((s) => ids[s.name]);
  return (
    <div className="landing-copy">
      {sections.map((section, index) => {
        const Editorial = editorialSections[section.name];
        return (
          <React.Fragment key={section.name}>
            {Editorial ? (
              <Editorial navigate={navigate} />
            ) : (
              <Section section={section} navigate={navigate} />
            )}{" "}
            {section.name === "THE IDEA" && <EcosystemStory />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
