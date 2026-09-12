import React, { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Network,
  Sprout,
  Target,
  Flame,
  ChartNoAxesCombined,
  Wheat,
} from "lucide-react";
import "./landing-story.css";

const stages = [
  {
    name: "Resources",
    icon: BookOpen,
    question: "What can I learn from?",
    copy: "Bring your books, PDFs, articles, audio, videos and course links. Give your sources a home alongside the knowledge they support.",
    example: "A chapter on giving useful feedback",
    next: "Sources give your knowledge substance.",
  },
  {
    name: "Knowledge",
    icon: Network,
    question: "What do I need to know?",
    copy: "Life Areas become Forests; Sub-Life Areas become Groves. Grow topic Trees with Roots, Stems, Branches, Leaves and Fruits. Graft connections across them.",
    example: "Leadership → Management → Feedback",
    next: "A connected idea becomes something you can study.",
  },
  {
    name: "Study",
    icon: BookOpen,
    question: "How will I understand and remember it?",
    copy: "Peel the foundations, Squeeze for depth, Chew through reasoning and Regurgitate from memory. Record gaps and return to the ideas that need attention.",
    example: "Explain the feedback framework from memory",
    next: "Understanding informs practice. Practice reveals what to study next.",
  },
  {
    name: "Stretch",
    icon: Flame,
    question: "How will I practice and use it?",
    copy: "Rehearse internally, try a simulation, practise with someone, or use the idea in real life. Define success, Apply your knowledge and reflect on the result.",
    example: "Rehearse a difficult feedback conversation",
    next: "Study and Stretch run in parallel; you can begin practising while learning.",
  },
  {
    name: "Harvest",
    icon: Wheat,
    question: "What did it produce?",
    copy: "Record an insight, artifact, outcome, opportunity or evidence of capability. Completing a practice and producing a result are different events.",
    example: "An agreed improvement plan and a clearer conversation",
    next: "Results give your development a record you can return to.",
  },
  {
    name: "BARNS",
    icon: Sprout,
    question: "What am I becoming able to carry?",
    copy: "Review 16 dimensions of capacity alongside recorded practice, Study, goals and Harvest evidence. Reflect on the abilities you are developing across different life contexts.",
    example: "Communication and Leadership capacity",
    next: "Capacity indicators support reflection; they are not a certification of ability.",
  },
  {
    name: "Growth",
    icon: ChartNoAxesCombined,
    question: "How am I changing over time?",
    copy: "Bring Study activity, knowledge, practice and goals into view. Use your records to reflect on where your attention is going and what deserves your next effort.",
    example: "Review the month and choose the next meaningful step",
    next: "Your reflection informs the next goal, resource and learning question.",
  },
];

