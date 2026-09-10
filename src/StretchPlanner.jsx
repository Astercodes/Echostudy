import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Flame,
  Plus,
  Play,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button, Field } from "./App";
import { uid, today } from "./model";
import { knowledgeEntries } from "./knowledge-tree";

const actions = {
  study: ["Peel", "Squeeze", "Chew", "Regurgitate", "Absorb", "Taste", "Test"],
  stretch: ["Apply"],
};
const colors = { study: "#009cde", stretch: "#ff7900" };
export default function StretchPlanner({ data, save, go }) {
  const [date, setDate] = useState(today()),
    [editing, setEditing] = useState(null);
  const items = (data.learningPlanner || [])
    .filter((x) => x.date === date)
    .sort((a, b) => a.order - b.order);
  const concepts = useMemo(
    () => knowledgeEntries(data).filter((n) => !n.trashedAt),
    [data],
  );
  const goals = data.goals.filter((g) => g.progress < 100);
  const store = (item) =>
    save((d) => ({
      ...d,
      learningPlanner: [
        ...(d.learningPlanner || []).filter((x) => x.id !== item.id),
        item,
      ],
    }));
  const remove = (id) =>
    save((d) => ({
      ...d,
      learningPlanner: (d.learningPlanner || []).filter((x) => x.id !== id),
    }));
  const addSuggested = () => {
    const base = items.length;
    const suggestions = [
      {
        type: "study",
        action: "Peel",
        title: "Open the foundations",
        duration: 20,
      },
      {
        type: "stretch",
        action: "Apply",
        title: "Use the idea in a small situation",
        duration: 15,
      },
      {
        type: "study",
        action: "Regurgitate",
        title: "Recall what you understood",
        duration: 10,
      },
    ].map((x, i) => ({
      ...x,
      id: uid(),
      date,
      order: base + i,
      status: "planned",
      goalId: "",
      conceptId: "",
      objective: "",
      note: "",
    }));
    save((d) => ({
      ...d,
      learningPlanner: [...(d.learningPlanner || []), ...suggestions],
    }));
  };
  return (
    <div className="stretch-planner">
      <section className="card planner-hero">
        <div>
          <span className="eyebrow">THE LEARNING LOOP</span>
          <h2>Plan the exchange between knowing and doing.</h2>
          <p>
            Build a deliberate sequence of Study and Stretch. Each item has its
            own objective, action, duration, goal and knowledge context.
          </p>
        </div>
        <div className="planner-loop">
          <span>
            <BookOpen />
            Input
          </span>
          <ArrowRight />
          <span>
            <Sparkles />
            Process
          </span>
          <ArrowRight />
          <span>
            <Flame />
            Practice
          </span>
          <ArrowRight />
          <span>
            <Check />
            Feedback
          </span>
        </div>
      </section>
      <section className="planner-toolbar">
        <Field label="Planner day">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <div>
          <Button
            primary
            onClick={() =>
              setEditing({
                id: uid(),
                type: "study",
                action: "Peel",
                title: "",
                duration: 20,
                date,
                order: items.length,
                status: "planned",
                goalId: "",
                conceptId: "",
                objective: "",
                note: "",
              })
            }
          >
            <Plus size={16} /> Add learning block
          </Button>
          <Button onClick={addSuggested}>
            <Sparkles size={16} /> Suggest a loop
          </Button>
        </div>
      </section>
      <section className="card planner-sequence">
        <div className="planner-sequence-heading">
          <div>
            <span className="eyebrow">
              {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            <h2>Today’s sequence</h2>
          </div>
          <span>
            {items.length} blocks ·{" "}
            {items.reduce((n, x) => n + Number(x.duration || 0), 0)} minutes
          </span>
        </div>
        {!items.length && (
          <div className="planner-empty">
            <Sparkles size={30} />
            <h3>Design your first loop.</h3>
            <p>A useful starting pattern is Study → Apply → Recall.</p>
            <Button onClick={addSuggested}>Add starter sequence</Button>
          </div>
        )}
        {items.map((item, i) => (
          <article className={`planner-item ${item.type}`} key={item.id}>
            <div className="planner-order">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              className="planner-item-icon"
              style={{ background: colors[item.type] }}
            >
              {item.type === "study" ? (
                <BookOpen size={18} />
              ) : (
                <Flame size={18} />
              )}
            </div>
            <div className="planner-item-content">
              <div>
                <span className="planner-type">
                  {item.type === "study" ? "Study" : "Stretch"} · {item.action}
                </span>
                <h3>{item.title || "Untitled learning block"}</h3>
              </div>
              <p>
                {item.objective || "Set an objective before this block begins."}
              </p>
              <small>
                {item.duration} min
                {item.goalId
                  ? ` · ${data.goals.find((g) => g.id === item.goalId)?.title || "Linked goal"}`
                  : ""}
                {item.conceptId
                  ? ` · ${concepts.find((n) => n.id === item.conceptId)?.title || "Linked knowledge"}`
                  : ""}
              </small>
            </div>
            <div className="planner-item-actions">
              {item.status === "complete" ? (
                <span className="planner-done">
                  <Check size={15} /> Done
                </span>
              ) : (
                <Button
                  primary
                  onClick={() => {
                    store({
                      ...item,
                      status: "active",
                      startedAt: new Date().toISOString(),
                    });
                    go(
                      item.type === "study"
                        ? "Study workspace"
                        : "Stretch workspace",
                    );
                  }}
                >
                  <Play size={15} /> Start
                </Button>
              )}
              <Button onClick={() => setEditing(item)}>Edit</Button>
              <Button onClick={() => remove(item.id)}>Remove</Button>
            </div>
          </article>
        ))}
      </section>
      {editing && (
        <PlannerEditor
          item={editing}
          goals={goals}
          concepts={concepts}
          save={(item) => {
            store(item);
            setEditing(null);
          }}
          close={() => setEditing(null)}
        />
      )}
    </div>
  );
}
function PlannerEditor({ item, goals, concepts, save, close }) {
  const [draft, setDraft] = useState(item);
  const patch = (v) => setDraft((d) => ({ ...d, ...v }));
  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <section className="modal" role="dialog" aria-label="Learning block">
        <div className="section-head">
          <h2>Shape learning block</h2>
          <button className="icon-btn" onClick={close}>
            ×
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(draft);
          }}
        >
          <div className="form-grid">
            <Field label="Workspace">
              <select
                value={draft.type}
                onChange={(e) =>
                  patch({
                    type: e.target.value,
                    action: actions[e.target.value][0],
                  })
                }
              >
                <option value="study">Study</option>
                <option value="stretch">Stretch</option>
              </select>
            </Field>
            <Field label="Action">
              <select
                value={draft.action}
                onChange={(e) => patch({ action: e.target.value })}
              >
                {actions[draft.type].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Title">
            <input
              required
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder={
                draft.type === "study"
                  ? "Conflict resolution foundations"
                  : "Apply active listening in today's meeting"
              }
            />
          </Field>
          <Field label="Objective">
            <textarea
              required
              value={draft.objective}
              onChange={(e) => patch({ objective: e.target.value })}
              placeholder="What should happen by the end of this block?"
            />
          </Field>
          <div className="form-grid">
            <Field label="Duration (minutes)">
              <input
                type="number"
                min="1"
                max="1440"
                value={draft.duration}
                onChange={(e) => patch({ duration: Number(e.target.value) })}
              />
            </Field>
            <Field label="Linked goal">
              <select
                value={draft.goalId}
                onChange={(e) => patch({ goalId: e.target.value })}
              >
                <option value="">No linked goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.level} · {g.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Linked knowledge">
            <select
              value={draft.conceptId}
              onChange={(e) => patch({ conceptId: e.target.value })}
            >
              <option value="">No linked knowledge</option>
              {concepts.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preparation or feedback note">
            <textarea
              value={draft.note}
              onChange={(e) => patch({ note: e.target.value })}
              placeholder="What will you carry into the next block?"
            />
          </Field>
          <div className="form-actions">
            <Button primary type="submit">
              Save block
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
