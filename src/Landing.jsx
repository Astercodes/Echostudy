import React, { useState } from "react";
import {
  Sprout,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Network,
  Target,
  BookOpen,
  NotebookPen,
  Check,
  Plus,
  Leaf,
  Sun,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { Brand } from "./AuthShell";
import LandingDetails from "./LandingDetails";
const features = [
  {
    icon: Clock,
    n: "01",
    title: "Give your time a purpose.",
    body: "Build a realistic 24-hour plan around your life. Protect rest, honor commitments, and find room for deep study.",
    tone: "cyan",
  },
  {
    icon: Target,
    n: "02",
    title: "Study toward something.",
    body: "Connect today’s objective to a weekly priority, a yearly goal, and the person you want to become.",
    tone: "berry",
  },
  {
    icon: Network,
    n: "03",
    title: "Grow a connected mind.",
    body: "Build your Knowledge Ecosystem: forests for life areas, groves for sub-areas, and topic trees with roots, branches, leaves, fruits and seeds.",
    tone: "leaf",
  },
  {
    icon: NotebookPen,
    n: "04",
    title: "Give each session an objective.",
    body: "Know what you want to understand before the timer starts. Track focused time, pauses and reflections alongside your larger goals.",
    tone: "gold",
  },
  {
    icon: BookOpen,
    n: "05",
    title: "Keep resources close.",
    body: "Read PDFs and text, highlight passages, and connect notes to the knowledge they support. Keep resource links and learning materials in your workspace.",
    tone: "cyan",
  },
  {
    icon: NotebookPen,
    n: "06",
    title: "Work through your thinking.",
    body: "Peel a subject into layers, Chew on its reasoning, recall it from memory, and Test for gaps. Expanded components give your writing direction.",
    tone: "berry",
  },
  {
    icon: Target,
    n: "07",
    title: "Stretch through doing.",
    body: "Plan practical activities across goals and life areas. Name the abilities you will use, define success, and record what happened.",
    tone: "leaf",
  },
  {
    icon: Sprout,
    n: "08",
    title: "See growth in Barns.",
    body: "Review 16 dimensions of capacity. Pair your self-assessment with visual indicators of linked study, completed practice and goal progress.",
    tone: "gold",
  },
  {
    icon: Network,
    n: "09",
    title: "Turn knowledge into an ecosystem.",
    body: "Forests, groves, trees, roots, stems, branches, leaves, fruits and seeds give every idea a home while grafts reveal the connections between them.",
    tone: "cyan",
  },
  {
    icon: Target,
    n: "10",
    title: "Build goals in both directions.",
    body: "Start with the person you want to become and work backward to knowledge and practice—or promote an important discovery into a larger goal.",
    tone: "berry",
  },
  {
    icon: Leaf,
    n: "11",
    title: "See what your learning produces.",
    body: "Growth tracks durable knowledge, practice environments, capacity evidence, completed goals and Harvests: insights, artifacts, outcomes and proof.",
    tone: "leaf",
  },
  {
    icon: Sun,
    n: "12",
    title: "Let intelligence guide the next step.",
    body: "Find weak prerequisites, declining retrieval, study–practice imbalances and the next meaningful action without losing your own judgment.",
    tone: "gold",
  },
];
export default function Landing({ navigate }) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand onClick={() => navigate("landing")} />
        <nav
          className={menu ? "landing-links open" : "landing-links"}
          aria-label="Main navigation"
        >
          <a href="#how-it-works" onClick={() => setMenu(false)}>
            How it works
          </a>
          <a href="#ecosystem" onClick={() => setMenu(false)}>
            Knowledge Ecosystem
          </a>
          <a href="#practice" onClick={() => setMenu(false)}>
            Stretch & Barns
          </a>
          <a href="#questions" onClick={() => setMenu(false)}>
            Questions
          </a>
        </nav>
        <div className="landing-nav-actions">
          <button className="text-btn" onClick={() => navigate("login")}>
            Log in <ArrowUpRight size={15} />
          </button>
          <button className="btn primary" onClick={() => navigate("signup")}>
            Get started <ArrowRight size={15} />
          </button>
          <button
            className="icon-btn landing-menu"
            aria-label="Toggle menu"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main className="landing-main">
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="hero-label">
              <span />
              FOR A LIFE THAT KEEPS GROWING
            </span>
            <h1>
              Make time.
              <br />
              Grow your mind.
              <br />
              <em>Become more.</em>
            </h1>
            <p>
              Plan your day. Study deeply. Connect what you learn and put it
              into practice. EchoStudy brings time, goals, knowledge, practical
              growth and self-reflection into one workspace.
            </p>
            <div className="hero-actions">
              <button
                className="btn primary"
                onClick={() => navigate("signup")}
              >
                Start growing with intention <ArrowRight size={18} />
              </button>
              <a href="#how-it-works" className="text-btn">
                Explore EchoStudy <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="hero-note">
              <Sprout size={18} />
              <span>One connected workspace. Every area of your life.</span>
            </div>
          </div>
          <div
            className="hero-garden"
            aria-label="Illustration of time, goals, and knowledge growing together"
          >
            <div className="garden-label">
              <span />
              YOUR GROWTH, CONNECTED
            </div>
            <svg
              className="garden-lines"
              viewBox="0 0 600 550"
              aria-hidden="true"
            >
              <path
                d="M300 430C300 380 285 330 287 270M287 300C230 300 225 230 150 230M287 310C370 310 360 205 450 205M287 365C220 365 210 390 130 370M287 260C287 180 330 170 340 100"
                fill="none"
                stroke="#07529a"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M150 230C95 240 120 165 74 152M450 205C490 170 470 128 530 110M340 140C390 140 376 80 420 65"
                fill="none"
                stroke="#009cde"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M297 389Q358 329 423 356Q380 420 297 411"
                fill="#ff7900"
              />
              <path
                d="M278 292Q220 227 192 291Q210 324 278 321"
                fill="#dcefff"
              />
              <path
                d="M300 222Q370 152 370 219Q363 251 297 255"
                fill="#ffd7b0"
              />
            </svg>
            <div className="garden-card garden-time">
              <div>
                <Clock size={17} />
                <span>MAKE ROOM</span>
              </div>
              <strong>
                24 hours.
                <br />A little more intention.
              </strong>
              <div className="mini-timebar">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <small>Rest. Live. Learn. Repeat.</small>
            </div>
            <div className="garden-card garden-goal">
              <Target size={19} />
              <span>THIS YEAR → THIS DAY</span>
              <strong>Become a deeper thinker.</strong>
              <small>
                <Check size={13} />
                One purposeful session at a time
              </small>
            </div>
            <div className="garden-concept gc-one">
              <span />A new perspective
            </div>
            <div className="garden-concept gc-two">
              <Plus size={13} />
              An unexpected connection
            </div>
            <div className="garden-concept gc-three">
              <Leaf size={15} />A stronger capacity
            </div>
            <div className="garden-root">
              <Sprout size={25} />
              <strong>Your growing mind</strong>
            </div>
            <span className="garden-star star-a">✦</span>
            <span className="garden-star star-b">✧</span>
            <div className="garden-caption">
              Small seeds. Extraordinary possibilities.
            </div>
          </div>
        </section>
        <section className="life-strip" aria-label="Every life area">
          <span>GROW ACROSS YOUR WHOLE LIFE</span>
          <div>
            {[
              "Mind & expertise",
              "Spirit & faith",
              "Health & energy",
              "Career & craft",
              "Relationships",
              "Life & finances",
            ].map((s, i) => (
              <span key={s}>
                <i className={"life-dot dot-" + i} />
                {s}
              </span>
            ))}
          </div>
        </section>
        <section className="landing-section" id="how-it-works">
          <div className="landing-section-head">
            <div>
              <span className="eyebrow">
                FROM BUSY DAYS TO MEANINGFUL GROWTH
              </span>
              <h2>
                Everything you need.
                <br />
                <em>Connected by intention.</em>
              </h2>
            </div>
            <p>
              You don’t need another place to collect information.
              <br />
              You need a place to turn it into understanding,
              <br />
              competence, and a life that keeps expanding.
            </p>
          </div>
          <div className="landing-features">
            {features.map(({ icon: Icon, n, title, body, tone }) => (
              <article className={"landing-feature tone-" + tone} key={n}>
                <div className="feature-top">
                  <div>
                    <Icon size={25} />
                  </div>
                  <span>{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-system" id="ecosystem">
          <div className="landing-section-head">
            <div>
              <span className="eyebrow">ONE LIVING SYSTEM</span>
              <h2>From intention to evidence.</h2>
            </div>
            <p>
              EcoStudy keeps the parts of growth connected without making them
              feel like one crowded screen.
            </p>
          </div>
          <div className="system-loop">
            {[
              ["TIME", "Make room in your day"],
              ["GOALS", "Choose what matters"],
              ["STUDY", "Grow what you know"],
              ["ECOSYSTEM", "Connect the ideas"],
              ["STRETCH", "Exercise what you can do"],
              ["BARNS", "Enlarge your capacity"],
              ["HARVEST", "Record what it produced"],
              ["GROWTH", "See what is changing"],
            ].map(([name, body], i) => (
              <article key={name} className={"system-step step-" + (i % 4)}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{name}</strong>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <div className="system-note">
            <Sprout size={20} />
            <span>
              Study and Stretch run in parallel. A practice can reveal a gap, a
              gap can reshape Study, and a Harvest can become evidence for a
              larger goal.
            </span>
          </div>
        </section>
        <section className="landing-study" id="grow">
          <div className="study-example">
            <div className="example-top">
              <span>
                <span />
                YOUR INTENTIONAL STUDY SPACE
              </span>
              <small>ILLUSTRATIVE SESSION</small>
            </div>
            <div className="example-goals">
              <span>Yearly goal</span>
              <ArrowRight size={13} />
              <span>Weekly priority</span>
              <ArrowRight size={13} />
              <strong>Today’s objective</strong>
            </div>
            <div className="example-session">
              <div>
                <span className="eyebrow">TODAY, I WANT TO UNDERSTAND</span>
                <h3>
                  How systems connect
                  <br />
                  to create something greater.
                </h3>
                <p>One clear objective. A little space to think.</p>
                <div className="example-tags">
                  <span>Systems thinking</span>
                  <span>Deep study</span>
                </div>
              </div>
              <div className="example-timer">
                <span>45:00</span>
                <small>A MOMENT TO GO DEEPER</small>
              </div>
            </div>
            <div className="example-bottom">
              <BookOpen size={17} /> Read with purpose <span /> Connect an idea{" "}
              <span /> Reflect & grow
            </div>
          </div>
          <div className="study-copy">
            <span className="eyebrow">LESS DRIFTING. MORE BECOMING.</span>
            <h2>
              Not just another
              <br />
              hour of study.
              <br />
              <em>A step toward you.</em>
            </h2>
            <p>
              Before the timer begins, know what you want to learn and why it
              matters. When it ends, capture what changed—and where your
              curiosity wants to go next.
            </p>
            <button className="text-btn" onClick={() => navigate("signup")}>
              Give your next hour a purpose <ArrowRight size={17} />
            </button>
          </div>
        </section>
        <LandingDetails navigate={navigate} />
        <section className="landing-manifesto">
          <span className="eyebrow">THE ECHOSTUDY WAY</span>
          <blockquote>
            “Every hour should serve a purpose.
            <br />
            Every concept should connect.
            <br />
            <em>Every day should move you forward.</em>”
          </blockquote>
          <div>
            <span>TIME</span>
            <ArrowRight />
            <span>GOALS</span>
            <ArrowRight />
            <span>STUDY</span>
            <ArrowRight />
            <span>KNOWLEDGE</span>
            <ArrowRight />
            <span>REFLECTION</span>
            <ArrowRight />
            <span>GROWTH</span>
          </div>
        </section>
        <section className="landing-faq" id="questions">
          <div>
            <span className="eyebrow">A LITTLE MORE CLARITY</span>
            <h2>Room for questions.</h2>
          </div>
          <div>
            {[
              [
                "Is EchoStudy only for academic study?",
                "No. Goals start with 24 life areas and 428 sub-areas, from faith and intellectual growth to civic life, digital wellbeing, safety, creativity, and legacy. Add your own areas and decide what growth means in each one.",
              ],
              [
                "How does my Knowledge Ecosystem grow?",
                "Your life areas become forests and your sub-areas become groves. Add topic trees, foundations, core knowledge, branches, leaves and fruits. Plant questions as seeds, graft meaningful connections, or open any part in a focus tab. Your focused work edits the same knowledge, so closing a tab does not remove it.",
              ],
              [
                "How do goals connect to my day?",
                "Create multiple yearly, quarterly, monthly, weekly and daily goals across your life areas. Link time blocks and study objectives to those goals so each session has a clear purpose. Add custom life areas and sub-areas as your priorities evolve.",
              ],
              [
                "What is the difference between Study and Stretch?",
                "Study develops understanding through resources, notes and knowledge actions. Stretch tracks practical doing: an activity, the ability it exercises, success criteria, linked goals and a reflection on the result.",
              ],
              [
                "Do Barns percentages measure my actual ability?",
                "The percentages reflect recorded activity and goal progress, not an objective certification of ability. Barns keeps these indicators alongside your own capacity assessment so you can reflect on both effort and what you can now handle.",
              ],
              [
                "Can I speak instead of typing?",
                "Knowledge-action writing fields include audio recording. Where browser speech recognition is supported, you can review a transcript and insert it into your notes. Microphone permission is required, and transcription availability depends on your browser and its speech service.",
              ],
              [
                "Does Test automatically teach or grade me?",
                "Test uses questions and reference answers you provide, including previous saved quizzes. You assess your answers, record confidence and accuracy, and review gap suggestions. Adaptive selection chooses from your saved question bank. It is not an automatic expert assessment or a readiness certificate.",
              ],
              [
                "Where is my study data saved?",
                "This version saves your workspace and uploaded resources in your browser, separated by account. Signing in does not sync study data between devices. Export a backup regularly and keep original resource files.",
              ],
              [
                "Can I read my resources here?",
                "Yes. Upload PDFs or text documents to read and capture connected notes. Text-based PDFs support persistent highlights. You can also attach audio, video, and links to external resources.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={17} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="landing-cta">
          <div>
            <Sprout size={29} />
            <h2>
              Your next chapter
              <br />
              starts with <em>one intentional day.</em>
            </h2>
            <p>Make room for the mind—and life—you want to grow.</p>
          </div>
          <button className="btn" onClick={() => navigate("signup")}>
            Plant the first seed <ArrowRight size={18} />
          </button>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand onClick={() => navigate("landing")} />
        <span>Grow with intention. Live with depth.</span>
        <div>
          <button onClick={() => navigate("login")}>Log in</button>
          <button onClick={() => navigate("signup")}>Create an account</button>
          <a href="#questions">Data & questions</a>
        </div>
        <small>© {new Date().getFullYear()} EchoStudy</small>
      </footer>
    </div>
  );
}
