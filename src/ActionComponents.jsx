import React, { useState } from "react";
import { Field } from "./App";
import { VoiceField } from "./VoiceField";
import { ACTION_COMPONENTS } from "./action-components";
export default function ActionComponents({
  mode,
  values = {},
  onChange,
  scope,
}) {
  const spec = ACTION_COMPONENTS[mode];
  const [active, setActive] = useState(spec.fields[0][0]);
  const field = spec.fields.find((f) => f[0] === active);
  return (
    <details className="action-component-review">
      <summary>
        {spec.title || mode} · Comprehensive components (
        {spec.fields.filter((f) => values[f[0]]?.trim()).length}/
        {spec.fields.length})
      </summary>
      <p>
        Optional guided notes. Record what is relevant; leaving a field blank
        does not block the action.
      </p>
      <Field label={spec.title + " component"}>
        <select value={active} onChange={(e) => setActive(e.target.value)}>
          {spec.fields.map((f) => (
            <option key={f[0]} value={f[0]}>
              {f[3]} · {f[1]}
            </option>
          ))}
        </select>
      </Field>
      <VoiceField scope={scope + ":" + active} label={field[1]}>
        <textarea
          rows={5}
          value={values[active] || ""}
          placeholder={field[2]}
          onChange={(e) => onChange({ ...values, [active]: e.target.value })}
        />
      </VoiceField>
    </details>
  );
}
