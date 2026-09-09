import React, { useState } from "react";
import { ArrowRight, Network, Mic, BookOpen, Target } from "lucide-react";
import "./landing-details.css";
const actions = [
  [
    "Taste",
    "Get your bearings.",
    "Start with a quick meaning, the big idea, why it matters, and a simple example. Decide where to go deeper.",
    "Quick meaning · Why it matters · Prerequisite preview",
  ],
  [
    "Peel",
    "Understand layer by layer.",
    "Explore foundations, definitions, parts, mechanisms and boundaries. Build an explanation that makes sense to you.",
    "Foundations · Formal definition · Worked example",
  ],
  [
    "Squeeze",
    "Look beyond the obvious.",
    "Investigate assumptions, exceptions, evidence, trade-offs and second-order effects. Capture what a surface reading would miss.",
    "Hidden assumptions · Counterevidence · Expert insights",
  ],
  [
    "Chew",
    "Think with the idea.",
    "Teach it back, reconstruct it, compare it, challenge it and solve a problem. Work through your own reasoning.",
    "Teach back · Diagnose · Generate counterexamples",
  ],
  [
    "Regurgitate",
    "Bring it back from memory.",
    "Recall before revealing the source. Try a definition, a process, a diagram or an explanation, then record gaps and corrections.",
    "Free recall · Teach from memory · Confidence calibration",
  ],
  [
    "Absorb / Take Root",
    "Make it part of your understanding.",
    "Reflect, meditate, reconcile conflicting ideas and connect new knowledge with what you already know.",
    "Synthesis · Mental models · Changed understanding",
  ],
  [
    "Test",
    "Find what needs attention.",
    "Use your question bank and reference answers to assess understanding. Record confidence, accuracy and gaps to guide your next study action.",
    "Question formats · Difficulty · Diagnostic history",
  ],
  [
    "Plant",
    "Give the next question a home.",
    "Turn a discovered idea into a seed. Record why it matters and choose where it should grow, while keeping its source.",
    "Learning question · Desired outcome · Intentional placement",
  ],
  [
    "Pluck",
    "Study independently, keep the lineage.",
    "Make a standalone copy for deeper investigation without losing the original. Moving the original is an explicit choice.",
    "Independent copy · Source lineage · Study pathway",
  ],
  [
    "Graft",
    "Make a meaningful connection.",
    "Link knowledge across branches, trees, groves and forests. Explain whether an idea supports, depends on, extends or contradicts another.",
    "Relationship type · Direction · Evidence",
  ],
  [
    "Prune",
    "Keep your knowledge useful.",
    "Review redundancy, weak evidence or misplaced ideas. Correct content or remove it from active view with history preserved for restoration.",
    "Correction · Reclassification · Recoverable removal",
  ],
];
const capacities = [
  "Spiritual",
  "Intellectual",
  "Cognitive",
  "Emotional",
  "Physical",
  "Relational",
  "Professional",
  "Leadership",
  "Financial",
  "Creative",
  "Execution",
  "Learning",
  "Communication",
  "Responsibility",
  "Impact",
  "Character",
];
export default function LandingDetails({ navigate }) {
  const [active, setActive] = useState(0);
  const action = actions[active];
  return (
    <div className="landing-expansion">
      <section className="landing-section ecosystem-intro" id="ecosystem">
        <div>
          <span className="eyebrow">THE BACKBONE OF YOUR LEARNING</span>
          <h2>
            A Knowledge Ecosystem.
            <br />
            <em>Room for a lifetime of ideas.</em>
          </h2>
          <p>
            Your life areas are forests. Their sub-areas are groves. Inside each
            grove, grow trees around the subjects you want to understand.
          </p>
          <p>
            Give each tree foundational roots and a core stem. Develop branches
            and sub-branches, capture atomic knowledge as leaves, and explore
            deeper subjects as fruits. New questions become seeds for what comes
            next.
          </p>
          <ul>
            <li>Filter a whole forest down to one grove or tree.</li>
            <li>
              Open any part in a focus tab, keeping its blue connections and
              parent path.
            </li>
            <li>
              Write inside knowledge objects and link ideas without duplicating
              their primary home.
            </li>
            <li>
              Use recorded prerequisites and connections to surface possible
              gaps and review needs.
            </li>
          </ul>
          <button className="text-btn" onClick={() => navigate("signup")}>
            Build your Knowledge Ecosystem <ArrowRight size={17} />
          </button>
        </div>
        <div className="landing-ecosystem-example">
          <span className="eyebrow">ILLUSTRATIVE KNOWLEDGE PATH</span>
          <ol className="landing-knowledge-path">
            {[
              ["Forest", "Leadership & Influence"],
              ["Grove", "Management"],
              ["Tree", "People Management"],
              ["Branch", "Performance Management"],
              ["Sub-branch", "Feedback"],
              ["Fruit", "Giving effective corrective feedback"],
            ].map(([kind, title]) => (
              <li key={kind}>
                <span>{kind}</span>
                <strong>{title}</strong>
              </li>
            ))}
          </ol>
          <div className="landing-root-notes">
            <p>
              <strong>Roots</strong> Human behavior, motivation
            </p>
            <p>
              <strong>Stem</strong> Core principles of managing people
            </p>
            <p>
              <strong>Leaves</strong> The SBI model, specific vs. general
              feedback
            </p>
            <p>
              <strong>Seed</strong> How does trust affect feedback?
            </p>
          </div>
        </div>
      </section>
      <section
        className="landing-section landing-action-section"
        id="study-actions"
      >
        <div className="landing-section-head">
          <div>
            <span className="eyebrow">CHOOSE HOW TO ENGAGE</span>
            <h2>
              Give every idea
              <br />
              <em>the attention it needs.</em>
            </h2>
          </div>
          <p>
            Explore, understand, reason, recall and connect.
            <br />
            Choose an action for the work in front of you.
          </p>
        </div>
        <div className="landing-action-demo">
          <div
            className="landing-action-tabs"
            role="tablist"
            aria-label="Explore knowledge actions"
          >
            {actions.map((a, i) => (
              <button
                key={a[0]}
                role="tab"
                id={"landing-action-" + i}
                aria-controls="landing-action-preview"
                aria-selected={active === i}
                onClick={() => setActive(i)}
              >
                {a[0]}
              </button>
            ))}
          </div>
          <div
            id="landing-action-preview"
            role="tabpanel"
            aria-labelledby={"landing-action-" + active}
          >
            <span className="eyebrow">{action[0]} · ACTION PREVIEW</span>
            <h3>{action[1]}</h3>
            <p>{action[2]}</p>
            <div className="landing-action-components">{action[3]}</div>
            <p className="landing-small">
              <Mic size={16} /> Write your own thinking or record audio and
              insert a transcript where browser support is available.
            </p>
          </div>
        </div>
        <p className="landing-small">
          Search within the expanded learning components. Your notes save as you
          work. Test uses self-assessment against references; its results do not
          certify readiness for practical work.
        </p>
      </section>
      <section className="landing-section" id="practice">
        <div className="landing-section-head">
          <div>
            <span className="eyebrow">FROM UNDERSTANDING TO DOING</span>
            <h2>
              Study builds understanding.
              <br />
              <em>Stretch puts abilities to work.</em>
            </h2>
          </div>
        </div>
        <div className="landing-practice-grid">
          <article>
            <span className="landing-feature-label">STRETCH WORKSPACE</span>
            <h3>Plan a real act of practice.</h3>
            <p>
              Describe the ability you will use, the activity you will attempt,
              and what successful practice looks like. Link it to goals, life
              areas, sub-areas and the capacities it builds.
            </p>
            <ul>
              <li>Set a practical objective with a clear outcome.</li>
              <li>Record what you did and the evidence of completion.</li>
              <li>Reflect on what changed and what to try next.</li>
            </ul>
            <div className="landing-practice-example">
              <small>EXAMPLE STRETCH</small>
              <strong>
                Give one specific, constructive piece of feedback.
              </strong>
              <p>
                Prepare an example, have the conversation, then reflect on
                clarity, listening and the response.
              </p>
            </div>
          </article>
          <article>
            <span className="landing-feature-label">BARNS</span>
            <h3>Reflect on the capacity you are building.</h3>
            <p>
              Review your own assessment alongside colorful percentage charts
              and filling cups that reflect linked study, completed stretches
              and goal progress.
            </p>
            <p>
              A life area tells you where you are growing. A capacity describes
              an ability you can bring to that area.
            </p>
            <div className="landing-practice-example">
              <small>ONE ACTIVITY, SEVERAL CAPACITIES</small>
              <strong>
                Feedback practice can build communication, emotional, relational
                and leadership capacity.
              </strong>
              <p>
                Effort indicators show activity. Your self-assessment records
                what you believe you can now handle.
              </p>
            </div>
          </article>
        </div>
        <details className="landing-capacity-details">
          <summary>Explore the 16 dimensions of capacity</summary>
          <div>
            {capacities.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </details>
      </section>
      <section className="landing-section landing-day">
        <span className="eyebrow">A CONNECTED DAY, IN PRACTICE</span>
        <h2>
          One larger goal.
          <br />
          <em>A clear next step.</em>
        </h2>
        <p className="landing-small">
          Illustrative plan: becoming a more effective people manager.
        </p>
        <div className="landing-goal-ladder">
          {[
            ["Year", "Become a more capable people manager"],
            ["Quarter", "Develop core management skills"],
            ["Month", "Improve feedback conversations"],
            ["Week", "Understand corrective feedback"],
            ["Today", "Explain and practise the SBI model"],
          ].map(([period, goal]) => (
            <div key={period}>
              <span>{period}</span>
              <strong>{goal}</strong>
            </div>
          ))}
        </div>
        <div className="landing-day-steps">
          {[
            [
              "01 · PLAN",
              "Protect a realistic study window",
              "Keep sleep, work, relationships and recovery in your 24-hour plan.",
            ],
            [
              "02 · STUDY",
              "Start with a specific objective",
              "Use the timer, read a resource and capture connected notes.",
            ],
            [
              "03 · CONNECT",
              "Develop the feedback branch",
              "Peel the model, recall it from memory, and record remaining questions.",
            ],
            [
              "04 · STRETCH & REFLECT",
              "Use the idea in a conversation",
              "Record the practical attempt, reflect on the result and review capacity growth.",
            ],
          ].map(([n, title, body]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
