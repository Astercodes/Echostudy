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
    body: "Let concepts take root and branch out. Turn your highlights, questions, and ideas into a living knowledge tree.",
    tone: "leaf",
  },
  {
    icon: NotebookPen,
    n: "04",
    title: "Turn learning into growth.",
    body: "Focus with intention, reflect on what changed, and see the effort that is building your capacity.",
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
          <a href="#grow" onClick={() => setMenu(false)}>
            Built for your growth
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
              A little more intentional. A little more connected.
              <br />
              EchoStudy brings your time, goals, and deep daily study
              <br className="desktop-break" /> together—so every day builds who
              you’re becoming.
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
                stroke="#658D10"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M150 230C95 240 120 165 74 152M450 205C490 170 470 128 530 110M340 140C390 140 376 80 420 65"
                fill="none"
                stroke="#00B7C7"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M297 389Q358 329 423 356Q380 420 297 411"
                fill="#D7E525"
              />
              <path
                d="M278 292Q220 227 192 291Q210 324 278 321"
                fill="#BFF5F5"
              />
              <path
                d="M300 222Q370 152 370 219Q363 251 297 255"
                fill="#FADF96"
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
              <span>Yearly capacity</span>
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
                "How does my knowledge tree grow?",
                "Add concepts under a domain or an existing idea, then connect them across branches. Link your notes and highlights to the ideas they deepen. Review prompts use the prerequisites, confidence, and connections you record.",
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
