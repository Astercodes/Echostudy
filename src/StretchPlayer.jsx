import React, { useEffect, useState } from "react";
import { ArrowLeft, Pause, Play, CheckCircle2, BookOpen } from "lucide-react";
import { Button, Field } from "./App";
import { ENVIRONMENTS, CHALLENGES, practiceElapsed } from "./stretch-practice";

export default function StretchPlayer({
  record,
  store,
  close,
  finish,
  onStudy,
  knowledge,
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const env = ENVIRONMENTS[record.environment || "internal"];
  const elapsed = Math.floor(practiceElapsed(record, now) / 1000);
  const patch = (update) => store({ ...record, ...update });
  const pause = () => ({
    practiceMs: practiceElapsed(record),
    practiceStartedAt: null,
  });
  return (
    <section className="stretch-player">
      <div className="stretch-player-top">
        <Button
          onClick={() => {
            patch(pause());
            close();
          }}
        >
          <ArrowLeft size={16} /> Save & return
        </Button>
        <span>Responses save as you type</span>
      </div>
      <div className="stretch-player-grid">
        <aside className="card stretch-player-brief">
          <span className="eyebrow">{env.title.toUpperCase()} PRACTICE</span>
          <h2>{record.title}</h2>
          <p>{record.objective}</p>
          <div
            className="practice-clock"
            role="timer"
            aria-label="Practice time"
          >
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
            {String(elapsed % 60).padStart(2, "0")}
          </div>
          <small>
            {record.planned} minutes planned ·{" "}
            {record.practiceStartedAt ? "Timer running" : "Timer paused"}
          </small>
          <Button
            onClick={() =>
              patch(
                record.practiceStartedAt
                  ? pause()
                  : { practiceStartedAt: new Date().toISOString() },
              )
            }
          >
            {record.practiceStartedAt ? (
              <Pause size={16} />
            ) : (
              <Play size={16} />
            )}{" "}
            {record.practiceStartedAt ? "Pause timer" : "Resume timer"}
          </Button>
          <h3>Successful practice</h3>
          <p>{record.success}</p>
          <small>
            Challenge {record.challenge || 1} ·{" "}
            {CHALLENGES[(record.challenge || 1) - 1]}
          </small>
          {!!record.knowledgeIds?.length && (
            <>
              <h3>Supporting knowledge</h3>
              {record.knowledgeIds.map((id) => (
                <Button
                  key={id}
                  disabled={!knowledge.some((n) => n.id === id)}
                  onClick={() => {
                    patch(pause());
                    onStudy(id);
                  }}
                >
                  <BookOpen size={15} />
                  {knowledge.find((n) => n.id === id)?.title ||
                    "Unavailable source"}
                </Button>
              ))}
            </>
          )}
        </aside>
        <div className="stretch-player-body">
          <div className="card stretch-player-intro">
            <h2>{env.subtitle}</h2>
            <p>{env.description}</p>
            {record.environment === "simulated" && (
              <p className="practice-scenario">
                <strong>Scenario challenge</strong>
                <br />
                {record.scenario || record.objective}
                <br />
                <small>
                  This is a guided scenario you perform and assess. For
                  interactive role-play, practise with a partner.
                </small>
              </p>
            )}
          </div>
          {env.prompts.map((prompt, i) => (
            <section
              className="card practice-step"
              key={`${record.environment}-${i}`}
            >
              <span className="practice-step-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Field label={prompt}>
                <textarea
                  rows={5}
                  value={
                    record.practiceResponses?.[
                      `${record.environment || "internal"}:${i}`
                    ] || ""
                  }
                  onChange={(e) =>
                    patch({
                      practiceResponses: {
                        ...record.practiceResponses,
                        [`${record.environment || "internal"}:${i}`]:
                          e.target.value,
                      },
                    })
                  }
                  placeholder="Record your performance, decisions or observations…"
                />
              </Field>
            </section>
          ))}
          <section className="card practice-step">
            <h3>Review the attempt</h3>
            <p>
              Rate what you observed. These are your assessments of this
              attempt.
            </p>
            <div className="practice-rubric">
              {[
                "Accuracy",
                "Independence",
                "Adaptability",
                "Useful outcome",
              ].map((label) => (
                <Field label={label} key={label}>
                  <select
                    value={record.rubric?.[label] || ""}
                    onChange={(e) =>
                      patch({
                        rubric: { ...record.rubric, [label]: e.target.value },
                      })
                    }
                  >
                    <option value="">Not assessed</option>
                    <option>Needs support</option>
                    <option>Developing</option>
                    <option>Consistent</option>
                    <option>Strong evidence</option>
                  </select>
                </Field>
              ))}
            </div>
          </section>
          <div className="practice-complete">
            <Button
              primary
              onClick={() => {
                const next = {
                  ...record,
                  ...pause(),
                  actualMinutes: Math.round(practiceElapsed(record) / 60000),
                };
                store(next);
                finish(next);
              }}
            >
              <CheckCircle2 size={18} /> Review result & harvest
            </Button>
            <small>
              An incomplete attempt can still reveal something useful.
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}
