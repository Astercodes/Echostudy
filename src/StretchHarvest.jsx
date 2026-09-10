import React, { useMemo, useState } from "react";
import { Button, Field, Modal } from "./App";
import { CapacityPicker } from "./Barns.jsx";
import { SourceOpen } from "./KnowledgeSources";
import { today, uid } from "./model";
import { practiceNodes } from "./stretch-engine";
import { HARVEST_TYPES, harvestEntries, saveHarvest } from "./stretch-plans";
import { putFile } from "./files";

export function HarvestEditor({ data, save, plan, entry, close }) {
  const [draft, setDraft] = useState(() => ({
    id: entry?.legacy ? uid() : entry?.id || uid(),
    type: entry?.legacy ? "" : entry?.type || "",
    title: entry?.legacy ? "" : entry?.title || "",
    description: entry?.description || "",
    evidence: entry?.evidence || "",
    date: entry?.date || today(),
    knowledgeIds: entry?.knowledgeIds || plan.knowledgeIds || [],
    capacityIds: entry?.capacityIds || plan.capacityIds || [],
    resourceIds: entry?.resourceIds || [],
    createdAt: entry?.createdAt || new Date().toISOString(),
  }));
  const [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [resourceQuery, setResourceQuery] = useState(""),
    [busy, setBusy] = useState(false);
  const nodes = useMemo(() => practiceNodes(data), [data]);
  const patch = (value) => setDraft((d) => ({ ...d, ...value }));
  return (
    <Modal title={entry ? "Edit Harvest" : "Record a Harvest"} onClose={close}>
      <form
        className="stretch-editor"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            saveHarvest(data, plan.id, draft);
            save((d) => {
              const next = saveHarvest(d, plan.id, draft);
              return entry?.legacy
                ? {
                    ...next,
                    stretches: next.stretches.map((s) =>
                      s.id === plan.id ? { ...s, harvest: "" } : s,
                    ),
                  }
                : next;
            });
            close();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <p>
          Produced through <strong>{plan.title}</strong>. A completed activity
          can have no harvest, one harvest or several.
        </p>
        <Field label="Harvest type">
          <select
            required
            value={draft.type}
            onChange={(e) => patch({ type: e.target.value })}
          >
            <option value="">What kind of production?</option>
            {Object.entries(HARVEST_TYPES).map(([key, spec]) => (
              <option key={key} value={key}>
                {spec.name} Harvest
              </option>
            ))}
          </select>
        </Field>
        {draft.type && (
          <p className="stretch-harvest-purpose">
            {HARVEST_TYPES[draft.type].prompt}
            <br />
            <small>{HARVEST_TYPES[draft.type].destination}</small>
          </p>
        )}
        <Field label="Harvest title">
          <input
            required
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="A concise name for what was produced"
          />
        </Field>
        <Field label="What did this practice produce?">
          <textarea
            required
            rows={4}
            value={draft.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </Field>
        <Field label="Supporting evidence or reference">
          <textarea
            rows={3}
            value={draft.evidence}
            onChange={(e) => patch({ evidence: e.target.value })}
            placeholder="An observation, quote, measurement, timeframe, URL or explanation that supports this result"
          />
        </Field>
        <Field label="Harvest date">
          <input
            required
            type="date"
            value={draft.date}
            onChange={(e) => patch({ date: e.target.value })}
          />
        </Field>
        {draft.type === "capability" && (
          <CapacityPicker
            value={draft.capacityIds}
            onChange={(capacityIds) => patch({ capacityIds })}
          />
        )}
        {["knowledge", "insight"].includes(draft.type) && (
          <fieldset className="stretch-linked-knowledge">
            <legend>Return to Study</legend>
            <Field label="Find a Study source">
              <input value={query} onChange={(e) => setQuery(e.target.value)} />
            </Field>
            <Field label="Link Study source">
              <select
                value=""
                onChange={(e) =>
                  e.target.value &&
                  patch({
                    knowledgeIds: [
                      ...new Set([...draft.knowledgeIds, e.target.value]),
                    ],
                  })
                }
              >
                <option value="">Choose where this belongs</option>
                {nodes
                  .filter(
                    (n) =>
                      n.title.toLowerCase().includes(query.toLowerCase()) &&
                      !draft.knowledgeIds.includes(n.id),
                  )
                  .slice(0, 40)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
              </select>
            </Field>
            {draft.knowledgeIds.map((id) => (
              <div key={id}>
                {nodes.find((n) => n.id === id)?.title || "Unavailable source"}
                <Button
                  onClick={() =>
                    patch({
                      knowledgeIds: draft.knowledgeIds.filter((x) => x !== id),
                    })
                  }
                >
                  Remove source link
                </Button>
              </div>
            ))}
          </fieldset>
        )}
        <details className="stretch-plan-details">
          <summary>Attach an artifact or supporting resource</summary>
          <Field label="Search resource library">
            <input
              value={resourceQuery}
              onChange={(e) => setResourceQuery(e.target.value)}
            />
          </Field>
          <Field label="Attach resource">
            <select
              value=""
              onChange={(e) =>
                e.target.value &&
                patch({
                  resourceIds: [
                    ...new Set([...draft.resourceIds, e.target.value]),
                  ],
                })
              }
            >
              <option value="">Choose a library resource</option>
              {data.resources
                .filter(
                  (r) =>
                    r.title
                      .toLowerCase()
                      .includes(resourceQuery.toLowerCase()) &&
                    !draft.resourceIds.includes(r.id),
                )
                .slice(0, 40)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
            </select>
          </Field>
          {draft.resourceIds.map((id) => (
            <div key={id}>
              {data.resources.find((r) => r.id === id)?.title ||
                "Unavailable resource"}
              <Button
                onClick={() =>
                  patch({
                    resourceIds: draft.resourceIds.filter((x) => x !== id),
                  })
                }
              >
                Remove resource link
              </Button>
            </div>
          ))}
          <Field label="Upload a supporting file">
            <input
              type="file"
              disabled={busy}
              accept=".pdf,.txt,.md,audio/*,video/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                setError("");
                try {
                  if (file.size > 100 * 1024 * 1024)
                    throw Error("Use a file under 100 MB.");
                  const ext = file.name.split(".").pop().toLowerCase();
                  const kind =
                    ext === "pdf"
                      ? "pdf"
                      : ["txt", "md"].includes(ext)
                        ? "text"
                        : file.type.startsWith("audio/")
                          ? "audio"
                          : file.type.startsWith("video/")
                            ? "video"
                            : null;
                  if (!kind)
                    throw Error(
                      "Upload PDF, TXT, MD, audio or video, or reference another artifact by URL.",
                    );
                  const id = uid();
                  await putFile(id, file);
                  save((d) => ({
                    ...d,
                    resources: [
                      ...d.resources,
                      {
                        id,
                        title: file.name,
                        filename: file.name,
                        kind,
                        concepts: [],
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  }));
                  setDraft((d) => ({
                    ...d,
                    resourceIds: [...d.resourceIds, id],
                  }));
                } catch (err) {
                  setError(err.message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </Field>
          <small>Uploads are also kept in your resource library.</small>
        </details>
        {error && <p role="alert">{error}</p>}
        <div className="form-actions">
          <Button primary type="submit" disabled={busy}>
            Save Harvest
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function HarvestBoard({ data, save, onStudy, openHarvest, go }) {
  const [filter, setFilter] = useState(""),
    [query, setQuery] = useState("");
  const all = harvestEntries(data),
    entries = all.filter(
      (h) =>
        (!filter || h.type === filter) &&
        `${h.title} ${h.description} ${h.planTitle}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  const nodes = useMemo(() => practiceNodes(data), [data]);
  const gaps = (data.stretches || []).filter((s) => s.studyGap?.trim());
  return (
    <section className="stretch-harvest">
      <div className="stretch-section-heading">
        <div>
          <span className="eyebrow">EVIDENCE OF PRODUCTION</span>
          <h2>Harvest what your practice produced.</h2>
          <p>
            {all.length} recorded harvests. Completing a Stretch does not create
            a Harvest.
          </p>
        </div>
        <Button onClick={() => go("Barns")}>View Barns</Button>
      </div>
      <div className="form-grid">
        <Field label="Harvest category">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All harvests</option>
            {Object.entries(HARVEST_TYPES).map(([key, spec]) => (
              <option key={key} value={key}>
                {spec.name}
              </option>
            ))}
            <option value="legacy">Earlier harvests</option>
          </select>
        </Field>
        <Field label="Search harvests">
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
        </Field>
      </div>
      <Field label="Record production from a Stretch plan">
        <select
          value=""
          onChange={(e) => {
            const plan = data.stretches?.find((s) => s.id === e.target.value);
            if (plan) openHarvest(plan);
          }}
        >
          <option value="">Choose a plan to record a Harvest</option>
          {(data.stretches || []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </Field>
      {!entries.length && (
        <div className="card stretch-empty">
          <h3>No harvests in this view.</h3>
          <p>
            When practice produces knowledge, capability, an artifact, a result
            or another useful contribution, record it deliberately.
          </p>
        </div>
      )}
      <div className="stretch-harvest-grid">
        {entries.map((h) => (
          <article
            className="card stretch-harvest-card"
            key={`${h.planId}:${h.id}`}
          >
            <small>
              {HARVEST_TYPES[h.type]?.name || "Earlier"} Harvest · {h.date}
            </small>
            <h3>{h.title}</h3>
            <p>{h.description}</p>
            {h.evidence && (
              <>
                <h4>Supporting evidence</h4>
                <p>{h.evidence}</p>
              </>
            )}
            <small>Produced through: {h.planTitle}</small>
            {(h.resourceIds || []).map((id) => {
              const r = data.resources.find((r) => r.id === id);
              return r ? (
                <div key={id}>
                  <SourceOpen resource={r} />
                </div>
              ) : null;
            })}
            {["knowledge", "insight"].includes(h.type) &&
              (h.knowledgeIds || []).map((id) => (
                <Button
                  key={id}
                  disabled={!nodes.some((n) => n.id === id)}
                  onClick={() => onStudy(id)}
                >
                  Study:{" "}
                  {nodes.find((n) => n.id === id)?.title ||
                    "Unavailable source"}
                </Button>
              ))}
            {h.type === "capability" && (
              <Button onClick={() => go("Barns")}>
                View capacity evidence
              </Button>
            )}
            <Button
              onClick={() =>
                openHarvest(
                  data.stretches.find((s) => s.id === h.planId),
                  h,
                )
              }
            >
              {h.legacy ? "Classify earlier harvest" : "Edit Harvest"}
            </Button>
          </article>
        ))}
      </div>
      {!!gaps.length && (
        <details className="stretch-plan-details">
          <summary>
            Study feedback from attempts · separate from Harvest
          </summary>
          {gaps.map((s) => (
            <article key={s.id} className="stretch-study-gap">
              <h4>
                {s.gapResolved ? "Study gap addressed" : "Return to Study"} ·{" "}
                {s.title}
              </h4>
              <p>{s.studyGap}</p>
              {(s.knowledgeIds || [])
                .filter((id) => nodes.some((n) => n.id === id))
                .map((id) => (
                  <Button key={id} onClick={() => onStudy(id)}>
                    {nodes.find((n) => n.id === id)?.title}
                  </Button>
                ))}
              <Button
                onClick={() =>
                  save((d) => ({
                    ...d,
                    stretches: d.stretches.map((r) =>
                      r.id === s.id ? { ...r, gapResolved: !r.gapResolved } : r,
                    ),
                  }))
                }
              >
                {s.gapResolved ? "Reopen gap" : "Mark gap addressed"}
              </Button>
            </article>
          ))}
        </details>
      )}
    </section>
  );
}
