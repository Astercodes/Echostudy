import React, { createContext, useContext, useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Check,
  X,
  FileText,
  Video,
  Headphones,
  Link2,
  Upload,
  Pencil,
} from "lucide-react";
import { putFile, getFile } from "./files";
import { knowledgeEntries, knowledgeLineage } from "./knowledge-tree";
import {
  attachReference,
  matchesReference,
  updateReference,
} from "./source-references";
import "./knowledge-notebook.css";
export const KnowledgeSourceContext = createContext(null);
const SourceIcon = ({ kind, ...props }) => {
  const Icon =
    kind === "video"
      ? Video
      : kind === "audio"
        ? Headphones
        : kind === "url"
          ? Link2
          : FileText;
  return <Icon {...props} />;
};
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
    <span className="source-file-open">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          Open file ↗
        </a>
      ) : (
        <button
          type="button"
          onClick={async () => {
            try {
              const blob = await getFile(resource.id);
              if (!blob)
                throw Error(
                  "File unavailable in this browser. Restore it in the resource library.",
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
          Prepare file ↗
        </button>
      )}
      {error && <small role="alert">{error}</small>}
    </span>
  );
}
export default function KnowledgeSources({ scope, label }) {
  const context = useContext(KnowledgeSourceContext);
  const [picker, setPicker] = useState(null),
    [query, setQuery] = useState("");
  const [limit, setLimit] = useState(8),
    [editing, setEditing] = useState(null);
  const [title, setTitle] = useState(""),
    [url, setUrl] = useState("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  if (!context?.node) return null;
  const { data, save, node, action } = context;
  const linked = data.resources.flatMap((r) =>
    (r.knowledgeRefs || [])
      .filter((ref) => matchesReference(ref, node.id, scope))
      .map((ref) => ({ r, ref })),
  );
  const results = data.resources.filter((r) =>
    r.title.toLowerCase().includes(query.toLowerCase()),
  );
  const attach = (resource) => {
    const existing = linked.find(({ r }) => r.id === resource.id)?.ref;
    const reference = {
      id: crypto.randomUUID(),
      key: `${node.id}|${scope}`,
      scope,
      nodeId: node.id,
      action: action === "isolate" ? "pluck" : action || "content",
      component: label,
      locator: "",
      citation: "",
      lineage: knowledgeLineage(data, node).path,
      createdAt: new Date().toISOString(),
    };
    save((d) => attachReference(d, resource, reference));
    setEditing(existing?.id || reference.id);
    setPicker(null);
    setError("");
    setMessage(
      existing
        ? "Already attached. Edit its reference below."
        : `${resource.title} attached.`,
    );
  };
  return (
    <aside className="source-workbench" aria-label={`Sources for ${label}`}>
      <header className="source-panel-heading">
        <span className="source-panel-icon">
          <BookOpen size={18} />
        </span>
        <div>
          <h4>
            Sources <span>{linked.length}</span>
          </h4>
          <small>
            For this{" "}
            {action === "content" || action === "isolate"
              ? "content"
              : "component"}
          </small>
        </div>
        <button
          type="button"
          className="source-add"
          aria-label={`Add source for ${label}`}
          aria-expanded={Boolean(picker)}
          onClick={() => setPicker(picker ? null : "library")}
        >
          <Plus size={15} /> Add
        </button>
      </header>
      <p className="source-save-hint">
        <Check size={13} /> Attachments & reference details save as you edit.
      </p>
      {message && (
        <p className="source-status" role="status">
          {message}
        </p>
      )}
      {picker && (
        <section className="source-picker" aria-label="Choose a source">
          <div className="source-picker-heading">
            <strong>Add learning material</strong>
            <button
              type="button"
              aria-label="Close source picker"
              onClick={() => setPicker(null)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="source-tabs" role="tablist" aria-label="Source type">
            {[
              ["library", "Library", BookOpen],
              ["upload", "Upload", Upload],
              ["link", "Web link", Link2],
            ].map(([key, name, Icon]) => (
              <button
                type="button"
                role="tab"
                aria-selected={picker === key}
                key={key}
                onClick={() => {
                  setPicker(key);
                  setError("");
                }}
              >
                <Icon size={14} />
                {name}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            aria-label={
              picker === "library"
                ? "Library sources"
                : picker === "upload"
                  ? "Upload source"
                  : "Web source"
            }
          >
            {picker === "library" ? (
              <>
                <label className="source-search">
                  <Search size={15} />
                  <input
                    aria-label="Search library sources"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setLimit(8);
                    }}
                    placeholder="Find a book, report, video…"
                  />
                </label>
                <p className="source-picker-help">
                  Choose a resource to attach it immediately.
                </p>
                <div className="source-library-results">
                  {results.slice(0, limit).map((r) => {
                    const attached = linked.some((item) => item.r.id === r.id);
                    return (
                      <button
                        type="button"
                        className="source-library-item"
                        key={r.id}
                        aria-label={`${attached ? "Edit reference for" : "Attach"} ${r.title}`}
                        onClick={() => attach(r)}
                      >
                        <SourceIcon kind={r.kind} size={18} />
                        <span>
                          <strong>{r.title}</strong>
                          <small>
                            {r.kind.toUpperCase()}
                            {attached ? " · Attached" : ""}
                          </small>
                        </span>
                        {attached ? <Check size={15} /> : <Plus size={15} />}
                      </button>
                    );
                  })}
                </div>
                {!results.length && (
                  <p className="source-empty">
                    {query
                      ? "No matching resources. Try another title."
                      : "Your library is empty. Upload a file or add a web link."}
                  </p>
                )}
                {results.length > limit && (
                  <button
                    type="button"
                    className="source-secondary"
                    onClick={() => setLimit(limit + 8)}
                  >
                    Show more resources
                  </button>
                )}
              </>
            ) : (
              <>
                <label>
                  Resource title{" "}
                  <span className="source-optional">optional</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give this source a useful name"
                  />
                </label>
                {picker === "upload" ? (
                  <label className="source-upload">
                    <Upload size={25} />
                    <strong>Choose a learning resource</strong>
                    <small>PDF, TXT, MD, audio or video · up to 100 MB</small>
                    <input
                      aria-label="Upload learning resource"
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
                          if (!kind)
                            throw Error("Use PDF, TXT, MD, audio or video.");
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
                ) : (
                  <>
                    <label>
                      Web address
                      <input
                        aria-label="Web resource URL"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://…"
                      />
                    </label>
                    <p className="source-picker-help">
                      Articles, YouTube videos, online books and reports.
                    </p>
                    <button
                      type="button"
                      className="source-primary"
                      disabled={!url.trim()}
                      onClick={() => {
                        try {
                          const parsed = new URL(url);
                          if (!["http:", "https:"].includes(parsed.protocol))
                            throw Error("Use an HTTP or HTTPS address.");
                          attach(
                            data.resources.find(
                              (r) => r.url === parsed.href,
                            ) || {
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
                      Attach web resource
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          {busy && <p role="status">Uploading and attaching…</p>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
      )}
      {!linked.length && !picker && (
        <div className="source-empty">
          <BookOpen size={24} />
          <strong>Give your notes a source</strong>
          <p>Keep the reading, evidence and page references together.</p>
          <button
            type="button"
            className="source-secondary"
            onClick={() => setPicker("library")}
          >
            Choose from library
          </button>
        </div>
      )}
      <div className="source-card-list">
        {linked.map(({ r, ref }) => (
          <article key={ref.id} className="source-card">
            <div className="source-card-title">
              <span className="source-type-icon">
                <SourceIcon kind={r.kind} size={18} />
              </span>
              <div>
                <small>{r.kind.toUpperCase()}</small>
                <h5>{r.title}</h5>
              </div>
            </div>
            {ref.locator && (
              <p className="source-location">
                <BookOpen size={13} />
                {ref.locator}
              </p>
            )}
            {ref.citation && editing !== ref.id && (
              <p className="source-citation">{ref.citation}</p>
            )}
            <div className="source-card-actions">
              <SourceOpen resource={r} />
              <button
                type="button"
                aria-label={`Edit reference for ${r.title}`}
                aria-expanded={editing === ref.id}
                onClick={() => setEditing(editing === ref.id ? null : ref.id)}
              >
                <Pencil size={12} /> Reference
              </button>
            </div>
            {editing === ref.id && (
              <div className="source-reference-editor">
                <label>
                  Pages / chapter / timestamp
                  <input
                    aria-label={`Reference location for ${r.title}`}
                    value={ref.locator || ""}
                    placeholder="e.g. pp. 24–28 or 12:40–15:10"
                    onChange={(e) =>
                      save((d) =>
                        updateReference(d, r.id, ref.id, {
                          locator: e.target.value,
                        }),
                      )
                    }
                  />
                </label>
                <label>
                  Citation & evidence note
                  <textarea
                    aria-label={`Citation for ${r.title}`}
                    rows={3}
                    value={ref.citation || ""}
                    placeholder="Author, year, edition, or why this source matters"
                    onChange={(e) =>
                      save((d) =>
                        updateReference(d, r.id, ref.id, {
                          citation: e.target.value,
                        }),
                      )
                    }
                  />
                </label>
                <div className="source-edit-footer">
                  <button
                    type="button"
                    className="source-unlink"
                    onClick={() => {
                      save((d) => ({
                        ...d,
                        resources: d.resources.map((v) =>
                          v.id === r.id
                            ? {
                                ...v,
                                knowledgeRefs: (v.knowledgeRefs || []).filter(
                                  (x) => x.id !== ref.id,
                                ),
                              }
                            : v,
                        ),
                      }));
                      setMessage(
                        "Reference removed. The resource remains in your library.",
                      );
                    }}
                  >
                    Remove attachment
                  </button>
                  <button
                    type="button"
                    className="source-secondary"
                    onClick={() => setEditing(null)}
                  >
                    Done editing
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </aside>
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
