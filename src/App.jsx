import React, { useState, useEffect, useRef } from "react";
import {
  Sprout,
  LayoutDashboard,
  CalendarDays,
  Target,
  BookOpen,
  Network,
  Library,
  NotebookPen,
  ChartNoAxesCombined,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Play,
  Pause,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Flame,
  Leaf,
  Sun,
  MoreHorizontal,
  X,
  Search,
  Settings,
  Upload,
  Download,
  Link,
  Trash2,
  Maximize2,
  Minus,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  FileText,
  Headphones,
  Video,
  ExternalLink,
  Menu,
  Heart,
  Save,
  Flag,
} from "lucide-react";
import {
  COLORS,
  DOMAINS,
  LEVELS,
  uid,
  today,
  minutes,
  clock,
  duration,
  validateBlock,
  fillStudyWindows,
  ancestors,
  goalProgress,
  focusedMs,
  insights,
  initialState,
  validateBackup,
} from "./model";
import { putFile, getFile } from "./files";
import Knowledge from "./Knowledge";
import Resources from "./Resources";
const NAV = [
  ["Today", LayoutDashboard],
  ["24-hour planner", CalendarDays],
  ["Goals", Target],
  ["Study workspace", BookOpen],
  ["Knowledge tree", Network],
  ["Resource library", Library],
  ["Reflection", NotebookPen],
  ["Growth", ChartNoAxesCombined],
];
const KINDS = {
  deep: ["Deep study", "#199181"],
  light: ["Light study", "#6BAF9B"],
  reflection: ["Reflection", "#EB4E5E"],
  recovery: ["Recovery", "#babfae"],
  life: ["Life", "#FB973B"],
  fixed: ["Commitment", "#8b99a0"],
};
const KEY = "echostudy-v1";
function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (validateBackup(parsed)) return parsed;
      throw Error("Invalid saved data");
    }
  } catch (e) {
    window.echoLoadError = true;
  }
  return initialState();
}
export function Button({ children, primary = false, onClick, ...props }) {
  return (
    <button
      className={primary ? "btn primary" : "btn"}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
export function Badge({ children, color }) {
  return (
    <span
      className="badge"
      style={color ? { color, background: color + "15" } : {}}
    >
      {children}
    </span>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const el = ref.current;
    el?.focus();
    const handle = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const f = el.querySelectorAll(
          'button,input,select,textarea,a[href],[tabindex="0"]',
        );
        const first = f[0],
          last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        tabIndex={-1}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="section-head">
          <h2>{title}</h2>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function GoalSelect({ goals, value, onChange, required = false }) {
  return (
    <select
      value={value || ""}
      required={required}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Choose a goal</option>
      {goals.map((g) => (
        <option key={g.id} value={g.id}>
          {g.level} · {g.title}
        </option>
      ))}
    </select>
  );
}
export function GoalTrail({ id, goals }) {
  const chain = ancestors(id, goals);
  return (
    <div className="goal-trail">
      {chain.length ? (
        chain.map((g, i) => (
          <React.Fragment key={g.id}>
            {i > 0 && <ChevronRight size={13} />}
            <span>
              <small>{g.level}</small>
              {g.title}
            </span>
          </React.Fragment>
        ))
      ) : (
        <span>Link a goal to give this session direction.</span>
      )}
    </div>
  );
}
export default function App() {
  const [data, setData] = useState(read),
    [page, setPage] = useState("Today"),
    [date, setDate] = useState(today()),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [query, setQuery] = useState(""),
    [tick, setTick] = useState(Date.now());
  const save = (d) =>
    setData((prev) => (typeof d === "function" ? d(prev) : d));
  useEffect(() => {
    try {
      if (!window.echoLoadError)
        localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      setToast(
        "Storage is full or unavailable. Export a backup before leaving.",
      );
    }
  }, [data]);
  useEffect(() => {
    if (window.echoLoadError)
      setToast(
        "Saved data could not be loaded. Export or recover it in Settings before replacing it.",
      );
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 6500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const notify = (s) => setToast(s),
    go = (p) => {
      setPage(p);
      setMobile(false);
      setQuery("");
    };
  const blocks = data.plans[date] || [],
    studyBlocks = blocks.filter((b) => ["deep", "light"].includes(b.kind)),
    sessions = data.sessions.filter((s) => s.date === date);
  const planned = studyBlocks.reduce((n, b) => n + b.end - b.start, 0),
    actual = Math.round(sessions.reduce((n, s) => n + s.actualMs, 0) / 60000),
    ideas = data.concepts.filter(
      (c) => !c.id.startsWith("d") && c.id !== "root",
    );
  const pending = studyBlocks.filter(
    (b) => !sessions.some((s) => s.blockId === b.id),
  );
  const nowMinutes =
    new Date(tick).getHours() * 60 + new Date(tick).getMinutes();
  const first =
    (date === today() ? pending.find((b) => b.end > nowMinutes) : pending[0]) ||
    pending[0] ||
    studyBlocks[0];
  const start = (b) => {
    if (data.timer) {
      go("Study workspace");
      return;
    }
    setModal({ type: "session", block: b });
  };
  const updatePlan = (bs) =>
    save((d) => ({ ...d, plans: { ...d.plans, [date]: bs } }));
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "echostudy-" + today() + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(
      "Backup exported. Original uploaded files are stored separately on this device.",
    );
  };
  const searchResults = query.trim()
    ? [
        ...data.goals
          .filter((g) => g.title.toLowerCase().includes(query.toLowerCase()))
          .map((g) => ({ title: g.title, type: "Goal", page: "Goals" })),
        ...data.concepts
          .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
          .map((c) => ({
            title: c.title,
            type: "Concept",
            page: "Knowledge tree",
          })),
        ...data.resources
          .filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
          .map((r) => ({
            title: r.title,
            type: "Resource",
            page: "Resource library",
          })),
        ...data.notes
          .filter((n) => n.text.toLowerCase().includes(query.toLowerCase()))
          .map((n) => ({
            title: n.text.slice(0, 70),
            type: "Note",
            page: "Resource library",
          })),
      ]
    : [];
  return (
    <div className="app">
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("Today");
          }}
        >
          <div className="brand-icon">
            <Sprout />
          </div>
          echo<span>study</span>
        </a>
        <div className="workspace-label">YOUR GROWTH WORKSPACE</div>
        <nav>
          {NAV.map(([name, Icon]) => (
            <button
              className={page === name ? "nav-item active" : "nav-item"}
              key={name}
              onClick={() => go(name)}
            >
              <Icon size={19} />
              {name}
              {name === "Study workspace" && data.timer && (
                <i className="live-dot" />
              )}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="side-quote">
            <Sprout size={28} />
            <p>
              A little deeper.
              <br />A little wiser.
              <br />
              Every single day.
            </p>
            <span>GROW WITH INTENTION</span>
          </div>
          <button
            className="nav-item"
            onClick={() => setModal({ type: "settings" })}
          >
            <Settings size={18} />
            Settings & backup
          </button>
          <div className="profile">
            <div className="avatar">Y</div>
            <div>
              <strong>Your personal space</strong>
              <small>Growing, one day at a time</small>
            </div>
            <Leaf size={16} />
          </div>
        </div>
      </aside>
      <div className="shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-btn mobile-toggle"
              aria-label="Toggle navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu />
            </button>
            <span>My workspace</span>
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>
          <div className="top-actions">
            <div className="search">
              <Search size={17} />
              <input
                aria-label="Search your workspace"
                placeholder="Search your mind…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <div className="search-results">
                  {searchResults.length ? (
                    searchResults.slice(0, 8).map((r, i) => (
                      <button key={i} onClick={() => go(r.page)}>
                        <small>{r.type}</small>
                        {r.title}
                        <ArrowUpRight size={14} />
                      </button>
                    ))
                  ) : (
                    <p>No matching ideas yet.</p>
                  )}
                </div>
              )}
            </div>
            <span className="local-pill">
              <span />
              Saved on this device
            </span>
            <div className="avatar small">Y</div>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <Sun size={15} />
                {new Date(date + "T12:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <h1>
                {page === "Today"
                  ? "Make room for becoming."
                  : page === "Knowledge tree"
                    ? "A mind that keeps growing."
                    : page === "Goals"
                      ? "Give your growth direction."
                      : page === "Study workspace"
                        ? "Go a little deeper."
                        : page === "Reflection"
                          ? "Turn experience into wisdom."
                          : page === "Growth"
                            ? "Small steps. Lasting capacity."
                            : page === "Resource library"
                              ? "Good ideas belong together."
                              : "Your day, with intention."}
              </h1>
              <p>
                {page === "Today"
                  ? "A purposeful day. A focused mind. A stronger you."
                  : page === "Knowledge tree"
                    ? "Let ideas take root, branch out, and find unexpected connections."
                    : page === "Goals"
                      ? "Connect what you do today to who you are becoming."
                      : page === "24-hour planner"
                        ? "Protect your essentials. Find realistic space to learn and grow."
                        : page === "Resource library"
                          ? "Read, highlight, and give every insight a place in your knowledge."
                          : page === "Growth"
                            ? "Measure focused effort, connected knowledge, and the habits you are building."
                            : page === "Reflection"
                              ? "Pause, connect the dots, and carry one lesson into tomorrow."
                              : "One objective. Your full attention. Meaningful progress."}
              </p>
            </div>
            <div className="heading-actions">
              {["Today", "24-hour planner", "Reflection"].includes(page) && (
                <input
                  type="date"
                  aria-label="Selected day"
                  value={date}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                />
              )}
              <Button
                primary
                onClick={() =>
                  page === "Goals"
                    ? setModal({ type: "goal" })
                    : page === "24-hour planner"
                      ? setModal({ type: "block" })
                      : start(first)
                }
              >
                {page === "Goals" || page === "24-hour planner" ? (
                  <Plus size={17} />
                ) : (
                  <Play size={15} fill="currentColor" />
                )}
                {page === "Goals"
                  ? "New goal"
                  : page === "24-hour planner"
                    ? "Add time block"
                    : data.timer
                      ? "Return to session"
                      : "Begin a session"}
              </Button>
            </div>
          </div>
          {!data.onboarded && (
            <div className="welcome">
              <div>
                <strong>Your starting point, ready to make your own.</strong>
                <span>
                  This example plan and knowledge tree are editable. Your
                  progress starts at zero.
                </span>
              </div>
              <button
                onClick={() => {
                  save((d) => ({ ...d, onboarded: true }));
                  go("24-hour planner");
                }}
              >
                Personalize my day <ArrowRight size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label="Dismiss introduction"
                onClick={() => save((d) => ({ ...d, onboarded: true }))}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {page === "Today" && (
            <>
              <div className="stats">
                <Stat
                  icon={Clock}
                  label="Study planned"
                  value={duration(planned)}
                  foot={studyBlocks.length + " intentional study windows"}
                  color="#199181"
                />
                <Stat
                  icon={Flame}
                  label="Focused today"
                  value={duration(actual)}
                  foot={sessions.length + " completed sessions"}
                  color="#FB973B"
                />
                <Stat
                  icon={Network}
                  label="Connected knowledge"
                  value={ideas.length}
                  foot={
                    data.concepts.reduce(
                      (n, c) => n + (c.links || []).length,
                      0,
                    ) + " cross-concept connections"
                  }
                  color="#EB4E5E"
                />
                <Stat
                  icon={Target}
                  label="Goals in motion"
                  value={data.goals.filter((g) => g.level === "Week").length}
                  foot="Weekly priorities with a purpose"
                  color="#6BAF9B"
                />
              </div>
              <div className="dashboard-grid">
                <div className="main-column">
                  <section className="focus-card">
                    <div className="focus-top">
                      <Badge>YOUR NEXT DEEP DIVE</Badge>
                      <span>
                        <Clock size={14} />{" "}
                        {first
                          ? duration(first.end - first.start)
                          : "Set your own pace"}
                      </span>
                    </div>
                    <div className="focus-copy">
                      <div>
                        <h2>
                          {first?.title || "Make space for your next idea"}
                        </h2>
                        <p>
                          {first?.objective ||
                            "Choose a clear objective and take one meaningful step toward a larger goal."}
                        </p>
                      </div>
                      <div className="focus-art">
                        <div className="orbit o1" />
                        <div className="orbit o2" />
                        <Sprout size={70} strokeWidth={1.2} />
                        <span className="spark s1">✦</span>
                        <span className="spark s2">✧</span>
                      </div>
                    </div>
                    <div className="focus-footer">
                      <span>
                        <Flag size={14} />
                        {data.goals.find((g) => g.id === first?.goalId)
                          ?.title || "Your intention starts here"}
                      </span>
                      <button className="btn warm" onClick={() => start(first)}>
                        <Play size={14} fill="currentColor" />
                        Enter study space <ArrowUpRight size={17} />
                      </button>
                    </div>
                  </section>
                  <section className="card tree-preview">
                    <div className="section-head">
                      <div>
                        <h2>Your knowledge, taking shape</h2>
                        <p>
                          Every idea is a seed. Every connection, a new
                          possibility.
                        </p>
                      </div>
                      <button
                        className="text-btn"
                        onClick={() => go("Knowledge tree")}
                      >
                        Explore tree <ArrowUpRight size={16} />
                      </button>
                    </div>
                    <Knowledge
                      data={data}
                      save={save}
                      compact
                      notify={notify}
                    />
                    <div className="tree-legend">
                      {DOMAINS.slice(0, 4).map((d, i) => (
                        <span key={d}>
                          <i style={{ background: COLORS[i] }} />
                          {d}
                        </span>
                      ))}
                      <span>+2 life areas</span>
                    </div>
                  </section>
                  <div className="bottom-grid">
                    <section className="card insight-mini">
                      <div className="section-head">
                        <h2>
                          <Lightbulb size={19} /> A connection to explore
                        </h2>
                      </div>
                      <Badge color="#d16a33">PREREQUISITE GAP</Badge>
                      <h3>
                        {insights(data.concepts)[0]?.title ||
                          "Give an idea a new connection"}
                      </h3>
                      <p>
                        {insights(data.concepts)[0]?.body ||
                          "Add a concept to begin building your knowledge."}
                      </p>
                      <button
                        className="text-btn"
                        onClick={() => go("Knowledge tree")}
                      >
                        Follow this thread <ArrowRight size={15} />
                      </button>
                    </section>
                    <section className="card reflection-mini">
                      <NotebookPen size={22} />
                      <h2>Leave a little wiser.</h2>
                      <p>
                        What stretched your thinking today?
                        <br />
                        Capture it before the day slips away.
                      </p>
                      <Button onClick={() => go("Reflection")}>
                        Write a reflection <ArrowUpRight size={16} />
                      </Button>
                    </section>
                  </div>
                </div>
                <aside className="right-column">
                  <section className="card day-card">
                    <div className="section-head">
                      <h2>Your day at a glance</h2>
                      <button
                        className="icon-btn"
                        aria-label="Edit day plan"
                        onClick={() => go("24-hour planner")}
                      >
                        <ArrowUpRight size={19} />
                      </button>
                    </div>
                    <div className="day-bar">
                      {blocks.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            flex: b.end - b.start,
                            background: KINDS[b.kind]?.[1],
                          }}
                          title={b.title}
                        />
                      ))}
                    </div>
                    <div className="bar-labels">
                      <span>00:00</span>
                      <span>12:00</span>
                      <span>24:00</span>
                    </div>
                    <div className="agenda">
                      {blocks
                        .filter((b) => b.end > 420)
                        .slice(0, 7)
                        .map((b) => (
                          <button
                            key={b.id}
                            className={
                              "agenda-row " +
                              (["deep", "light"].includes(b.kind)
                                ? "study-row"
                                : "")
                            }
                            onClick={() =>
                              ["deep", "light"].includes(b.kind)
                                ? start(b)
                                : setModal({ type: "block", block: b })
                            }
                          >
                            <span className="agenda-time">
                              {clock(b.start)}
                            </span>
                            <span
                              className="agenda-line"
                              style={{ "--tone": KINDS[b.kind]?.[1] }}
                            />
                            <span>
                              <strong>{b.title}</strong>
                              <small>
                                {duration(b.end - b.start)} ·{" "}
                                {KINDS[b.kind]?.[0]}
                              </small>
                            </span>
                            {sessions.some((s) => s.blockId === b.id) && (
                              <Check size={14} />
                            )}
                          </button>
                        ))}
                    </div>
                    <button
                      className="full-link"
                      onClick={() => go("24-hour planner")}
                    >
                      View your full 24 hours <ArrowRight size={16} />
                    </button>
                  </section>
                  <section className="card weekly-card">
                    <div className="section-head">
                      <h2>The bigger picture</h2>
                      <Target size={18} />
                    </div>
                    <span className="eyebrow">THIS WEEK'S NORTH STAR</span>
                    <h3>
                      {data.goals.find((g) => g.level === "Week")?.title ||
                        "Set a weekly priority"}
                    </h3>
                    <p>Today's effort has somewhere to go.</p>
                    <div className="progress">
                      <i
                        style={{
                          width:
                            goalProgress(
                              data.goals.find((g) => g.level === "Week")?.id,
                              data.goals,
                            ) + "%",
                        }}
                      />
                    </div>
                    <div className="bar-labels">
                      <span>Goal progress</span>
                      <strong>
                        {goalProgress(
                          data.goals.find((g) => g.level === "Week")?.id,
                          data.goals,
                        )}
                        %
                      </strong>
                    </div>
                    <button className="text-btn" onClick={() => go("Goals")}>
                      See goal architecture <ArrowUpRight size={15} />
                    </button>
                  </section>
                  <p className="quiet-quote">
                    “Every day should move a larger
                    <br />
                    life goal forward.”
                  </p>
                </aside>
              </div>
            </>
          )}
          {page === "24-hour planner" && (
            <Planner
              blocks={blocks}
              data={data}
              date={date}
              update={updatePlan}
              edit={(b) => setModal({ type: "block", block: b })}
              start={start}
              notify={notify}
            />
          )}
          {page === "Goals" && (
            <Goals
              data={data}
              save={save}
              edit={(g) => setModal({ type: "goal", goal: g })}
            />
          )}
          {page === "Study workspace" && (
            <Study
              data={data}
              save={save}
              tick={tick}
              start={() => start(first)}
              finish={() => setModal({ type: "finish" })}
              go={go}
            />
          )}
          {page === "Knowledge tree" && (
            <Knowledge data={data} save={save} notify={notify} />
          )}
          {page === "Resource library" && (
            <Resources data={data} save={save} notify={notify} />
          )}
          {page === "Reflection" && (
            <Reflection data={data} save={save} date={date} notify={notify} />
          )}
          {page === "Growth" && <Growth data={data} />}
          <footer className="page-footer">
            <Sprout size={15} /> Time → goals → study → knowledge → reflection →
            growth <span>One connected life.</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal?.type === "block" && (
        <BlockModal
          block={modal.block}
          blocks={blocks}
          goals={data.goals}
          close={() => setModal(null)}
          submit={(b) => {
            updatePlan(
              [...blocks.filter((x) => x.id !== b.id), b].sort(
                (a, b) => a.start - b.start,
              ),
            );
            setModal(null);
            notify("Time block saved.");
          }}
          remove={(id) => {
            updatePlan(blocks.filter((b) => b.id !== id));
            setModal(null);
          }}
        />
      )}
      {modal?.type === "goal" && (
        <GoalModal
          goal={modal.goal}
          goals={data.goals}
          close={() => setModal(null)}
          submit={(g) => {
            save((d) => ({
              ...d,
              goals: [...d.goals.filter((x) => x.id !== g.id), g],
            }));
            setModal(null);
            notify("Goal saved.");
          }}
        />
      )}
      {modal?.type === "session" && (
        <SessionModal
          block={modal.block}
          data={data}
          close={() => setModal(null)}
          submit={(t) => {
            save((d) => ({ ...d, timer: t }));
            setModal(null);
            go("Study workspace");
          }}
        />
      )}
      {modal?.type === "finish" && (
        <FinishModal
          data={data}
          close={() => setModal(null)}
          submit={(reflection, progress) => {
            const t = data.timer;
            save((d) => ({
              ...d,
              timer: null,
              sessions: [
                ...d.sessions,
                {
                  ...t,
                  id: uid(),
                  date: t.date,
                  actualMs: focusedMs(t),
                  reflection,
                  pauses: t.pauses.map((p) => ({
                    ...p,
                    end: p.end || Date.now(),
                  })),
                  completedAt: new Date().toISOString(),
                },
              ],
              goals: d.goals.map((g) =>
                g.id === t.goalId ? { ...g, progress } : g,
              ),
            }));
            setModal(null);
            notify("Session saved. One meaningful step forward.");
          }}
        />
      )}
      {modal?.type === "settings" && (
        <Modal title="Your workspace & backup" onClose={() => setModal(null)}>
          <p>
            EchoStudy stores plans, goals, notes and reflections in this
            browser. Uploaded files stay in this browser's IndexedDB. There is
            no account or cloud sync in this version.
          </p>
          <div className="notice">
            Export regularly. Clearing browser data removes your workspace. JSON
            backups include notes and resource metadata, but not uploaded files;
            keep originals so you can reattach them.
          </div>
          <Button onClick={exportData}>
            <Download size={16} />
            Export workspace
          </Button>
          <Field label="Restore a JSON backup (replaces current workspace)">
            <input
              type="file"
              accept=".json"
              onChange={async (e) => {
                try {
                  const s = JSON.parse(await e.target.files[0].text());
                  if (!validateBackup(s))
                    throw Error("Invalid EchoStudy backup");
                  setModal({ type: "import", data: s });
                } catch (err) {
                  notify("Could not import: " + err.message);
                }
              }}
            />
          </Field>
          {window.echoLoadError && (
            <Button
              onClick={() => {
                const blob = new Blob([localStorage.getItem(KEY) || ""], {
                  type: "application/json",
                });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "echostudy-recovery.json";
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              Download unreadable saved data
            </Button>
          )}
        </Modal>
      )}
      {modal?.type === "import" && (
        <Modal title="Replace this workspace?" onClose={() => setModal(null)}>
          <p>
            This backup contains {modal.data.goals.length} goals,{" "}
            {modal.data.notes.length} notes, and {modal.data.sessions.length}{" "}
            sessions. Export your current workspace first if you need to keep
            it.
          </p>
          <div className="form-actions">
            <Button onClick={exportData}>Export current data</Button>
            <Button
              primary
              onClick={() => {
                window.echoLoadError = false;
                save({
                  ...modal.data,
                  timer: null,
                  reflections: modal.data.reflections || {},
                });
                setModal(null);
                notify(
                  "Workspace restored. Reattach original files in the resource library if needed.",
                );
              }}
            >
              Restore backup
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Stat({ icon: Icon, label, value, foot, color }) {
  return (
    <div className="stat">
      <div className="stat-label">
        {label}
        <Icon size={18} style={{ color }} />
      </div>
      <strong>{value}</strong>
      <small>{foot}</small>
    </div>
  );
}
function Planner({ blocks, data, date, update, edit, start, notify }) {
  const [hours, setHours] = useState(3),
    [goal, setGoal] = useState("g5");
  const booked = blocks.reduce((n, b) => n + b.end - b.start, 0);
  return (
    <>
      <div className="planner-banner">
        <div>
          <h2>A full life needs breathing room.</h2>
          <p>
            Keep your commitments, then fit study into free windows between
            06:00 and 23:00. Deep blocks last at most 90 minutes, with 15-minute
            breaks where space allows.
          </p>
        </div>
        <div className="auto-controls">
          <Field label="Study hours">
            <input
              type="number"
              min=".5"
              max="12"
              step=".5"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </Field>
          <Field label="Contributing goal">
            <GoalSelect goals={data.goals} value={goal} onChange={setGoal} />
          </Field>
          <Button
            primary
            onClick={() => {
              if (
                !goal ||
                !Number.isFinite(hours) ||
                hours < 0.5 ||
                hours > 12
              ) {
                notify("Choose a goal and 0.5–12 study hours.");
                return;
              }
              const result = fillStudyWindows(blocks, hours * 60, goal);
              update(result.blocks);
              notify(
                result.unplaced
                  ? duration(hours * 60 - result.unplaced) +
                      " scheduled; " +
                      duration(result.unplaced) +
                      " could not fit. Adjust commitments or reduce study time."
                  : "Study windows planned with recovery breaks.",
              );
            }}
          >
            <Sprout size={17} />
            Find my study windows
          </Button>
        </div>
      </div>
      <div className="planner-summary">
        <Badge>{duration(booked)} allocated</Badge>
        <Badge color="#d16a33">{duration(1440 - booked)} open</Badge>
        <span>
          Blocks run from midnight to midnight. Edit any block to make this day
          yours.
        </span>
        {!blocks.length && (
          <Button
            onClick={() => {
              const plan = Object.values(data.plans).find((p) => p.length);
              if (plan) update(plan.map((b) => ({ ...b, id: uid() })));
              else notify("Add your sleep and commitments first.");
            }}
          >
            Copy an existing day's plan
          </Button>
        )}
      </div>
      <section className="card planner-table">
        <div className="table-heading">
          <span>TIME</span>
          <span>INTENTION</span>
          <span>ENERGY</span>
          <span>DURATION</span>
          <span>ACTION</span>
        </div>
        {blocks.map((b) => (
          <div className="plan-row" key={b.id}>
            <span className="mono">
              {clock(b.start)} <small>— {clock(b.end)}</small>
            </span>
            <button className="plan-title" onClick={() => edit(b)}>
              <i style={{ background: KINDS[b.kind]?.[1] }} />
              <span>
                <strong>{b.title}</strong>
                <small>
                  {b.objective ||
                    data.goals.find((g) => g.id === b.goalId)?.title ||
                    "A protected part of your day"}
                </small>
              </span>
            </button>
            <Badge color={KINDS[b.kind]?.[1]}>{KINDS[b.kind]?.[0]}</Badge>
            <span>{duration(b.end - b.start)}</span>
            <div className="row-actions">
              {["deep", "light"].includes(b.kind) && (
                <button
                  className="icon-btn"
                  aria-label={"Start " + b.title}
                  onClick={() => start(b)}
                >
                  <Play size={16} />
                </button>
              )}
              <button className="text-btn" onClick={() => edit(b)}>
                Edit
              </button>
            </div>
          </div>
        ))}
        {!blocks.length && (
          <div className="empty">
            <CalendarDays />
            <h3>A fresh day to design.</h3>
            <p>Add sleep, work, meals and your other non-negotiables first.</p>
          </div>
        )}
      </section>
    </>
  );
}
function BlockModal({ block, blocks, goals, close, submit, remove }) {
  const [b, setB] = useState(
      block || {
        id: uid(),
        title: "",
        start: 480,
        end: 540,
        kind: "deep",
        goalId: "",
        objective: "",
      },
    ),
    [error, setError] = useState("");
  const change = (k, v) => setB({ ...b, [k]: v });
  return (
    <Modal
      title={block ? "Edit time block" : "Make room in your day"}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const err = validateBlock(b, blocks);
          if (err) {
            setError(err);
            return;
          }
          submit(b);
        }}
      >
        <Field label="What is this time for?">
          <input
            autoFocus
            required
            value={b.title}
            onChange={(e) => change("title", e.target.value)}
          />
        </Field>
        <div className="form-grid">
          <Field label="Starts">
            <input
              type="time"
              required
              value={clock(b.start)}
              onChange={(e) => change("start", minutes(e.target.value))}
            />
          </Field>
          <Field label="Ends (24:00 for midnight)">
            <input
              required
              pattern="([01][0-9]|2[0-3]):[0-5][0-9]|24:00"
              value={clock(b.end)}
              onChange={(e) => change("end", minutes(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Type of energy">
          <select
            value={b.kind}
            onChange={(e) => change("kind", e.target.value)}
          >
            {Object.entries(KINDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v[0]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Linked goal">
          <GoalSelect
            goals={goals}
            value={b.goalId}
            onChange={(v) => change("goalId", v)}
          />
        </Field>
        {["deep", "light"].includes(b.kind) && (
          <Field label="What will you understand, explain, or do?">
            <textarea
              value={b.objective}
              onChange={(e) => change("objective", e.target.value)}
              placeholder="A clear outcome for this study block…"
            />
          </Field>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          {block && (
            <button
              type="button"
              className="text-btn danger"
              onClick={() => remove(b.id)}
            >
              <Trash2 size={15} />
              Remove block
            </button>
          )}
          <Button primary type="submit">
            Save time block
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function Goals({ data, save, edit }) {
  const [domain, setDomain] = useState("all");
  const render = (g, depth = 0) => (
    <div className="goal-node" key={g.id} style={{ "--depth": depth }}>
      <div className="goal-row">
        <span className="goal-type" style={{ color: COLORS[g.domain] }}>
          {g.level}
        </span>
        <div className="goal-main">
          <strong>{g.title}</strong>
          <small>
            {DOMAINS[g.domain]}
            {g.due ? " · Due " + g.due : ""}
          </small>
          <div className="progress">
            <i
              style={{
                width: goalProgress(g.id, data.goals) + "%",
                background: COLORS[g.domain],
              }}
            />
          </div>
        </div>
        <span className="percent">{goalProgress(g.id, data.goals)}%</span>
        <button className="text-btn" onClick={() => edit(g)}>
          Edit
        </button>
      </div>
      {data.goals
        .filter((x) => x.parent === g.id)
        .map((x) => render(x, depth + 1))}
    </div>
  );
  return (
    <>
      <div className="filter-bar">
        <button
          className={domain === "all" ? "filter active" : "filter"}
          onClick={() => setDomain("all")}
        >
          All life areas
        </button>
        {DOMAINS.map((d, i) => (
          <button
            key={d}
            className={domain === i ? "filter active" : "filter"}
            onClick={() => setDomain(i)}
          >
            <i style={{ background: COLORS[i] }} />
            {d}
          </button>
        ))}
      </div>
      <div className="goal-explainer">
        <span>Yearly capacity</span>
        <ArrowRight />
        <span>Quarterly outcome</span>
        <ArrowRight />
        <span>Monthly milestone</span>
        <ArrowRight />
        <span>Weekly priority</span>
        <ArrowRight />
        <span>Daily objective</span>
      </div>
      <section className="card goals-card">
        {data.goals
          .filter((g) => !g.parent && (domain === "all" || g.domain === domain))
          .map((g) => render(g))}
        {!data.goals.some((g) => domain === "all" || g.domain === domain) && (
          <div className="empty">
            <Target />
            <h3>What do you want to become capable of?</h3>
            <p>Add your first goal for this life area.</p>
          </div>
        )}
      </section>
      <p className="muted">
        Parent progress is the average of its immediate children. Update leaf
        goals after study or in the goal editor.
      </p>
    </>
  );
}
function GoalModal({ goal, goals, close, submit }) {
  const [g, setG] = useState(
    goal || {
      id: uid(),
      title: "",
      level: "Year",
      domain: 0,
      parent: "",
      progress: 0,
      due: "",
    },
  );
  const change = (k, v) => setG({ ...g, [k]: v });
  return (
    <Modal
      title={goal ? "Shape your goal" : "Plant a new goal"}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit({ ...g, title: g.title.trim() });
        }}
      >
        <Field label="What capacity or outcome are you building?">
          <input
            required
            autoFocus
            value={g.title}
            onChange={(e) => change("title", e.target.value)}
          />
        </Field>
        <div className="form-grid">
          <Field label="Horizon">
            <select
              value={g.level}
              disabled={goals.some((x) => x.parent === g.id)}
              onChange={(e) =>
                setG({ ...g, level: e.target.value, parent: "" })
              }
            >
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Life area">
            <select
              value={g.domain}
              disabled={
                Boolean(g.parent) || goals.some((x) => x.parent === g.id)
              }
              onChange={(e) => change("domain", Number(e.target.value))}
            >
              {DOMAINS.map((d, i) => (
                <option value={i} key={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {g.level !== "Year" && (
          <Field label="Larger goal this contributes to">
            <select
              value={g.parent}
              onChange={(e) => {
                const p = goals.find((x) => x.id === e.target.value);
                setG({
                  ...g,
                  parent: e.target.value,
                  domain: p?.domain ?? g.domain,
                });
              }}
            >
              <option value="">Independent goal</option>
              {goals
                .filter(
                  (x) =>
                    x.id !== g.id &&
                    LEVELS.indexOf(x.level) < LEVELS.indexOf(g.level),
                )
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.level} · {x.title}
                  </option>
                ))}
            </select>
          </Field>
        )}
        <Field label="Target date">
          <input
            type="date"
            value={g.due || ""}
            onChange={(e) => change("due", e.target.value)}
          />
        </Field>
        {!goals.some((x) => x.parent === g.id) && (
          <Field label={"Progress · " + g.progress + "%"}>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={g.progress}
              onChange={(e) => change("progress", Number(e.target.value))}
            />
          </Field>
        )}
        <div className="form-actions">
          <Button primary type="submit">
            Save goal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function SessionModal({ block, data, close, submit }) {
  const [objective, setObjective] = useState(block?.objective || ""),
    [goal, setGoal] = useState(block?.goalId || ""),
    [mins, setMins] = useState(block ? block.end - block.start : 45),
    [topic, setTopic] = useState(block?.title || ""),
    [concept, setConcept] = useState(""),
    [resource, setResource] = useState("");
  return (
    <Modal title="Begin with an intention" onClose={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!objective.trim() || !topic.trim()) return;
          submit({
            id: uid(),
            blockId: block?.id || "",
            date: today(),
            topic,
            objective,
            goalId: goal,
            conceptId: concept,
            resourceId: resource,
            planned: mins,
            elapsed: 0,
            started: Date.now(),
            pauses: [],
            notes: "",
          });
        }}
      >
        <Field label="What are you studying?">
          <input
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </Field>
        <Field label="By the end, I will understand, explain, or be able to…">
          <textarea
            required
            autoFocus
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Explain how transformers change voltage, using a diagram."
          />
        </Field>
        <Field label="This session contributes to">
          <GoalSelect
            required
            goals={data.goals}
            value={goal}
            onChange={setGoal}
          />
        </Field>
        <GoalTrail id={goal} goals={data.goals} />
        <div className="form-grid">
          <Field label="Planned focus (minutes)">
            <input
              type="number"
              required
              min="1"
              max="240"
              value={mins}
              onChange={(e) => setMins(Number(e.target.value))}
            />
          </Field>
          <Field label="Current concept">
            <select
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            >
              <option value="">Choose a concept (optional)</option>
              {data.concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Study resource">
          <select
            value={resource}
            onChange={(e) => setResource(e.target.value)}
          >
            <option value="">No resource selected</option>
            {data.resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </Field>
        <div className="form-actions">
          <Button primary type="submit">
            <Play size={15} />
            Start focused study
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function Study({ data, save, tick, start, finish, go }) {
  const t = data.timer;
  const [focus, setFocus] = useState(false);
  if (!t)
    return (
      <section className="card empty study-empty">
        <div className="empty-sprout">
          <Sprout size={52} />
        </div>
        <Badge>INTENTION BEFORE ATTENTION</Badge>
        <h2>Your next hour can change what you know.</h2>
        <p>
          Choose a topic, define an outcome, and connect it to a goal.
          <br />
          The timer starts when your purpose is clear.
        </p>
        <Button primary onClick={start}>
          <Play size={16} />
          Set your study intention
        </Button>
        {data.sessions.length > 0 && (
          <p>{data.sessions.length} intentional sessions completed so far.</p>
        )}
      </section>
    );
  const elapsed = focusedMs(t, tick),
    sec = Math.floor(elapsed / 1000),
    remaining = Math.max(0, t.planned * 60 - sec),
    shown = remaining ? remaining : sec - t.planned * 60,
    display =
      String(Math.floor(shown / 60)).padStart(2, "0") +
      ":" +
      String(shown % 60).padStart(2, "0");
  const pause = () =>
    save((d) => {
      const v = d.timer;
      if (!v) return d;
      return {
        ...d,
        timer: v.started
          ? {
              ...v,
              elapsed: focusedMs(v),
              started: null,
              pauses: [...v.pauses, { start: Date.now(), end: null }],
            }
          : {
              ...v,
              started: Date.now(),
              pauses: v.pauses.map((p, i) =>
                i === v.pauses.length - 1 ? { ...p, end: Date.now() } : p,
              ),
            },
      };
    });
  return (
    <div className={focus ? "study-area distraction-free" : "study-area"}>
      <div className="section-head">
        <Badge color="#199181">
          {t.started ? "FOCUS IN PROGRESS" : "PAUSED · TAKE A BREATH"}
        </Badge>
        <button className="text-btn" onClick={() => setFocus(!focus)}>
          <Maximize2 size={16} />
          {focus ? "Exit focus mode" : "Focus mode"}
        </button>
      </div>
      <GoalTrail id={t.goalId} goals={data.goals} />
      <div className="study-layout">
        <section className="card timer-card">
          <div className="eyebrow">YOUR OBJECTIVE</div>
          <h2>{t.objective}</h2>
          <p>{t.topic}</p>
          <div
            className="timer-ring"
            style={{
              "--progress":
                Math.min((elapsed / (t.planned * 60000)) * 360, 360) + "deg",
            }}
          >
            <div>
              <span className="timer-digits">
                {remaining ? "" : "+"}
                {display}
              </span>
              <span>
                {remaining
                  ? "remaining in this session"
                  : "beyond your planned focus"}
              </span>
            </div>
          </div>
          <div className="timer-controls">
            <Button onClick={pause}>
              {t.started ? <Pause size={18} /> : <Play size={18} />}{" "}
              {t.started ? "Pause" : "Resume"}
            </Button>
            <Button
              primary
              onClick={() => {
                if (t.started)
                  save((d) => ({
                    ...d,
                    timer: {
                      ...d.timer,
                      elapsed: focusedMs(d.timer),
                      started: null,
                    },
                  }));
                finish();
              }}
            >
              <Check size={18} />
              Finish & reflect
            </Button>
          </div>
          <div className="timer-meta">
            <span>
              Planned <strong>{t.planned}m</strong>
            </span>
            <span>
              Focused <strong>{duration(Math.floor(sec / 60))}</strong>
            </span>
            <span>
              Pauses <strong>{t.pauses.length}</strong>
            </span>
          </div>
        </section>
        <section className="card session-notes">
          <div className="section-head">
            <h2>Think on the page</h2>
            <NotebookPen size={19} />
          </div>
          <p>
            Questions, explanations, examples. Capture what is changing in your
            understanding.
          </p>
          <textarea
            aria-label="Session notes"
            placeholder="What am I learning? What is still unclear? How does this connect?"
            value={t.notes}
            onChange={(e) =>
              save((d) => ({
                ...d,
                timer: { ...d.timer, notes: e.target.value },
              }))
            }
          />
          <small>Notes save automatically with this session.</small>
          <div className="session-context">
            <Badge>
              {data.concepts.find((c) => c.id === t.conceptId)?.title ||
                "No concept selected"}
            </Badge>
            <p>
              {data.resources.find((r) => r.id === t.resourceId)?.title ||
                "Bring your resources into this workspace."}
            </p>
            <Button
              onClick={() => {
                setFocus(false);
                go("Resource library");
              }}
            >
              <BookOpen size={16} />
              Open resource library
            </Button>
            <Button
              onClick={() => {
                setFocus(false);
                go("Knowledge tree");
              }}
            >
              <Plus size={16} />
              Capture a concept
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
function FinishModal({ data, close, submit }) {
  const [r, setR] = useState(""),
    [progress, setProgress] = useState(
      data.goals.find((g) => g.id === data.timer.goalId)?.progress || 0,
    );
  return (
    <Modal title="Make the learning stick" onClose={close}>
      <p>
        You focused for {duration(Math.floor(focusedMs(data.timer) / 60000))} of{" "}
        {data.timer.planned} planned minutes.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(r, progress);
        }}
      >
        <Field label="What can you explain or do now? What remains unclear?">
          <textarea
            required
            autoFocus
            value={r}
            onChange={(e) => setR(e.target.value)}
            placeholder="I can now explain… Next, I need to understand…"
          />
        </Field>
        {!data.goals.some((g) => g.parent === data.timer.goalId) && (
          <Field label={"Update linked goal progress · " + progress + "%"}>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
            />
          </Field>
        )}
        <div className="form-actions">
          <Button primary type="submit">
            <Check size={16} />
            Complete session
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function Reflection({ data, save, date, notify }) {
  const r = data.reflections[date] || {},
    sessions = data.sessions.filter((s) => s.date === date);
  const set = (k, v) =>
    save((d) => ({
      ...d,
      reflections: {
        ...d.reflections,
        [date]: { ...d.reflections[date], [k]: v },
      },
    }));
  return (
    <div className="reflection-layout">
      <section className="card reflection-form">
        <Badge>THE DAILY PAUSE</Badge>
        <h2>What did today grow in you?</h2>
        <p>
          Reflection turns accumulated information into a more coherent life.
        </p>
        {[
          [
            "learned",
            "What stretched your mind today?",
            "An insight, a difficult idea, a new way of seeing…",
          ],
          [
            "connections",
            "What connected to something you already know?",
            "A concept, a conversation, an experience…",
          ],
          [
            "gaps",
            "Where did you get stuck?",
            "A missing prerequisite or a question to carry forward…",
          ],
          [
            "tomorrow",
            "What is one purposeful step for tomorrow?",
            "A small action connected to a larger goal…",
          ],
        ].map(([k, l, p]) => (
          <Field label={l} key={k}>
            <textarea
              value={r[k] || ""}
              placeholder={p}
              onChange={(e) => set(k, e.target.value)}
            />
          </Field>
        ))}
        <Field label="Larger goal this reflection serves">
          <GoalSelect
            goals={data.goals}
            value={r.goalId}
            onChange={(v) => set("goalId", v)}
          />
        </Field>
        <Button
          primary
          onClick={() => {
            set("savedAt", new Date().toISOString());
            notify("Reflection saved. Carry your learning forward.");
          }}
        >
          <Check size={16} />
          Save today's reflection
        </Button>
        <small className="muted">Drafts also save automatically.</small>
      </section>
      <section className="card reflection-history">
        <h2>Your learning today</h2>
        {sessions.length ? (
          sessions.map((s) => (
            <article key={s.id}>
              <Badge>{duration(Math.floor(s.actualMs / 60000))} focused</Badge>
              <h3>{s.topic}</h3>
              <p>{s.reflection}</p>
              {s.notes && (
                <details>
                  <summary>Session notes</summary>
                  <p className="prewrap">{s.notes}</p>
                </details>
              )}
              <small>{data.goals.find((g) => g.id === s.goalId)?.title}</small>
            </article>
          ))
        ) : (
          <div className="empty">
            <Leaf />
            <p>Complete a study session to see your learning here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
function Growth({ data }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const key = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
    return {
      key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      actual: data.sessions
        .filter((s) => s.date === key)
        .reduce((n, s) => n + s.actualMs / 60000, 0),
      planned: (data.plans[key] || [])
        .filter((b) => ["deep", "light"].includes(b.kind))
        .reduce((n, b) => n + b.end - b.start, 0),
    };
  });
  const max = Math.max(60, ...days.flatMap((d) => [d.actual, d.planned]));
  const total = days.reduce((n, d) => n + d.actual, 0);
  return (
    <>
      <div className="stats">
        <Stat
          icon={Clock}
          label="Focused this week"
          value={duration(Math.round(total))}
          foot={
            "of " +
            duration(days.reduce((n, d) => n + d.planned, 0)) +
            " planned"
          }
          color="#199181"
        />
        <Stat
          icon={CheckCircle2}
          label="Study sessions"
          value={data.sessions.length}
          foot="All-time completed sessions"
          color="#FB973B"
        />
        <Stat
          icon={Network}
          label="Confident concepts"
          value={data.concepts.filter((c) => c.status === "Confident").length}
          foot="Self-assessed understanding"
          color="#EB4E5E"
        />
        <Stat
          icon={NotebookPen}
          label="Days reflected"
          value={
            Object.values(data.reflections).filter((r) => r.savedAt).length
          }
          foot="Learning carried forward"
          color="#6BAF9B"
        />
      </div>
      <section className="card growth-chart">
        <div className="section-head">
          <div>
            <h2>Make your intentions visible.</h2>
            <p>Planned vs. actual focused minutes over the last seven days.</p>
          </div>
          <div className="tree-legend">
            <span>
              <i style={{ background: "#dce6df" }} />
              Planned
            </span>
            <span>
              <i style={{ background: "#199181" }} />
              Focused
            </span>
          </div>
        </div>
        <div className="chart">
          {days.map((d) => (
            <div className="chart-day" key={d.key}>
              <span>{Math.round(d.actual)}m</span>
              <div className="chart-bars">
                <div
                  style={{ height: (d.planned / max) * 180 }}
                  title={"Planned: " + d.planned + " minutes"}
                />
                <div
                  style={{
                    height: (d.actual / max) * 180,
                    background: "#199181",
                  }}
                  title={"Focused: " + Math.round(d.actual) + " minutes"}
                />
              </div>
              <strong>{d.label}</strong>
              <small>{d.planned}m planned</small>
            </div>
          ))}
        </div>
      </section>
      <section className="card session-history">
        <h2>Your study record</h2>
        {data.sessions.length ? (
          [...data.sessions].reverse().map((s) => (
            <div className="history-row" key={s.id}>
              <div>
                <strong>{s.topic}</strong>
                <small>
                  {s.date} · {s.objective}
                </small>
              </div>
              <span>
                {duration(Math.floor(s.actualMs / 60000))} / {s.planned}m
                planned
              </span>
              <Badge>{s.pauses.length} pauses</Badge>
            </div>
          ))
        ) : (
          <div className="empty">
            <Sprout />
            <p>Your first intentional session starts your growth record.</p>
          </div>
        )}
      </section>
    </>
  );
}
