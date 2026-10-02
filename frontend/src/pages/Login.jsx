import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function Mark({ small = false }) {
  return <span className={`brand-mark${small ? " brand-mark-small" : ""}`} aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M20 3.8 34 12v16L20 36.2 6 28V12L20 3.8Z" stroke="currentColor" strokeWidth="1.6"/><path d="M12 20h16M20 12v16" stroke="currentColor" strokeWidth="1.6"/><circle cx="20" cy="20" r="3.2" fill="currentColor"/></svg></span>;
}

export default function Login() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const registering = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`${API}/users/${registering ? "register" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registering ? { name, email, password } : { email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to continue. Please try again.");
      if (registering) {
        setMode("login"); setPassword(""); setError(""); setSuccess("Your account is ready. Sign in to continue.");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user || data.isuser || {}));
      navigate("/dashboard");
    } catch (err) { setError(err.message || "Could not reach the server. Check that the API is running."); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <div className="auth-grain" />
    <section className="auth-story">
      <a className="brand brand-light" href="/"><Mark /><span>repo<span className="brand-accent">wise</span></span></a>
      <div className="story-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> YOUR CODE, UNDERSTOOD</div>
        <h1>A clearer way<br />to know your<br /><em>codebase.</em></h1>
        <p>Ask thoughtful questions about any GitHub repository. Get grounded answers, without losing your place in the work.</p>
        <div className="story-foot"><span className="status-dot" /> Private workspace <span className="foot-separator">·</span> Built for developers</div>
      </div>
      <div className="story-orbit orbit-one" /><div className="story-orbit orbit-two" />
      <div className="story-footer">A little more clarity in every codebase.</div>
    </section>
    <section className="auth-panel">
      <div className="auth-form-wrap">
        <div className="mobile-brand"><a className="brand" href="/"><Mark /><span>repo<span className="brand-accent">wise</span></span></a></div>
        <div className="form-kicker">{registering ? "A GOOD PLACE TO START" : "WELCOME BACK"}</div>
        <h2>{registering ? "Create your account" : "Sign in to your workspace"}</h2>
        <p className="form-subtitle">{registering ? "Start exploring your repositories with a little more context." : "Pick up where you left off in your code."}</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {registering && <label className="field"><span>Your name</span><input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ada Lovelace" required /></label>}
          <label className="field"><span>Email address</span><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required /></label>
          <label className="field"><span>Password</span><input type="password" autoComplete={registering ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required /></label>
          {success && <div className="form-success" role="status">{success}</div>}
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-dark auth-submit" disabled={busy}>{busy ? <><span className="spinner" /> {registering ? "Creating account…" : "Signing in…"}</> : <>{registering ? "Create account" : "Sign in"}<span aria-hidden="true">↗</span></>}</button>
        </form>
        <div className="auth-switch">{registering ? "Already have an account?" : "New to repowise?"} <button onClick={() => { setMode(registering ? "login" : "register"); setError(""); setSuccess(""); }}>{registering ? "Sign in" : "Create an account"}</button></div>
        <div className="auth-note"><span className="lock-icon">⌑</span> Your repositories stay yours. Always.</div>
      </div>
      <footer className="auth-legal">© 2026 repowise <span>Made for the curious.</span></footer>
    </section>
  </main>;
}
