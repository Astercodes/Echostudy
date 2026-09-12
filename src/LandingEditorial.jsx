import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Sprout,
  Network,
  Brain,
  Users,
  Globe,
  FlaskConical,
  Lightbulb,
  Headphones,
  Mic,
  Check,
  Target,
  PenTool,
  Leaf,
  Wheat,
  FileText,
  Layers,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { CAPACITIES } from "./barns";
import "./landing-editorial.css";

const intentions = [
  [
    "Taste",
    "Explore the possibility.",
    "What is this idea? Why does it matter? Decide whether to go deeper.",
    "Get your bearings",
    Lightbulb,
  ],
  [
    "Peel",
    "Reveal the foundations.",
    "Uncover definitions, prerequisites, mechanisms and examples. Build understanding layer by layer.",
    "Look beneath the surface",
    Layers,
  ],
  [
    "Squeeze",
    "Find the substance.",
    "Investigate nuances, trade-offs, evidence and implications. Extract what a quick read leaves behind.",
    "Discover what matters",
    Sparkles,
  ],
  [
    "Chew",
    "Make the reasoning yours.",
    "Explain, compare, question and solve. Work the idea until you can think with it.",
    "Think it through",
    Brain,
  ],
  [
    "Regurgitate",
    "Bring it back from memory.",
    "Close the source. Recall the idea in your own words and notice the missing pieces.",
    "Recall before revealing",
    Mic,
  ],
  [
    "Absorb",
    "Let ideas find each other.",
    "Connect new knowledge to what you already know. Reflect on how it changes your understanding.",
    "Build the connection",
    Network,
  ],
  [
    "Take Root",
    "Stay with the idea.",
    "Return, reflect and reinforce. Keep a record of what lasts and what needs another encounter.",
    "Return with intention",
    Sprout,
  ],
  [
    "Test",
    "Make the gaps visible.",
    "Use your saved questions and reference answers to assess understanding and choose what needs attention.",
    "Find your next study step",
    Check,
  ],
];
const environments = [
  [
    "Internal",
    "Rehearse the moment.",
    "Walk through a decision. Explain it to yourself. Imagine the conversation before it happens.",
    Brain,
  ],
  [
    "Simulated",
    "Try it with room to learn.",
    "Work through a case, mock interview or scenario. Notice how your knowledge behaves under pressure.",
    FlaskConical,
  ],
  [
    "Social",
    "Bring someone into the learning.",
    "Teach a friend. Practise with a mentor. Give and receive feedback that changes your next attempt.",
    Users,
  ],
  [
    "Real world",
    "Put the idea to work.",
    "Use it in a meeting, project, relationship or decision. Capture what happened and what it produced.",
    Globe,
  ],
];
const management = [
  [
    "Plant",
    "Give a question a beginning.",
    "A new question becomes a seed with a place, purpose and source.",
    Sprout,
  ],
  [
    "Pluck",
    "Make room for focus.",
    "Study a concept independently while keeping its original context.",
    Leaf,
  ],
  [
    "Graft",
    "Notice the unexpected connection.",
    "Link meaningful ideas across Trees, Groves and Forests.",
    Network,
  ],
  [
    "Prune",
    "Keep what you know healthy.",
    "Refine material that is incorrect, outdated, redundant or misplaced.",
    PenTool,
  ],
];
function Frame({ children, id, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("editorial-arrived");
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <section ref={ref} id={id} className={`editorial-section ${className}`}>
      {children}
    </section>
  );
}
function Intro({ tag, title, children }) {
  return (
    <div className="editorial-intro">
      <span className="eyebrow">{tag}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
function Start({ navigate, children }) {
  return (
    <button className="editorial-link" onClick={() => navigate("signup")}>
      {children}
      <ArrowUpRight size={18} />
    </button>
  );
}
function Art({ name, alt, children }) {
  return (
    <figure className={`editorial-art art-${name}`}>
      <img
        src={`/illustrations/${name}.jpg`}
        alt={alt}
        width="1536"
        height="1024"
        loading="lazy"
        decoding="async"
      />
      {children}
    </figure>
  );
}

export function IdeaScene({ navigate }) {
  return (
    <Frame id="ecosystem" className="idea-scene">
      <div>
        <Intro
          tag="A LIVING STRUCTURE"
          title={
            <>
              Knowledge should
              <br />
              <em>grow roots.</em>
            </>
          }
        >
          Give everything you learn a place to belong—and a connection to
          something larger.
        </Intro>
        <div className="hierarchy-path">
          <span>
            Forest <small>Your life area</small>
          </span>
          <span>
            Grove <small>Your sub-life area</small>
          </span>
          <span>
            Tree <small>A body of knowledge</small>
          </span>
        </div>
        <p className="editorial-support">
          Roots, Stems, Branches, Leaves and Fruits make room for both the big
          picture and the smallest idea.
        </p>
        <Start navigate={navigate}>Cultivate your knowledge</Start>
      </div>
      <Art
        name="study"
        alt="An open book unfolds into a blue-leafed tree bearing orange and golden fruit"
      >
        <figcaption>
          <Sprout size={17} /> A question today. A body of knowledge tomorrow.
        </figcaption>
      </Art>
    </Frame>
  );
}

export function StudyScene({ navigate }) {
  const [selected, setSelected] = useState(1);
  const [name, title, body, note, Icon] = intentions[selected];
  return (
    <Frame id="study-actions" className="study-scene">
      <Intro
        tag="STUDY WITH INTENTION"
        title={
          <>
            Don't just save it.
            <br />
            <em>Make it yours.</em>
          </>
        }
      >
        Every idea asks something different of you. Choose how you want to work
        with it.
      </Intro>
      <div className="study-explorer">
        <div className="intention-menu" aria-label="Explore study intentions">
          {intentions.map(([label, , , , Glyph], i) => (
            <button
              key={label}
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
            >
              <Glyph size={18} />
              {label}
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
        <div
          className={`intention-stage intention-${name.toLowerCase().replaceAll(" ", "-")}`}
        >
          <div className="idea-object" aria-hidden="true">
            <i className="idea-orbit" />
            <i className="idea-orbit second" />
            <div className="idea-kernel">
              <Icon size={54} strokeWidth={1.2} />
            </div>
            <span className="idea-petal petal-a" />
            <span className="idea-petal petal-b" />
            <span className="idea-petal petal-c" />
          </div>
          <div className="intention-description" aria-live="polite">
            <span>{note}</span>
            <h3>{title}</h3>
            <p>{body}</p>
            <Start navigate={navigate}>Find your study intention</Start>
          </div>
        </div>
      </div>
    </Frame>
  );
}
export function WorkspaceScene({ navigate }) {
  return (
    <Frame id="grow" className="workspace-scene">
      <Intro
        tag="A SPACE TO GO DEEP"
        title={
          <>
            Your resource.
            <br />
            Your intention.
            <br />
            <em>Your focus.</em>
          </>
        }
      >
        Read, highlight and capture a thought without losing the thread. A clear
        objective and a focused timer keep your work intentional.
      </Intro>
      <div
        className="reader-illustration"
        aria-label="Illustrative study workspace"
      >
        <div className="reader-illustration-bar">
          <span>
            <BookOpen size={17} /> The art of listening
          </span>
          <small>ILLUSTRATIVE SESSION</small>
        </div>
        <div className="reader-illustration-body">
          <div className="reading-page">
            <span>PEEL · UNDERSTAND THE FOUNDATIONS</span>
            <h3>
              Listen for what
              <br />
              is underneath.
            </h3>
            <p>
              Before preparing your answer, consider what the other person is
              trying to communicate.
            </p>
            <mark>Understanding begins with attention.</mark>
            <div className="printed-lines">
              <i />
              <i />
              <i />
            </div>
            <div className="source-pill">
              <BookOpen size={14} /> Source connected to your knowledge
            </div>
          </div>
          <aside>
            <span className="reader-focus">
              <i /> Focus time
            </span>
            <strong className="reader-time">25:00</strong>
            <span className="reader-note-label">A thought worth keeping</span>
            <p>
              What changes when I listen to understand, rather than to respond?
            </p>
            <div className="reader-micro-link">
              <Sprout size={14} /> Communication → Listening
            </div>
          </aside>
        </div>
        <div className="reader-illustration-bottom">
          <span>
            <PenTool size={15} /> Capture a thought
          </span>
          <span>
            <Mic size={15} /> Speak your notes
          </span>
          <span>
            <Network size={15} /> Connect an idea
          </span>
        </div>
      </div>
      <Start navigate={navigate}>Enter your Study Workspace</Start>
    </Frame>
  );
}
export function CultivateScene() {
  const [active, setActive] = useState(0);
  const [name, title, body, Icon] = management[active];
  return (
    <Frame id="cultivate" className="cultivate-scene">
      <Intro
        tag="CARE FOR WHAT YOU KNOW"
        title={
          <>
            A little tending.
            <br />
            <em>A lifetime of growth.</em>
          </>
        }
      />
      <div className="cultivate-workbench">
        <div className="cultivate-tools">
          {management.map(([label, , , Glyph], i) => (
            <button
              key={label}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
            >
              <Glyph size={27} />
              {label}
            </button>
          ))}
        </div>
        <div className="cultivate-result" aria-live="polite">
          <div className="graft-illustration" aria-hidden="true">
            <i />
            <span>
              <Icon size={30} />
            </span>
            <i />
          </div>
          <div>
            <span className="eyebrow">{name}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        </div>
      </div>
    </Frame>
  );
}
export function StretchScene({ navigate }) {
  const [active, setActive] = useState(1);
  const [name, title, body, Icon] = environments[active];
  return (
    <Frame id="practice" className="stretch-scene">
      <Intro
        tag="FROM KNOWING TO DOING"
        title={
          <>
            Take your knowledge
            <br />
            <em>out into the world.</em>
          </>
        }
      >
        Stretch is where an idea becomes something you can do. Start small,
        reflect on the attempt, and increase the challenge.
      </Intro>
      <Art
        name="stretch"
        alt="People carry a golden sphere across sculptural blue bridges toward an orange doorway"
      />
      <div className="environment-dock">
        <div
          className="environment-tabs"
          aria-label="Explore practice environments"
        >
          {environments.map(([label, , , Glyph], i) => (
            <button
              key={label}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
            >
              <Glyph size={18} />
              {label}
            </button>
          ))}
        </div>
        <div className="environment-body" aria-live="polite">
          <Icon size={36} />
          <div>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
          <Start navigate={navigate}>Create a Stretch</Start>
        </div>
      </div>
    </Frame>
  );
}
export function LoopScene() {
  return (
    <Frame id="learning-loop" className="loop-scene">
      <span className="eyebrow">LEARNING AND DOING, TOGETHER</span>
      <h2>
        You don't have to finish learning
        <br />
        <em>to begin practising.</em>
      </h2>
      <div className="learning-loop-visual">
        <div>
          <BookOpen size={27} />
          <strong>Study</strong>
          <span>Grow what you know</span>
        </div>
        <div className="feedback-bridge">
          <span className="loop-particle" />
          <ArrowRight size={26} />
          <small>Questions · Feedback · Discovery</small>
          <ArrowRight size={26} />
        </div>
        <div>
          <FlaskConical size={27} />
          <strong>Stretch</strong>
          <span>Grow what you can do</span>
        </div>
      </div>
      <p>
        Practice reveals a gap. Study brings clarity. Your next attempt begins
        from somewhere stronger.
      </p>
    </Frame>
  );
}
export function HarvestScene({ navigate }) {
  return (
    <Frame id="harvest" className="harvest-scene">
      <Art
        name="harvest"
        alt="Blue glass vessel holding fruit and foliage beside a sculptural paper artifact"
      />
      <div>
        <Intro
          tag="KEEP WHAT GROWTH PRODUCES"
          title={
            <>
              The work should
              <br />
              <em>bear fruit.</em>
            </>
          }
        >
          A new insight. A better decision. Something you built. Harvest gives
          these results a home.
        </Intro>
        <div className="harvest-token-grid">
          {[
            [Lightbulb, "Insights"],
            [PenTool, "Artifacts"],
            [Target, "Outcomes"],
            [FileText, "Evidence"],
            [Users, "Impact"],
            [Sparkles, "Opportunities"],
          ].map(([Icon, label]) => (
            <span key={label}>
              <Icon size={18} />
              {label}
            </span>
          ))}
        </div>
        <p className="editorial-support">
          Completion is one thing. What your practice produced is another.
          Capture both.
        </p>
        <Start navigate={navigate}>Record what became possible</Start>
      </div>
    </Frame>
  );
}
export function BarnsScene({ navigate }) {
  const [active, setActive] = useState("communication");
  const capacity = CAPACITIES.find((c) => c.id === active);
  return (
    <Frame id="barns-story" className="barns-scene">
      <div className="barns-story-copy">
        <Intro
          tag="BARNS · YOUR CAPACITY SYSTEM"
          title={
            <>
              Know more.
              <br />
              <em>Carry more.</em>
            </>
          }
        >
          Knowledge grows across your life. Capacity is what helps you handle
          its complexity, responsibility and possibility.
        </Intro>
        <div className="capacity-cloud" aria-label="Explore the 16 capacities">
          {CAPACITIES.map((c) => (
            <button
              key={c.id}
              aria-pressed={active === c.id}
              onClick={() => setActive(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <Start navigate={navigate}>Explore your BARNS</Start>
      </div>
      <div className="capacity-display">
        <div className="capacity-vessel" aria-hidden="true">
          <div className="vessel-drop" />
          <div className="vessel-rim" />
          <div className="vessel-fill" />
          <span className="vessel-light" />
        </div>
        <div className="capacity-display-copy" aria-live="polite">
          <span>ROOM TO GROW</span>
          <h3>{capacity.name}</h3>
          <p>{capacity.question}</p>
        </div>
        <div className="capacity-evidence-pills">
          <span>Practice</span>
          <span>Reflection</span>
          <span>Evidence</span>
        </div>
        <small>Illustration of capacity · no ability score implied</small>
      </div>
    </Frame>
  );
}
export function GoalsScene({ navigate }) {
  return (
    <Frame id="goals-story" className="goals-scene">
      <Intro
        tag="DIRECTION FOR EVERY DAY"
        title={
          <>
            A bigger ambition.
            <br />
            <em>A purposeful next step.</em>
          </>
        }
      >
        Connect daily effort to the person you want to become. Set goals across
        life areas, from today through this year.
      </Intro>
      <div className="goal-sculpture" aria-label="Example goal hierarchy">
        <div className="goal-year">
          <Target size={26} />
          <span>THIS YEAR</span>
          <strong>Become a thoughtful leader.</strong>
        </div>
        <div className="goal-threads" aria-hidden="true" />
        <div className="goal-descendants">
          <article>
            <span>THIS QUARTER</span>
            <strong>Develop people-management knowledge.</strong>
            <Network size={23} />
          </article>
          <article>
            <span>THIS WEEK</span>
            <strong>Practise a feedback conversation.</strong>
            <MessageCircle size={23} />
          </article>
          <article>
            <span>TODAY</span>
            <strong>Understand what good feedback needs.</strong>
            <BookOpen size={23} />
          </article>
        </div>
        <small>Illustrative pathway · Shape your own goals</small>
      </div>
      <Start navigate={navigate}>Give your growth a direction</Start>
    </Frame>
  );
}
export function GrowthScene({ navigate }) {
  return (
    <Frame id="growth-story" className="growth-scene">
      <div
        className="growth-story-art"
        aria-label="Illustration of a personal development story"
      >
        <div className="growth-line" />
        {[
          [Sprout, "A question planted", "Curiosity has a place to grow"],
          [BookOpen, "An idea understood", "Knowledge becomes connected"],
          [
            FlaskConical,
            "A skill practised",
            "An attempt teaches you something",
          ],
          [Wheat, "A result recorded", "Evidence of what became possible"],
        ].map(([Icon, title, detail]) => (
          <article key={title}>
            <Icon size={21} />
            <div>
              <strong>{title}</strong>
              <small>{detail}</small>
            </div>
            <Check size={15} />
          </article>
        ))}
        <span className="growth-story-caption">YOUR STORY KEEPS GROWING</span>
      </div>
      <div>
        <Intro
          tag="GROWTH · LOOK BACK TO MOVE FORWARD"
          title={
            <>
              See the change.
              <br />
              <em>Choose what's next.</em>
            </>
          }
        >
          Bring your Study, practice, knowledge, goals and recorded results into
          one development story. Reflect on where your attention is going and
          what deserves more of it.
        </Intro>
        <Start navigate={navigate}>See your growth</Start>
      </div>
    </Frame>
  );
}
export function AudienceScene({ navigate }) {
  return (
    <Frame id="learners" className="audience-scene">
      <Intro
        tag="A PLACE FOR YOUR NEXT CHAPTER"
        title={
          <>
            Whatever you are becoming.
            <br />
            <em>Keep growing.</em>
          </>
        }
      />
      <div className="audience-tiles">
        {[
          [
            "Students",
            "students",
            BookOpen,
            "Carry knowledge beyond the classroom.",
            "Learn for the exam. Keep it for life.",
          ],
          [
            "Professionals",
            "professionals",
            Layers,
            "Turn experience into expertise.",
            "Connect a course to your next real challenge.",
          ],
          [
            "Lifelong learners",
            "lifelong-learners",
            Sprout,
            "Follow your curiosity somewhere.",
            "Every question deserves a place to grow.",
          ],
          [
            "Builders & creators",
            "creators",
            PenTool,
            "Make something of what you know.",
            "Bring your learning to the things you create.",
          ],
        ].map(([label, id, Icon, title, body]) => (
          <article key={id} id={id}>
            <div className="audience-symbol">
              <Icon size={43} strokeWidth={1.2} />
              <i />
              <i />
            </div>
            <span>{label}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <Start navigate={navigate}>Start growing with ecostudy</Start>
    </Frame>
  );
}

export const editorialSections = {
  "THE IDEA": IdeaScene,
  STUDY: StudyScene,
  "STUDY WORKSPACE": WorkspaceScene,
  "KNOWLEDGE ECOSYSTEM": CultivateScene,
  "FROM LEARNING TO DOING": StretchScene,
  "LEARNING + DOING": LoopScene,
  HARVEST: HarvestScene,
  BARNS: BarnsScene,
  GOALS: GoalsScene,
  GROWTH: GrowthScene,
  "WHO ECOSTUDY IS FOR": AudienceScene,
};
