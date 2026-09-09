import React, { useState } from "react";
import { Modal, Field, Button } from "./App";
import { VoiceField } from "./VoiceField";
import ActionComponents from "./ActionComponents";

export default function KnowledgePlant({
  node,
  data,
  grow = false,
  close,
  submit,
  persist,
}) {
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    excerpt: "",
    areaId: node.areaId || data.lifeAreas[0].id,
    subAreaId: node.subAreaId || "",
    parent: ["life-area", "sub-area"].includes(node.kind) ? "" : node.id,
    newTreeName: "",
  });
  const [destination, setDestination] = useState("existing"),
    [error, setError] = useState("");
  const area = data.lifeAreas.find((a) => a.id === draft.areaId);
  const change = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  return (
    <Modal
      title={(grow ? "Grow seed · " : "Plant · ") + node.title}
      onClose={close}
    >
      <p>
        {grow
          ? "Let this question grow into independent knowledge or a topic tree within a grove. Its source stays attached; your life-area catalog stays unchanged."
          : "Knowledge produces questions. Select a passage below, then name the question or idea you want to plant. The source remains untouched."}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            submit({
              ...draft,
              components: node.learning?.plant?.components || {},
              newTreeName: destination === "new" ? draft.newTreeName : "",
            });
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        {!grow && (
          <>
            <ActionComponents
              mode="plant"
              scope={node.id + ":plant"}
              values={node.learning?.plant?.components}
              onChange={(components) =>
                persist({
                  learning: {
                    ...node.learning,
                    plant: { ...node.learning?.plant, components },
                  },
                })
              }
            />
            <Field label="Plant in forest">
              <select
                value={draft.areaId}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    areaId: e.target.value,
                    subAreaId: "",
                    parent: "",
                  }))
                }
              >
                {data.lifeAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Plant in grove">
              <select
                value={draft.subAreaId}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    subAreaId: e.target.value,
                    parent: "",
                  }))
                }
              >
                <option value="">Unplaced seed</option>
                {area?.subAreas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Plant under tree or branch">
              <select
                value={draft.parent || ""}
                onChange={(e) => change("parent", e.target.value)}
              >
                <option value="">No parent yet</option>
                {data.concepts
                  .filter(
                    (n) =>
                      !n.trashedAt &&
                      ["tree", "branch", "sub-branch"].includes(n.kind) &&
                      n.areaId === draft.areaId &&
                      n.subAreaId === draft.subAreaId,
                  )
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Source passage — select text to capture a seed">
              <textarea
                readOnly
                rows={5}
                value={node.description || ""}
                onSelect={(e) => {
                  const { selectionStart, selectionEnd, value } = e.target;
                  if (selectionEnd > selectionStart)
                    change(
                      "excerpt",
                      value.slice(selectionStart, selectionEnd),
                    );
                }}
              />
            </Field>
            <VoiceField
              scope={node.id + ":plant"}
              label="Selected idea or passage"
            >
              <textarea
                value={draft.excerpt}
                onChange={(e) => change("excerpt", e.target.value)}
              />
            </VoiceField>
            <Field label="Seed question or idea">
              <input
                required
                value={draft.title}
                onChange={(e) => change("title", e.target.value)}
                placeholder="What is Bayes’ theorem?"
              />
            </Field>
            <VoiceField
              scope={node.id + ":plant"}
              label="Why this seed matters"
            >
              <textarea
                value={draft.description}
                onChange={(e) => change("description", e.target.value)}
              />
            </VoiceField>
          </>
        )}
        {grow && (
          <>
            <Field label="Grow into">
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="existing">
                  An independent branch in a grove
                </option>
                <option value="new">A new knowledge tree</option>
              </select>
            </Field>
            {destination === "new" && (
              <Field label="New knowledge tree name">
                <input
                  required
                  value={draft.newTreeName}
                  onChange={(e) => change("newTreeName", e.target.value)}
                />
              </Field>
            )}
            {
              <>
                <Field label="Destination forest">
                  <select
                    value={draft.areaId}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        areaId: e.target.value,
                        subAreaId: "",
                      }))
                    }
                  >
                    {data.lifeAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Destination grove">
                  <select
                    value={draft.subAreaId}
                    onChange={(e) => change("subAreaId", e.target.value)}
                  >
                    <option value="">Independent branch</option>
                    {area?.subAreas.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            }
          </>
        )}
        {error && <p role="alert">{error}</p>}
        <Button primary type="submit">
          {grow ? "Grow seed" : "Save seed"}
        </Button>
      </form>
    </Modal>
  );
}
