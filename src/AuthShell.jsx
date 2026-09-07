import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Sprout,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  UserRound,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
const App = lazy(() => import("./App"));
import Landing from "./Landing";
import { supabase, authConfigured } from "./auth";
import { setFileNamespace } from "./files";
const route = () =>
  ({
    "/login": "login",
    "/signup": "signup",
    "/forgot-password": "reset",
    "/reset-password": "update",
  })[window.location.pathname] || "landing";
export default function AuthShell() {
  const [mode, setMode] = useState(route),
    [candidate, setCandidate] = useState(undefined),
    [user, setUser] = useState(null),
    [checking, setChecking] = useState(authConfigured),
    [message, setMessage] = useState("");
  const navigate = (m) => {
    setMode(m);
    setMessage("");
    history.pushState(
      {},
      "",
      {
        landing: "/",
        login: "/login",
        signup: "/signup",
        reset: "/forgot-password",
        update: "/reset-password",
      }[m] || "/",
    );
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const pop = () => setMode(route());
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
      setCandidate(session);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let active = true;
    if (candidate === undefined) return;
    if (!candidate) {
      setUser(null);
      setChecking(false);
      setFileNamespace(null);
      return;
    }
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data.user || data.user.id !== candidate.user.id) {
          setUser(null);
          setFileNamespace(null);
          setMessage(
            "Your session could not be verified. Please sign in again.",
          );
        } else {
          setFileNamespace(data.user.id);
          setUser(data.user);
        }
        setChecking(false);
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setChecking(false);
          setMessage(
            "We could not verify your session. Check your connection and sign in again.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [candidate]);
  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
    setUser(null);
    setCandidate(null);
    setFileNamespace(null);
    navigate("landing");
  };
  useEffect(() => {
    if (user && mode !== "update") history.replaceState({}, "", "/dashboard");
  }, [user, mode]);
  if (checking)
    return (
      <div className="auth-loading">
        <Sprout size={38} />
        <p>Opening your space to grow…</p>
        <LoaderCircle className="spin" size={20} />
      </div>
    );
  if (user && mode !== "update")
    return (
      <Suspense
        fallback={<div className="auth-loading">Opening your workspace…</div>}
      >
        <App key={user.id} user={user} onSignOut={signOut} />
      </Suspense>
    );
  if (mode === "landing" && !message) return <Landing navigate={navigate} />;
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Brand onClick={() => navigate("landing")} />
        <div>
          <span className="eyebrow">A LIFE OF INTENTIONAL GROWTH</span>
          <h1>
            Become more.
            <br />
            One purposeful
            <br />
            <em>day at a time.</em>
          </h1>
          <p>
            Your time, your goals, your growing mind.
            <br />
            Finally, in one connected space.
          </p>
          <div className="auth-flower" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} style={{ "--petal": i }} />
            ))}
            <Sprout size={52} />
          </div>
        </div>
        <small>Time → goals → study → knowledge → growth</small>
      </aside>
      <section className="auth-content">
        <button
          className="text-btn auth-back"
          onClick={() => navigate("landing")}
        >
          <ArrowLeft size={16} />
          Back to EchoStudy
        </button>
        <AuthForm
          key={mode}
          mode={mode}
          navigate={navigate}
          verifiedUser={user}
          externalMessage={message}
        />
        <p className="auth-footnote">
          Your account opens your workspace. Study data stays in this browser,
          separated by account.
        </p>
      </section>
    </div>
  );
}
export function Brand({ onClick }) {
  return (
    <a
      href="/"
      className="brand landing-brand"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <Sprout size={30} />
      echo<span>study</span>
    </a>
  );
}
function AuthForm({ mode, navigate, verifiedUser, externalMessage }) {
  const [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const signup = mode === "signup",
    reset = mode === "reset",
    update = mode === "update";
  const title = signup
    ? "Start your next chapter."
    : reset
      ? "A fresh way back in."
      : update
        ? "Choose a new password."
        : "Welcome back, growing mind.";
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!authConfigured) {
      setError("Account access is being set up. Please try again soon.");
      return;
    }
    if ((signup || update) && password !== confirm) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin + "/login",
          },
        });
        if (error) throw error;
        if (!data.session)
          setSuccess(
            "Check your inbox for a confirmation link. If an account already exists, sign in or reset your password.",
          );
      } else if (reset) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: window.location.origin + "/reset-password" },
        );
        if (error) throw error;
        setSuccess(
          "If an account exists for this email, you will receive a password reset link.",
        );
      } else if (update) {
        if (!verifiedUser)
          throw Error(
            "Open the password reset link in your email before choosing a new password.",
          );
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setSuccess("Your password has been updated.");
        setPassword("");
        setConfirm("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-form-wrap">
      <span className="eyebrow">
        {signup
          ? "PLANT THE FIRST SEED"
          : reset || update
            ? "ACCOUNT RECOVERY"
            : "YOUR NEXT CHAPTER AWAITS"}
      </span>
      <h2>{title}</h2>
      <p>
        {signup
          ? "Create an account and make room for who you’re becoming."
          : reset
            ? "Enter your email and we’ll send you a reset link."
            : update
              ? "Use a strong password you don’t use elsewhere."
              : "Sign in to continue building a more intentional life."}
      </p>
      {!authConfigured && (
        <div className="auth-notice" role="status">
          Account access is being set up. Sign-in and registration will be
          available soon.
        </div>
      )}
      {externalMessage && (
        <p role="alert" className="error">
          {externalMessage}
        </p>
      )}
      {success ? (
        <div className="auth-success" role="status">
          <CheckCircle2 size={30} />
          <h3>{update ? "A fresh start." : "Check your email."}</h3>
          <p>{success}</p>
          <button className="btn primary" onClick={() => navigate("login")}>
            {update ? "Continue to workspace" : "Back to sign in"}
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          {signup && (
            <label className="field">
              <span>Your name</span>
              <div className="auth-input">
                <UserRound size={18} />
                <input
                  autoComplete="name"
                  required
                  maxLength="80"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                />
              </div>
            </label>
          )}
          {!update && (
            <label className="field">
              <span>Email address</span>
              <div className="auth-input">
                <Mail size={18} />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </label>
          )}
          {!reset && (
            <>
              <label className="field">
                <span>{update ? "New password" : "Password"}</span>
                <div className="auth-input">
                  <LockKeyhole size={18} />
                  <input
                    type={show ? "text" : "password"}
                    autoComplete={
                      signup || update ? "new-password" : "current-password"
                    }
                    minLength={signup || update ? 8 : 1}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      signup || update
                        ? "At least 8 characters"
                        : "Enter your password"
                    }
                  />
                  <button
                    type="button"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              {(signup || update) && (
                <label className="field">
                  <span>Confirm password</span>
                  <div className="auth-input">
                    <LockKeyhole size={18} />
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      minLength="8"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Enter your password again"
                    />
                  </div>
                </label>
              )}
            </>
          )}
          {!signup && !reset && !update && (
            <button
              type="button"
              className="text-btn forgot-link"
              onClick={() => navigate("reset")}
            >
              Forgot password?
            </button>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn primary auth-submit"
            disabled={busy || !authConfigured || (update && !verifiedUser)}
            type="submit"
          >
            {busy ? <LoaderCircle size={18} className="spin" /> : null}
            {busy
              ? "Just a moment…"
              : signup
                ? "Create my account"
                : reset
                  ? "Send reset link"
                  : update
                    ? "Update password"
                    : "Sign in to my workspace"}
            {!busy && <ArrowRight size={17} />}
          </button>
          {update && !verifiedUser && (
            <p className="muted">
              Open the reset link from your email, or{" "}
              <button
                className="text-btn"
                type="button"
                onClick={() => navigate("reset")}
              >
                request a new link
              </button>
              .
            </p>
          )}
        </form>
      )}
      {!update && (
        <p className="auth-switch">
          {signup ? "Already growing with us?" : "New to EchoStudy?"}{" "}
          <button onClick={() => navigate(signup ? "login" : "signup")}>
            {signup ? "Sign in" : "Create an account"}
            <ArrowRight size={13} />
          </button>
        </p>
      )}
    </div>
  );
}
