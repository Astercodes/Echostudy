import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Mic, Square } from "lucide-react";
import { Field } from "./App";
import { voiceStore } from "./voice-storage";
import "./voice.css";

export const VoiceScope = createContext("knowledge");
export function VoiceField({ label, scope, slot, children }) {
  const context = useContext(VoiceScope);
  const key = (scope || context) + ":" + (slot || label);
  return (
    <div className="voice-field">
      <Field label={label}>{children}</Field>
      <Recorder
        key={key}
        storageKey={key}
        label={label}
        value={children.props.value || ""}
        insert={(text) => children.props.onChange({ target: { value: text } })}
      />
    </div>
  );
}

function Clip({ clip, update, insert, value, remove, label }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!clip.blob) return;
    const next = URL.createObjectURL(clip.blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [clip.blob]);
  return (
    <section className="voice-clip">
      <small>
        {new Date(clip.at).toLocaleString()} · {clip.seconds || 0}s
      </small>
      {url && (
        <>
          <audio
            controls
            src={url}
            preload="metadata"
            aria-label={"Recording for " + label}
          />
          <a
            download={
              "echostudy-recording-" +
              clip.id +
              (clip.blob.type.includes("mp4") ? ".m4a" : ".webm")
            }
            href={url}
          >
            Download recording
          </a>
        </>
      )}
      <label className="field">
        <span>Review transcript</span>
        <textarea
          aria-label={"Transcript for " + label}
          rows={4}
          value={clip.transcript || ""}
          onChange={(e) =>
            update({ ...clip, transcript: e.target.value, inserted: false })
          }
        />
      </label>
      <div className="voice-buttons">
        <button
          type="button"
          disabled={!clip.transcript?.trim() || clip.inserted}
          onClick={() => {
            insert(
              value + (value.trim() ? "\n\n" : "") + clip.transcript.trim(),
            );
            update({ ...clip, inserted: true });
          }}
        >
          {clip.inserted ? "Transcript inserted" : "Append transcript"}
        </button>
        <button type="button" onClick={remove}>
          Delete recording
        </button>
      </div>
    </section>
  );
}

