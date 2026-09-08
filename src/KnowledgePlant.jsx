import React, { useState } from "react";
import { Modal, Field, Button } from "./App";
import { VoiceField } from "./VoiceField";

export default function KnowledgePlant({
  node,
  data,
  grow = false,
  close,
  submit,
}) {
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    excerpt: "",
    areaId: node.areaId || data.lifeAreas[0].id,
    subAreaId: "",
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
              newTreeName: destination === "new" ? draft.newTreeName : "",
            });
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        {!grow && (
          <>
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
