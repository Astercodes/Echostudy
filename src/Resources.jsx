import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Plus,
  BookOpen,
  FileText,
  Headphones,
  Video,
  Link,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Highlighter,
  NotebookPen,
  ExternalLink,
  Search,
} from "lucide-react";
import { uid, COLORS, DOMAINS } from "./model";
import { putFile, getFile } from "./files";
import { Button, Badge, Modal, Field, GoalSelect } from "./App";
import "./pdf-text-layer.css";
import { ResourceTrace } from "./KnowledgeSources";
const pdfEngine = () =>
  import("pdfjs-dist").then(async (p) => {
    p.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).href;
    return p;
  });
export default function Resources({ data, save, notify }) {
  const [add, setAdd] = useState(false),
    [selected, setSelected] = useState(null),
    [query, setQuery] = useState(""),
    [note, setNote] = useState(null),
    [tab, setTab] = useState("resources");
  const resource = data.resources.find((r) => r.id === selected);
  return (
    <>
      {resource ? (
        <Reader
          resource={resource}
          data={data}
          save={save}
          back={() => setSelected(null)}
          notify={notify}
          addNote={setNote}
        />
      ) : (
        <>
          <div className="knowledge-toolbar">
            <div className="segmented">
              <button
                className={tab === "resources" ? "active" : ""}
                onClick={() => setTab("resources")}
              >
                <BookOpen size={16} />
                Resources <span>{data.resources.length}</span>
              </button>
              <button
                className={tab === "notes" ? "active" : ""}
                onClick={() => setTab("notes")}
              >
                <NotebookPen size={16} />
                Permanent notes <span>{data.notes.length}</span>
              </button>
            </div>
            <div className="row-actions">
              <div className="search">
                <Search size={16} />
                <input
                  aria-label="Search resources or notes"
                  placeholder="Find in your library…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={() =>
                  setNote({
                    id: uid(),
                    text: "",
                    quote: "",
                    concepts: [],
                    resourceId: "",
                  })
                }
              >
                <Plus size={16} />
                New note
              </Button>
              <Button primary onClick={() => setAdd(true)}>
                <Upload size={16} />
                Add resource
              </Button>
            </div>
          </div>
          {tab === "resources" ? (
            <>
              <div className="library-banner">
                <BookOpen size={35} />
                <div>
                  <h2>Collect less. Connect more.</h2>
                  <p>
                    A resource becomes knowledge when you give it context. Link
                    it to a goal and an idea.
                  </p>
                </div>
              </div>
              <div className="resource-grid">
                {data.resources
                  .filter((r) =>
                    r.title.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((r, i) => {
                    const Icon =
                      r.kind === "audio"
                        ? Headphones
                        : r.kind === "video"
                          ? Video
                          : r.kind === "url"
                            ? Link
                            : FileText;
                    return (
                      <button
                        className="card resource-card"
                        key={r.id}
                        onClick={() => setSelected(r.id)}
                      >
                        <div className={"resource-cover cover-" + (i % 3)}>
                          <Icon size={40} strokeWidth={1.2} />
                          <span>{r.kind.toUpperCase()}</span>
                          <h3>{r.title}</h3>
                        </div>
                        <div className="resource-info">
                          <Badge
                            color={
                              COLORS[
                                data.concepts.find(
                                  (c) => c.id === r.concepts?.[0],
                                )?.domain || 0
                              ]
                            }
                          >
                            {data.concepts.find((c) => c.id === r.concepts?.[0])
                              ?.title || "Unfiled resource"}
                          </Badge>
                          <h3>{r.title}</h3>
                          <small>
                            {
                              data.notes.filter((n) => n.resourceId === r.id)
                                .length
                            }{" "}
                            notes & highlights · Open to study
                          </small>
                        </div>
                      </button>
                    );
                  })}
              </div>
              {!data.resources.length && (
                <section className="card empty">
                  <BookOpen size={36} />
                  <h2>Your next insight is waiting.</h2>
                  <p>
                    Add a PDF, text, audio, video, or web link.
                    <br />
                    Read here, save highlights, and connect your notes.
                  </p>
                  <Button primary onClick={() => setAdd(true)}>
                    <Upload size={16} />
                    Add your first resource
                  </Button>
                </section>
              )}
            </>
          ) : (
            <div className="notes-grid">
              {data.notes
                .filter((n) =>
                  (n.text + " " + n.quote)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((n) => (
                  <button
                    className="card note-card"
                    key={n.id}
                    onClick={() => setNote(n)}
                  >
                    {n.quote && (
                      <blockquote>
                        <mark>{n.quote}</mark>
                      </blockquote>
                    )}
                    <p className="prewrap">{n.text}</p>
                    <div className="tag-list">
                      {n.concepts.map((id) => (
                        <Badge key={id}>
                          {data.concepts.find((c) => c.id === id)?.title}
                        </Badge>
                      ))}
                    </div>
                    <small>
                      {data.resources.find((r) => r.id === n.resourceId)
                        ?.title || "Permanent note"}
                      {n.page ? " · Page " + n.page : ""}
                    </small>
                  </button>
                ))}
              {!data.notes.length && (
                <div className="empty">
                  <NotebookPen size={32} />
                  <h3>Give an insight a home.</h3>
                  <p>Create a note or save a highlight from a resource.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {add && (
        <AddResource
          data={data}
          close={() => setAdd(false)}
          notify={notify}
          submit={(r) => {
            save((d) => ({ ...d, resources: [...d.resources, r] }));
            setAdd(false);
            setSelected(r.id);
            notify("Resource added to your library.");
          }}
        />
      )}
      {note && (
        <NoteModal
          note={note}
          data={data}
          close={() => setNote(null)}
          submit={(n) => {
            save((d) => ({
              ...d,
              notes: [
                ...d.notes.filter((x) => x.id !== n.id),
                { ...n, updatedAt: new Date().toISOString() },
              ],
            }));
            setNote(null);
            notify("Insight saved and connected.");
          }}
        />
      )}
    </>
  );
}
function AddResource({ data, close, submit, notify }) {
  const [r, setR] = useState({
      id: uid(),
      title: "",
      kind: "pdf",
      concepts: [],
      goalId: "",
      url: "",
    }),
    [file, setFile] = useState(null),
    [mode, setMode] = useState("file"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal title="Bring a resource into your world" onClose={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            let value = { ...r, createdAt: new Date().toISOString() };
            if (mode === "file") {
              if (!file) throw Error("Choose a file first.");
              if (file.size > 100 * 1024 * 1024)
                throw Error("Use a file under 100 MB.");
              const ext = file.name.split(".").pop().toLowerCase();
              value.kind =
                ext === "pdf"
                  ? "pdf"
                  : ["txt", "md"].includes(ext)
                    ? "text"
                    : file.type.startsWith("audio/")
                      ? "audio"
                      : file.type.startsWith("video/")
                        ? "video"
                        : null;
              if (!value.kind)
                throw Error("Use PDF, TXT, MD, audio, or video.");
              await putFile(r.id, file);
              value.filename = file.name;
            } else {
              const url = new URL(r.url);
              if (!["https:", "http:"].includes(url.protocol))
                throw Error("Use a valid HTTPS or HTTP link.");
              value.kind = "url";
              value.url = url.href;
            }
            submit(value);
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="segmented">
          <button
            type="button"
            className={mode === "file" ? "active" : ""}
            onClick={() => setMode("file")}
          >
            Upload a file
          </button>
          <button
            type="button"
            className={mode === "url" ? "active" : ""}
            onClick={() => setMode("url")}
          >
            Save a web link
          </button>
        </div>
        {mode === "file" ? (
          <Field label="PDF, text, audio or video · up to 100 MB">
            <input
              type="file"
              accept=".pdf,.txt,.md,audio/*,video/*"
              required
              onChange={(e) => {
                const f = e.target.files[0];
                setFile(f);
                if (f)
                  setR({
                    ...r,
                    title: r.title || f.name.replace(/\.[^.]+$/, ""),
                  });
              }}
            />
          </Field>
        ) : (
          <Field label="Resource URL">
            <input
              type="url"
              required
              placeholder="https://…"
              value={r.url}
              onChange={(e) => setR({ ...r, url: e.target.value })}
            />
          </Field>
        )}
        <Field label="Title">
          <input
            required
            value={r.title}
            onChange={(e) => setR({ ...r, title: e.target.value })}
          />
        </Field>
        <Field label="Contributes to a goal">
          <GoalSelect
            goals={data.goals}
            value={r.goalId}
            onChange={(v) => setR({ ...r, goalId: v })}
          />
        </Field>
        <Field label="Where does this knowledge belong?">
          <ConceptChecks
            concepts={data.concepts}
            value={r.concepts}
            change={(v) => setR({ ...r, concepts: v })}
          />
        </Field>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button primary disabled={busy} type="submit">
            {busy ? "Saving…" : "Add to library"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function ConceptChecks({ concepts, value, change }) {
  return (
    <div className="checkbox-list">
      {concepts
        .filter((c) => c.parent)
        .map((c) => (
          <label key={c.id}>
            <input
              type="checkbox"
              checked={value.includes(c.id)}
              onChange={(e) =>
                change(
                  e.target.checked
                    ? [...value, c.id]
                    : value.filter((id) => id !== c.id),
                )
              }
            />
            {c.title}
          </label>
        ))}
    </div>
  );
}
function NoteModal({ note, data, close, submit }) {
  const [n, setN] = useState(note);
  return (
    <Modal
      title={
        n.quote ? "Where does this insight belong?" : "Create a permanent note"
      }
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (n.text.trim() || n.quote.trim()) submit(n);
        }}
      >
        {n.quote && (
          <blockquote className="highlight-quote">{n.quote}</blockquote>
        )}
        <Field label="Explain the idea in your own words">
          <textarea
            required
            value={n.text}
            onChange={(e) => setN({ ...n, text: e.target.value })}
            placeholder="What does this mean? Why does it matter?"
          />
        </Field>
        <Field label="Connect to concepts">
          <ConceptChecks
            concepts={data.concepts}
            value={n.concepts}
            change={(v) => setN({ ...n, concepts: v })}
          />
        </Field>
        <div className="form-actions">
          <Button primary type="submit">
            Save connected note
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function Reader({ resource: r, data, save, back, notify, addNote }) {
  const [file, setFile] = useState(null),
    [url, setUrl] = useState(""),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [missing, setMissing] = useState(false),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(1),
    [doc, setDoc] = useState(null),
    [selection, setSelection] = useState(null),
    [loading, setLoading] = useState(true);
  const canvas = useRef(),
    layer = useRef(),
    surface = useRef(),
    textRef = useRef();
  const notes = data.notes.filter((n) => n.resourceId === r.id);
  useEffect(() => {
    let active = true,
      blobUrl,
      pdfTask,
      pdfDoc;
    setLoading(true);
    setMissing(false);
    setError("");
    (async () => {
      try {
        if (r.kind === "url") {
          setLoading(false);
          return;
        }
        const f = await getFile(r.id);
        if (!active) return;
        if (!f) {
          setMissing(true);
          setLoading(false);
          return;
        }
        setFile(f);
        blobUrl = URL.createObjectURL(f);
        setUrl(blobUrl);
        if (r.kind === "text") setText(await f.text());
        if (r.kind === "pdf") {
          const p = await pdfEngine();
          pdfTask = p.getDocument({
            data: new Uint8Array(await f.arrayBuffer()),
            isEvalSupported: false,
          });
          pdfDoc = await pdfTask.promise;
          if (active) {
            setDoc(pdfDoc);
            setTotal(pdfDoc.numPages);
          }
        }
        if (active) setLoading(false);
      } catch (e) {
        if (active) {
          setError("Could not read this resource. " + e.message);
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      pdfTask?.destroy();
    };
  }, [r.id, missing]);
  useEffect(() => {
    if (!doc || r.kind !== "pdf") return;
    let cancelled = false,
      renderTask,
      textLayer;
    setSelection(null);
    (async () => {
      try {
        const p = await doc.getPage(page);
        if (cancelled) return;
        const viewport = p.getViewport({ scale: 1.25 });
        const el = canvas.current;
        if (!el) return;
        el.width = viewport.width;
        el.height = viewport.height;
        const host = surface.current;
        host.style.width = viewport.width + "px";
        host.style.height = viewport.height + "px";
        host.style.setProperty("--scale-factor", "1.25");
        host.style.setProperty("--total-scale-factor", "1.25");
        renderTask = p.render({ canvasContext: el.getContext("2d"), viewport });
        await renderTask.promise;
        if (cancelled) return;
        const pdf = await pdfEngine();
        layer.current.replaceChildren();
        textLayer = new pdf.TextLayer({
          textContentSource: await p.getTextContent(),
          container: layer.current,
          viewport,
        });
        await textLayer.render();
      } catch (e) {
        if (!cancelled && e.name !== "RenderingCancelledException")
          setError("Page could not be displayed: " + e.message);
      }
    })();
    return () => {
      cancelled = true;
      renderTask?.cancel();
      textLayer?.cancel();
    };
  }, [doc, page]);
  const capture = () => {
    const s = window.getSelection();
    const host = r.kind === "pdf" ? surface.current : textRef.current;
    if (
      !s?.rangeCount ||
      !host ||
      !host.contains(s.anchorNode) ||
      !host.contains(s.focusNode) ||
      !s.toString().trim()
    ) {
      setSelection(null);
      return;
    }
    const rect = host.getBoundingClientRect();
    const rects = [...s.getRangeAt(0).getClientRects()]
      .filter((x) => x.width > 0)
      .map((x) => ({
        x: (x.left - rect.left) / rect.width,
        y: (x.top - rect.top) / rect.height,
        w: x.width / rect.width,
        h: x.height / rect.height,
      }));
    setSelection({ quote: s.toString().slice(0, 12000), rects });
  };
  const create = () =>
    addNote({
      id: uid(),
      resourceId: r.id,
      quote: selection?.quote || "",
      rects: selection?.rects || [],
      page: r.kind === "pdf" ? page : null,
      text: "",
      concepts: r.concepts || [],
    });
  return (
    <div className="reader">
      <div className="reader-toolbar">
        <button className="text-btn" onClick={back}>
          <ArrowLeft size={17} />
          Library
        </button>
        <strong>{r.title}</strong>
        <div className="row-actions">
          {r.kind === "pdf" && (
            <>
              <button
                className="icon-btn"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={17} />
              </button>
              <span>
                {page} / {total}
              </span>
              <button
                className="icon-btn"
                aria-label="Next page"
                disabled={page >= total}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={17} />
              </button>
            </>
          )}
          <Button onClick={create}>
            {selection ? <Highlighter size={16} /> : <NotebookPen size={16} />}{" "}
            {selection ? "Save highlight" : "Add note"}
          </Button>
        </div>
      </div>
      <ResourceTrace resource={r} data={data} />
      <div className="reader-layout">
        <section className="reading-pane">
          {loading && <div className="empty">Opening your resource…</div>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {missing && (
            <div className="empty">
              <FileText />
              <h3>Reattach your original file</h3>
              <p>
                This device has the resource details, but not the uploaded file.
              </p>
              <input
                aria-label="Reattach original resource"
                type="file"
                onChange={async (e) => {
                  const f = e.target.files[0];
                  if (f) {
                    await putFile(r.id, f);
                    setMissing(false);
                    notify("Original file reattached.");
                  }
                }}
              />
            </div>
          )}
          {r.kind === "pdf" && !missing && (
            <div className="pdf-scroll">
              <div
                className="pdf-page"
                ref={surface}
                onMouseUp={capture}
                onTouchEnd={capture}
              >
                <canvas ref={canvas} />
                <div className="textLayer" ref={layer} />
                <div className="saved-highlights">
                  {notes
                    .filter((n) => n.page === page)
                    .flatMap((n) =>
                      (n.rects || []).map((rect, i) => (
                        <span
                          key={n.id + i}
                          title={n.quote}
                          style={{
                            left: rect.x * 100 + "%",
                            top: rect.y * 100 + "%",
                            width: rect.w * 100 + "%",
                            height: rect.h * 100 + "%",
                          }}
                        />
                      )),
                    )}
                </div>
              </div>
            </div>
          )}
          {r.kind === "text" && !missing && (
            <article
              className="text-document"
              ref={textRef}
              onMouseUp={capture}
            >
              <h2>{r.title}</h2>
              <div className="prewrap">{text}</div>
            </article>
          )}
          {r.kind === "audio" && url && (
            <div className="empty">
              <Headphones size={50} />
              <h2>{r.title}</h2>
              <audio controls src={url} />
            </div>
          )}
          {r.kind === "video" && url && <video controls src={url} />}
          {r.kind === "url" && (
            <div className="empty">
              <ExternalLink size={36} />
              <h2>Read at the source.</h2>
              <p>
                Open the original article or lecture, then capture and connect
                your notes here.
              </p>
              <a
                className="btn primary"
                href={/^https?:\/\//i.test(r.url) ? r.url : "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open resource <ExternalLink size={16} />
              </a>
            </div>
          )}
        </section>
        <aside className="card reader-notes">
          <h2>Your margin of thought</h2>
          <p>
            Select text in a PDF or text document, then save it as a connected
            highlight.
          </p>
          <Field label="Linked goal">
            <GoalSelect
              goals={data.goals}
              value={r.goalId}
              onChange={(v) =>
                save((d) => ({
                  ...d,
                  resources: d.resources.map((x) =>
                    x.id === r.id ? { ...x, goalId: v } : x,
                  ),
                }))
              }
            />
          </Field>
          <Field label="Knowledge branches">
            <ConceptChecks
              concepts={data.concepts}
              value={r.concepts || []}
              change={(v) =>
                save((d) => ({
                  ...d,
                  resources: d.resources.map((x) =>
                    x.id === r.id ? { ...x, concepts: v } : x,
                  ),
                }))
              }
            />
          </Field>
          <hr />
          {notes.map((n) => (
            <button
              className="reader-note"
              key={n.id}
              onClick={() => addNote(n)}
            >
              {n.page && <small>PAGE {n.page}</small>}
              {n.quote && (
                <blockquote>
                  <mark>{n.quote}</mark>
                </blockquote>
              )}
              <p className="prewrap">{n.text}</p>
              <div className="tag-list">
                {n.concepts.map((id) => (
                  <Badge key={id}>
                    {data.concepts.find((c) => c.id === id)?.title}
                  </Badge>
                ))}
              </div>
            </button>
          ))}
          {!notes.length && (
            <p className="muted">
              Your insights will gather here, with connections back to your
              knowledge tree.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