export function EcosystemStory() {
  const [active, setActive] = useState(2);
  const current = stages[active];
  const Icon = current.icon;
  return (
    <section className="ecosystem-story" id="whole-system">
      <div className="story-heading">
        <span className="eyebrow">ONE ECOSYSTEM FOR LEARNING AND GROWTH</span>
        <h2>Everything connects.</h2>
        <p>
          Follow an idea from the source that sparked it to the capability it
          helps you develop.
        </p>
      </div>
      <div className="story-context">
        <span>
          <Sprout size={16} /> Life Areas <small>Where growth matters</small>
        </span>
        <span>
          <Target size={16} /> Goals{" "}
          <small>What you want to become or produce</small>
        </span>
      </div>
      <div
        className="ecosystem-route"
        role="tablist"
        aria-label="Explore the learning ecosystem"
      >
        {stages.map((stage, i) => {
          const StageIcon = stage.icon;
          return (
            <React.Fragment key={stage.name}>
              {i > 0 && (
                <span
                  className={
                    i === 3 ? "route-connector feedback" : "route-connector"
                  }
                  aria-hidden="true"
                >
                  {i === 3 ? "↔" : "→"}
                </span>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={i === active}
                id={`system-tab-${i}`}
                aria-controls="system-story-panel"
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => {
                  if (
                    ["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? stages.length - 1
                          : (i +
                              (e.key === "ArrowRight" ? 1 : -1) +
                              stages.length) %
                            stages.length;
                    setActive(next);
                    document.getElementById(`system-tab-${next}`)?.focus();
                  }
                }}
              >
                <StageIcon size={25} />
                <strong>{stage.name}</strong>
              </button>
            </React.Fragment>
          );
        })}
      </div>
      <div
        className="story-panel"
        role="tabpanel"
        id="system-story-panel"
        aria-labelledby={`system-tab-${active}`}
      >
        <div className="story-panel-copy">
          <span className="story-index">0{active + 1} / 07</span>
          <h3>{current.question}</h3>
          <p>{current.copy}</p>
          <small>{current.next}</small>
        </div>
        <div className="story-example">
          <span>FOLLOW ONE IDEA · ILLUSTRATIVE EXAMPLE</span>
          <Icon size={44} strokeWidth={1.4} />
          <strong>{current.example}</strong>
          <div className="story-example-dots" aria-hidden="true">
            {stages.map((s, i) => (
              <i key={s.name} className={i <= active ? "lit" : ""} />
            ))}
          </div>
        </div>
      </div>
      <p className="story-loop-note">
        Study grows what you know. Stretch grows what you can do.
        <br />
        <strong>Feedback carries you between them.</strong>
      </p>
    </section>
  );
}

export function GrowthStory({ navigate }) {
  return (
    <>
      <section className="story-outcomes" id="harvest">
        <div>
          <span className="eyebrow">GROWTH SHOULD PRODUCE SOMETHING</span>
          <h2>See what your knowledge bears.</h2>
          <p>
            A better decision. A finished project. A changed behavior. An
            insight that changes your next attempt.
          </p>
          <p>
            Record these as Harvests and keep evidence of what your learning and
            practice made possible.
          </p>
        </div>
        <div className="harvest-examples">
          <span>ILLUSTRATIVE HARVESTS</span>
          {[
            ["Artifact", "A presentation you created"],
            ["Outcome", "An improvement you can describe"],
            ["Insight", "Something discovered through doing"],
            ["Evidence", "A result that demonstrates capability"],
          ].map(([label, text]) => (
            <article key={label}>
              <Wheat size={22} />
              <div>
                <small>{label}</small>
                <strong>{text}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="story-development" id="barns-story">
        <div className="story-heading">
          <span className="eyebrow">GIVE YOUR GROWTH SOMEWHERE TO GO</span>
          <h2>What are you becoming able to carry?</h2>
        </div>
        <div className="development-grid">
          {[
            [
              "BARNS",
              "Develop across 16 capacities.",
              "Spiritual, Intellectual, Cognitive, Emotional, Physical, Relational, Professional, Leadership, Financial, Creative, Execution, Learning, Communication, Responsibility, Impact and Character. Review recorded evidence alongside your own assessment.",
            ],
            [
              "Goals",
              "Connect this day to this year.",
              "Set daily, weekly, monthly, quarterly and yearly goals across your life areas. Link the capacities you want to develop. An important discovery can become a goal; a goal can give your next Study and Stretch a purpose.",
            ],
            [
              "Growth",
              "Reflect on what is changing.",
              "Review focused Study time, knowledge records, practice and goal progress. Growth reports your development; BARNS is where you explore your capacities. Use the story so far to choose what comes next.",
            ],
          ].map(([name, title, copy]) => (
            <article key={name}>
              <span className="eyebrow">{name}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="story-audiences" id="learners">
        <div className="story-heading">
          <span className="eyebrow">WHO ECOSTUDY IS FOR</span>
          <h2>For people who intend to keep growing.</h2>
        </div>
        <div>
          {[
            [
              "Students",
              "Build knowledge you can remember, connect and carry beyond the classroom.",
            ],
            [
              "Professionals",
              "Turn courses, reports and workplace experience into understanding you can use.",
            ],
            [
              "Lifelong learners",
              "Give everything you are curious about somewhere intentional to grow.",
            ],
            [
              "Builders, leaders & creators",
              "Connect what you learn to the things you build, lead, solve and create.",
            ],
          ].map(([title, copy]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <button className="btn primary" onClick={() => navigate("signup")}>
          Start growing <ArrowRight size={17} />
        </button>
      </section>
    </>
  );
}