function Recorder({ storageKey, label, value, insert }) {
  const [store] = useState(voiceStore);
  const [clips, setClips] = useState([]),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState("idle"),
    [seconds, setSeconds] = useState(0),
    [error, setError] = useState(""),
    [interim, setInterim] = useState(""),
    [language, setLanguage] = useState("en-US"),
    [expanded, setExpanded] = useState(false);
  const alive = useRef(true),
    records = useRef([]),
    active = useRef(null),
    pending = useRef(false),
    queue = useRef(Promise.resolve());
  const Recognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const canRecord = Boolean(
    navigator.mediaDevices?.getUserMedia && window.MediaRecorder,
  );
  const persist = (next) => {
    records.current = next;
    if (alive.current) setClips(next);
    queue.current = queue.current
      .catch(() => {})
      .then(() => store.write(storageKey, next))
      .catch(() => {
        if (alive.current)
          setError(
            "Audio could not be saved in this browser. Download the recording before leaving.",
          );
      });
  };
  const replace = (clip) =>
    persist(records.current.map((c) => (c.id === clip.id ? clip : c)));
  const stop = () => {
    const run = active.current;
    if (!run || !run.running) return;
    run.running = false;
    clearTimeout(run.restart);
    clearInterval(run.timer);
    try {
      run.recognition?.stop();
    } catch {}
    if (run.recorder.state !== "inactive") run.recorder.stop();
    run.stream.getTracks().forEach((t) => t.stop());
    if (alive.current) {
      setStatus("saving");
      setInterim("");
    }
    run.flushTimeout = setTimeout(() => {
      run.speechDone = true;
      try {
        run.recognition?.abort();
      } catch {}
      run.finish?.();
    }, 3000);
  };
  useEffect(() => {
    alive.current = true;
    store
      .read(storageKey)
      .then((saved) => {
        if (alive.current) {
          records.current = saved;
          setClips(saved);
          setReady(true);
        }
      })
      .catch(() => {
        if (alive.current) {
          setError("Saved recordings could not be opened. You can still type.");
        }
      });
    const stopOther = () => {
      if (pending.current) {
        pending.current = false;
        if (alive.current) setStatus("idle");
      }
      stop();
    };
    window.addEventListener("echostudy-stop-audio", stopOther);
    return () => {
      alive.current = false;
      pending.current = false;
      stop();
      window.removeEventListener("echostudy-stop-audio", stopOther);
    };
  }, []);
  const start = async () => {
    if (pending.current || active.current) return;
    window.dispatchEvent(new Event("echostudy-stop-audio"));
    pending.current = true;
    setStatus("requesting");
    setError("");
    setExpanded(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current || !pending.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
        (t) => MediaRecorder.isTypeSupported(t),
      );
      let recorder;
      try {
        recorder = new MediaRecorder(
          stream,
          mime ? { mimeType: mime } : undefined,
        );
      } catch (e) {
        stream.getTracks().forEach((t) => t.stop());
        throw e;
      }
      const id = crypto.randomUUID(),
        chunks = [],
        at = new Date().toISOString();
      const run = {
        id,
        recorder,
        stream,
        running: true,
        started: Date.now(),
        restart: null,
        timer: null,
        recognition: null,
        finalText: "",
        restartCount: 0,
      };
      active.current = run;
      run.finish = () => {
        if (
          !run.audioDone ||
          (run.recognition && !run.speechDone && !run.speechFailed)
        )
          return;
        clearTimeout(run.flushTimeout);
        if (active.current === run) active.current = null;
        if (alive.current) setStatus("idle");
      };
      pending.current = false;
      persist([...records.current, { id, at, transcript: "", seconds: 0 }]);
      setSeconds(0);
      setStatus("recording");
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const old = records.current.find((c) => c.id === id);
        if (old)
          replace({
            ...old,
            blob: new Blob(chunks, {
              type: recorder.mimeType || mime || "audio/webm",
            }),
            seconds: Math.round((Date.now() - run.started) / 1000),
          });
        run.audioDone = true;
        run.finish();
      };
      recorder.onerror = () => {
        if (alive.current)
          setError(
            "Recording was interrupted. Any captured audio is kept below.",
          );
        stop();
      };
      recorder.start(1000);
      run.timer = setInterval(() => {
        if (alive.current)
          setSeconds(Math.floor((Date.now() - run.started) / 1000));
      }, 1000);
      if (!Recognition) {
        setError(
          "This browser cannot generate transcripts. Audio will still be recorded. Try a browser with speech recognition for dictation.",
        );
        return;
      }
      const recognition = new Recognition();
      run.recognition = recognition;
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;
      let cycleFinal = "";
      recognition.onresult = (e) => {
        let final = "",
          partial = "";
        for (let i = 0; i < e.results.length; i++) {
          const text = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += text + " ";
          else partial += text;
        }
        cycleFinal = final;
        const transcript = (run.finalText + final).trim();
        const clip = records.current.find((c) => c.id === id);
        if (clip && clip.transcript !== transcript)
          replace({ ...clip, transcript });
        if (alive.current) setInterim(partial);
        run.restartCount = 0;
      };
      recognition.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        run.speechFailed = true;
        if (alive.current)
          setError(
            e.error === "not-allowed" || e.error === "service-not-allowed"
              ? "Speech recognition was denied. Allow speech access or use a supported browser; your audio recording continues."
              : "Transcription is unavailable right now. Check your connection; your audio recording continues.",
          );
      };
      recognition.onend = () => {
        run.finalText += cycleFinal;
        cycleFinal = "";
        if (!run.running) {
          run.speechDone = true;
          run.finish();
        }
        if (run.running && !run.speechFailed && alive.current) {
          if (++run.restartCount > 5) {
            run.speechFailed = true;
            setError(
              "Speech recognition stopped repeatedly. Your audio is still recording.",
            );
            return;
          }
          run.restart = setTimeout(() => {
            if (run.running)
              try {
                recognition.start();
              } catch {
                run.speechFailed = true;
                if (alive.current)
                  setError(
                    "Transcription stopped. Your audio is still recording.",
                  );
              }
          }, 250);
        }
      };
      try {
        recognition.start();
      } catch {
        run.speechFailed = true;
        setError(
          "Speech recognition could not start. Your audio is still recording.",
        );
      }
    } catch (e) {
      pending.current = false;
      const failed = active.current;
      if (failed) {
        failed.running = false;
        clearInterval(failed.timer);
        failed.stream.getTracks().forEach((t) => t.stop());
        active.current = null;
      }
      if (alive.current) {
        setStatus("idle");
        setError(
          e.name === "NotAllowedError"
            ? "Microphone access was denied. Allow microphone access in your browser and try again."
            : "The microphone could not be opened. Check that it is connected and available.",
        );
      }
    }
  };
  const busy = status !== "idle";
  return (
    <div
      className="voice-recorder"
      role="group"
      aria-label={"Audio for " + label}
    >
      <div className="voice-buttons">
        <button
          type="button"
          disabled={
            !ready ||
            !canRecord ||
            status === "requesting" ||
            status === "saving"
          }
          onClick={status === "recording" ? stop : start}
        >
          {status === "recording" ? (
            <>
              <Square size={13} />
              Stop recording · {seconds}s
            </>
          ) : (
            <>
              <Mic size={14} />
              {status === "requesting"
                ? "Waiting for microphone…"
                : status === "saving"
                  ? "Saving audio…"
                  : "Record audio"}
            </>
          )}
        </button>
        <button type="button" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Hide" : "Show"} recordings ({clips.length})
        </button>
      </div>
      {!canRecord && (
        <p>
          Audio recording is unavailable in this browser. Use a supported
          browser over HTTPS.
        </p>
      )}
      {error && (
        <p className="voice-error" role="alert">
          {error}
        </p>
      )}
      {expanded && (
        <>
          <label className="voice-language">
            Speech language
            <select
              aria-label={"Speech language for " + label}
              disabled={busy}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="en-NG">English (Nigeria)</option>
              <option value="fr-FR">French</option>
              <option value="es-ES">Spanish</option>
              <option value="pt-BR">Portuguese</option>
            </select>
          </label>
          <p className="voice-help">
            Speech is transcribed by your browser and may be processed online.
            Recordings stay in this browser; download copies to keep them
            outside this device.
          </p>
          {status === "recording" && (
            <p role="status">
              Recording…{" "}
              {interim || "Speak naturally. Stop when you are finished."}
            </p>
          )}
          {[...clips].reverse().map((clip) =>
            busy && clip.id === active.current?.id ? (
              <p className="voice-live" key={clip.id}>
                {clip.transcript || "Listening for speech…"}
              </p>
            ) : (
              <Clip
                key={clip.id}
                clip={clip}
                label={label}
                value={value}
                insert={insert}
                update={replace}
                remove={() =>
                  persist(records.current.filter((c) => c.id !== clip.id))
                }
              />
            ),
          )}
        </>
      )}
    </div>
  );
}
