import React, { createContext, useContext, useEffect, useState } from "react";
import { putFile, getFile } from "./files";
import { knowledgeEntries, knowledgeLineage } from "./knowledge-tree";
import "./knowledge-notebook.css";

export const KnowledgeSourceContext = createContext(null);

export function SourceOpen({ resource }) {
  const [url, setUrl] = useState(""),
    [error, setError] = useState("");
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  if (resource.url && /^https?:\/\//i.test(resource.url))
    return (
      <a href={resource.url} target="_blank" rel="noreferrer">
        Open source ↗
      </a>
    );
  return (
    <span>
      <button
        type="button"
        onClick={async () => {
          try {
            const blob = await getFile(resource.id);
            if (!blob)
              throw Error(
                "This file is not available in this browser. Restore it in the resource library.",
              );
            const type =
              resource.kind === "text"
                ? "text/plain"
                : resource.kind === "pdf"
                  ? "application/pdf"
                  : /^(audio|video)\//.test(blob.type)
                    ? blob.type
                    : "application/octet-stream";
            setUrl(URL.createObjectURL(new Blob([blob], { type })));
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        Prepare file
      </button>
      {url && (
        <a href={url} target="_blank" rel="noreferrer">
          Open file ↗
        </a>
      )}
      {error && <small role="alert">{error}</small>}
    </span>
  );
}

// References live with the library resource, not as extra nodes on the map.
export default function KnowledgeSources({ scope, label }) {
  const context = useContext(KnowledgeSourceContext);
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState("");
  const [title, setTitle] = useState(""),
    [url, setUrl] = useState("");
  const [locator, setLocator] = useState(""),
    [citation, setCitation] = useState("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (!context?.node) return null;
  const { data, save, node, action } = context;
  const key = `${node.id}|${scope}`;
  const linked = data.resources.flatMap((r) =>
    (r.knowledgeRefs || [])
      .filter((ref) => ref.key === key)
      .map((ref) => ({ r, ref })),
  );
  const attach = (resource) => {
    const ref = {
      id: crypto.randomUUID(),
      key,
      nodeId: node.id,
      action: action === "isolate" ? "pluck" : action || "content",
      component: label,
      scope,
      locator: locator.trim(),
      citation: citation.trim(),
      lineage: knowledgeLineage(data, node).path,
      createdAt: new Date().toISOString(),
    };
    save((d) => {
      const current = d.resources.find((r) => r.id === resource.id) || resource;
      return {
        ...d,
        resources: [
          ...d.resources.filter((r) => r.id !== resource.id),
          {
            ...current,
            concepts: [...new Set([...(current.concepts || []), node.id])],
            knowledgeRefs: [...(current.knowledgeRefs || []), ref],
          },
        ],
      };
    });
    setSelected("");
    setLocator("");
    setCitation("");
    setError("");
  };
  const patch = (r, ref, changes) =>
    save((d) => ({
      ...d,
      resources: d.resources.map((v) =>
        v.id !== r.id
          ? v
          : {
              ...v,
              knowledgeRefs: v.knowledgeRefs.map((x) =>
                x.id === ref.id ? { ...x, ...changes } : x,
              ),
            },
      ),
    }));
  return (
    <details className="knowledge-sources">
      <summary>
        Learning resources · {linked.length} reference
        {linked.length === 1 ? "" : "s"}
      </summary>
      <p>
        Sources for {label}. Link a library item or add a file or web resource.
        References save immediately.
      </p>
      {linked.map(({ r, ref }) => (
        <article key={ref.id} className="source-reference">
          <strong>{r.title}</strong>
          <SourceOpen resource={r} />
          <label>
            Page, chapter or timestamp
            <input
              value={ref.locator || ""}
              onChange={(e) => patch(r, ref, { locator: e.target.value })}
            />
          </label>
          <label>
            Citation / author / publication / evidence note
            <textarea
              rows={2}
              value={ref.citation || ""}
              onChange={(e) => patch(r, ref, { citation: e.target.value })}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              save((d) => ({
                ...d,
                resources: d.resources.map((v) =>
                  v.id !== r.id
                    ? v
                    : {
                        ...v,
                        knowledgeRefs: v.knowledgeRefs.filter(
                          (x) => x.id !== ref.id,
                        ),
                      },
                ),
              }))
            }
          >
            Unlink this reference
          </button>
        </article>
      ))}
      <label>
        Find library resource
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books, reports, videos…"
        />
      </label>
      <label>
        Library resource
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Choose a resource</option>
          {data.resources
            .filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
        </select>
      </label>
      <label>
        Page, chapter or timestamp for new reference
        <input
          value={locator}
          onChange={(e) => setLocator(e.target.value)}
          placeholder="Chapter 3, pp. 24–28, or 12:40–15:10"
        />
      </label>
      <label>
        Citation or evidence note for new reference
        <input
          value={citation}
          onChange={(e) => setCitation(e.target.value)}
          placeholder="Author, year, edition, and why this source matters"
        />
      </label>
      <button
        type="button"
        className="btn"
        disabled={!selected}
        onClick={() => attach(data.resources.find((r) => r.id === selected))}
      >
        Link library resource
      </button>
      <details>
        <summary>Upload or add a web resource</summary>
        <label>
          Resource title
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Upload PDF, text, audio or video
          <input
            type="file"
            disabled={busy}
            accept=".pdf,.txt,.md,audio/*,video/*"
            onChange={async (e) => {
              const file = e.target.files[0];
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
                if (!kind) throw Error("Use PDF, TXT, MD, audio or video.");
                const id = crypto.randomUUID();
                await putFile(id, file);
                attach({
                  id,
                  title: title.trim() || file.name,
                  filename: file.name,
                  kind,
                  createdAt: new Date().toISOString(),
                });
                setTitle("");
              } catch (err) {
                setError(err.message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        <label>
          Web / YouTube / report URL
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <button
          type="button"
          className="btn"
          disabled={busy || !url.trim()}
          onClick={() => {
            try {
              const parsed = new URL(url);
              if (!["http:", "https:"].includes(parsed.protocol))
                throw Error("Use an HTTP or HTTPS URL.");
              const existing = data.resources.find(
                (r) => r.url === parsed.href,
              );
              attach(
                existing || {
                  id: crypto.randomUUID(),
                  title: title.trim() || parsed.hostname,
                  url: parsed.href,
                  kind: "url",
                  createdAt: new Date().toISOString(),
                },
              );
              setUrl("");
              setTitle("");
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          Save & link web resource
        </button>
      </details>
      {busy && <p role="status">Saving file…</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </details>
  );
}

export function ResourceTrace({ resource, data }) {
  const entries = knowledgeEntries(data);
  if (!resource.knowledgeRefs?.length) return null;
  return (
    <details className="knowledge-sources">
      <summary>
        Referenced in the ecosystem · {resource.knowledgeRefs.length}
      </summary>
      {resource.knowledgeRefs.map((ref) => {
        const node = entries.find((n) => n.id === ref.nodeId);
        return (
          <article className="source-reference" key={ref.id}>
            <strong>
              {node ? knowledgeLineage(data, node).path : ref.lineage}
            </strong>
            <p>
              {ref.action} → {ref.component}
            </p>
            <p>{ref.locator}</p>
            <p>{ref.citation}</p>
          </article>
        );
      })}
    </details>
  );
}
