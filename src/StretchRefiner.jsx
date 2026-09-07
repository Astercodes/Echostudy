import React, { useEffect, useRef, useState } from "react";
import { Sparkles, LoaderCircle } from "lucide-react";
import { supabase } from "./auth";
export default function StretchRefiner({ draft, onApply }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(null);
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  const payload = {
    title: draft.title,
    objective: draft.objective,
    success: draft.success,
  };
  const signature = JSON.stringify(payload);
  const stale = preview && preview.signature !== signature;
  const refine = async () => {
    setBusy(true);
    setError("");
    setPreview(null);
    controller.current = new AbortController();
    const timeout = setTimeout(() => controller.current?.abort(), 40000);
    try {
      const { data: auth, error: authError } = await supabase.auth.getSession();
      if (authError || !auth.session)
        throw Error("Please sign in before using AI refinement.");
      const response = await fetch("/api/refine-stretch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.session.access_token,
        },
        body: signature,
        signal: controller.current.signal,
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw Error(
          "AI refinement is unavailable here. You can continue editing manually.",
        );
      }
      if (!response.ok)
        throw Error(
          result.error || "AI refinement is unavailable. Please try again.",
        );
      if (
        !result.suggestion ||
        ["title", "objective", "success", "rationale"].some(
          (k) => typeof result.suggestion[k] !== "string",
        )
      )
        throw Error("This suggestion could not be loaded. Please try again.");
      setPreview({ signature, ...result.suggestion });
    } catch (e) {
      if (!controller.current.signal.aborted) setError(e.message);
      else
        setError(
          "The request was interrupted or took too long. Your draft is safe.",
        );
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  };
  return (
    <section className="stretch-ai">
      <div className="stretch-ai-heading">
        <Sparkles size={20} />
        <strong>A little help shaping your stretch</strong>
      </div>
      <p>
        AI refines only your practical activity, ability to stretch and
        successful practice. Only those three answers are sent to OpenAI. Review
        the suggestion before applying it.
      </p>
      <button
        className="btn"
        type="button"
        disabled={
          busy ||
          ![draft.title, draft.objective, draft.success].some((s) => s.trim())
        }
        onClick={refine}
      >
        {busy ? (
          <LoaderCircle className="spin" size={16} />
        ) : (
          <Sparkles size={16} />
        )}{" "}
        {busy ? "Refining your draft…" : "Refine with AI"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {preview && (
        <div className="stretch-ai-preview" aria-live="polite">
          <h4>Suggested refinement</h4>
          <dl>
            <dt>Practical activity</dt>
            <dd>{preview.title}</dd>
            <dt>Ability to stretch</dt>
            <dd>{preview.objective}</dd>
            <dt>Successful practice</dt>
            <dd>{preview.success}</dd>
          </dl>
          <p>{preview.rationale}</p>
          {stale && (
            <p role="status">
              Your draft changed. Refine again to use the latest details.
            </p>
          )}
          <button
            type="button"
            className="btn primary"
            disabled={stale}
            onClick={() => {
              onApply({
                title: preview.title,
                objective: preview.objective,
                success: preview.success,
              });
              setPreview(null);
            }}
          >
            Apply suggestion
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setPreview(null)}
          >
            Keep my draft
          </button>
        </div>
      )}
    </section>
  );
}
