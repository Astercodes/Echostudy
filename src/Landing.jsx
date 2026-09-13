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
import LandingCopy from "./LandingCopy";
import { LivingTree } from "./LandingVisuals";
import { EcosystemSculpture } from "./EcosystemSculpture";
import "./landing-polish.css";
import "./landing-mobile.css";
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
              <EcosystemSculpture />
          </div>
        </section>
        <LandingCopy navigate={navigate} />
        <section className="landing-manifesto">
          <span className="eyebrow">THE ECOSTUDY WAY</span>
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
                "Is ecostudy only for academic study?",
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
            Start growing with ecostudy <ArrowRight size={18} />
          </button>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand onClick={() => navigate("landing")} />
        <span>Your knowledge is an ecosystem. Grow it.</span>
        <div className="footer-links"><nav aria-label="Platform"><strong>Platform</strong>{[["Study","grow"],["Knowledge Ecosystem","ecosystem"],["Resource Library","resources"],["Stretch","practice"],["BARNS","barns-story"],["Goals","goals-story"],["Growth","growth-story"]].map(([name,id])=><a key={id} href={`#${id}`}>{name}</a>)}</nav><nav aria-label="Learn"><strong>Learn</strong><a href="#how-it-works">How ecostudy works</a><a href="#study-actions">Study method</a><a href="#whole-system">The connected ecosystem</a><a href="#barns-story">Capacity building</a></nav></div>
        <div>
          <button onClick={() => navigate("login")}>Log in</button>
          <button onClick={() => navigate("signup")}>Create an account</button>
          <a href="#questions">Data & questions</a>
        </div>
        <small>© {new Date().getFullYear()} ecostudy</small>
      </footer>
    </div>
  );
}
