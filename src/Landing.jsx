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
import { LivingTree } from "./LandingVisuals";
import { EcosystemStory, GrowthStory } from "./LandingStory";
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
          <a href="#grow" onClick={() => setMenu(false)}>
            Study
          </a>
          <a href="#practice" onClick={() => setMenu(false)}>
            Stretch
          </a>
          <a href="#barns-story" onClick={() => setMenu(false)}>
            BARNS
          </a>
          <a href="#learners" onClick={() => setMenu(false)}>
            Who it's for
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
            Start growing <ArrowRight size={15} />
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
              Your knowledge is an ecosystem.
              <br />
              <em>Grow it.</em>
            </h1>
            <p>
              Turn what you read, watch, hear, and experience into knowledge you
              understand, remember, connect, practice, and use.
            </p>
            <div className="hero-actions">
              <button
                className="btn primary"
                onClick={() => navigate("signup")}
              >
                Start growing <ArrowRight size={18} />
              </button>
            </div>
            <div className="hero-note">
              <Sprout size={18} />
              <span>
                Study deeply. Practice what you learn. Grow your capacity.
              </span>
            </div>
          </div>
          <div className="hero-ecosystem">
            <LivingTree />
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
        <section className="story-problem" id="how-it-works">
          <span className="eyebrow">FROM INFORMATION TO UNDERSTANDING</span>
          <h2>
            You read it. You saved it.
            <br />
            What stays with you?
          </h2>
          <p>
            A book, a video, a highlighted paragraph. Weeks later, the idea can
            be difficult to recall, disconnected from what you already know, and
            harder to use.
          </p>
          <p>
            <strong>
              Give what you learn somewhere to grow roots, form connections, and
              become useful.
            </strong>
          </p>
        </section>
        <EcosystemStory />
        <section className="story-resources" id="resources">
          <div>
            <span className="eyebrow">EVERYTHING YOU ARE LEARNING FROM</span>
            <h2>Bring your resources with you.</h2>
            <p>
              Save learning materials and links in your Resource Library.
              Organize them by the life areas and knowledge they support, then
              find them again through search and filters.
            </p>
            <p>
              Read PDFs and text, save connected highlights, and keep the source
              close to your notes.
            </p>
            <button className="text-btn" onClick={() => navigate("signup")}>
              Build your Resource Library <ArrowRight size={17} />
            </button>
          </div>
          <div
            className="resource-formats"
            aria-label="Learning resource formats"
          >
            {[
              "Books",
              "PDFs",
              "Videos",
              "Articles",
              "Audio",
              "Courses",
              "Reports",
              "Notes",
              "Web links",
            ].map((format) => (
              <span key={format}>{format}</span>
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
        <GrowthStory navigate={navigate} />
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
              Your knowledge is an ecosystem.
              <br />
              <em>Grow it.</em>
            </h2>
            <p>
              Plant the question. Grow the knowledge. Stretch the capability.
              Harvest the result.
            </p>
          </div>
          <button className="btn" onClick={() => navigate("signup")}>
            Start growing with EcoStudy <ArrowRight size={18} />
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
