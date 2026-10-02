import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const Icon = ({ name, size = 18 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    plus: <><path d="M12 5v14M5 12h14" /></>,
    repo: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M8 7h8M8 11h6"/></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-3.4-.7L4 20l1.4-3.7A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></>,
    external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></>,
    send: <><path d="m21 3-7.2 18-3.8-7-7-3.8L21 3Z"/><path d="M10 14 21 3"/></>,
    spark: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "Y";
const repoLabel = repo => repo?.repoName || repo?.repoUrl?.split("/").filter(Boolean).pop()?.replace(/\.git$/, "") || "Repository";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } });
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [addingRepo, setAddingRepo] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const feedRef = useRef(null);
  const inputRef = useRef(null);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Something went wrong. Please try again.");
    return data;
  }, [token]);

  const loadRepos = useCallback(async () => {
    setLoadingRepos(true); setError("");
    try {
      const data = await request("/repo");
      const repos = data.repos || data.repositories || [];
      setRepositories(repos);
      setSelectedRepo(current => current && repos.some(repo => repo._id === current._id) ? current : repos[0] || null);
    } catch (err) { setError(err.message); }
    finally { setLoadingRepos(false); }
  }, [request]);

  useEffect(() => {
    if (!token) { navigate("/", { replace: true }); return; }
    loadRepos();
  }, [token, navigate, loadRepos]);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [messages, sending]);
  useEffect(() => { setMessages([]); setConversationId(null); }, [selectedRepo?._id]);

  async function addRepository(event) {
    event.preventDefault(); setAddingRepo(true); setError("");
    try {
      const data = await request("/repo", { method: "POST", body: JSON.stringify({ repoName: repoName.trim(), repoUrl: repoUrl.trim() }) });
      const repo = data.repository; setRepositories(current => [repo, ...current]); setSelectedRepo(repo);
      setRepoName(""); setRepoUrl(""); setShowAdd(false);
    } catch (err) { setError(err.message); }
    finally { setAddingRepo(false); }
  }

  async function sendMessage(value = draft) {
    const content = value.trim();
    if (!content || !selectedRepo || sending) return;
    setDraft(""); setError(""); setMessages(current => [...current, { role: "user", content, localId: Date.now() }]); setSending(true);
    try {
      let currentConversation = conversationId;
      if (!currentConversation) {
        const created = await request("/conversations", { method: "POST", body: JSON.stringify({ repoId: selectedRepo._id, title: content.slice(0, 64) }) });
        currentConversation = created.conversation._id; setConversationId(currentConversation);
      }
      const data = await request("/messages", { method: "POST", body: JSON.stringify({ conversationId: currentConversation, content }) });
      setMessages(current => [...current, { role: "assistant", content: data.assistantMessage.content, localId: `${Date.now()}-assistant` }]);
    } catch (err) {
      setMessages(current => [...current, { role: "assistant", content: `I couldn't complete that request. ${err.message}`, failed: true, localId: `${Date.now()}-error` }]);
    } finally { setSending(false); inputRef.current?.focus(); }
  }

  async function logout() {
    try { await request("/users/logout", { method: "POST" }); } catch { /* Clear local session even if the API is unavailable. */ }
    localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/", { replace: true });
  }

  const suggestions = ["Give me an overview of this codebase", "Where does the app start?", "How is authentication handled?"];

  return <main className="workspace">
    <aside className={`sidebar${mobileNav ? " sidebar-open" : ""}`}>
      <a className="brand sidebar-brand" href="/dashboard"><span className="brand-mark"><svg viewBox="0 0 40 40" fill="none"><path d="M20 3.8 34 12v16L20 36.2 6 28V12L20 3.8Z" stroke="currentColor" strokeWidth="1.6"/><path d="M12 20h16M20 12v16" stroke="currentColor" strokeWidth="1.6"/><circle cx="20" cy="20" r="3.2" fill="currentColor"/></svg></span><span>repo<span className="brand-accent">wise</span></span></a>
      <button className="workspace-switcher"><span className="workspace-avatar">{initials(user.name || user.email)}</span><span className="workspace-meta"><strong>{user.name || "Your workspace"}</strong><small>Personal workspace</small></span><span className="switch-chevron">⌄</span></button>
      <div className="side-section-heading"><span>YOUR LIBRARY</span><button className="icon-button side-add" aria-label="Add repository" onClick={() => { setShowAdd(true); setMobileNav(false); }}><Icon name="plus" size={17}/></button></div>
      <nav className="repo-navigation" aria-label="Repositories">
        {loadingRepos ? <div className="side-loading"><span className="spinner spinner-muted"/> Loading repositories</div> : repositories.length ? repositories.map(repo => <button key={repo._id} className={`repo-nav-item${selectedRepo?._id === repo._id ? " active" : ""}`} onClick={() => { setSelectedRepo(repo); setMobileNav(false); }}><Icon name="repo" size={16}/><span>{repoLabel(repo)}</span><Icon name="chevron" size={14}/></button>) : <div className="side-empty">Your repositories will live here.</div>}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><span className="tip-icon"><Icon name="spark" size={16}/></span><strong>Curiosity, meet context.</strong><p>Ask questions in plain language. Get answers grounded in your code.</p></div><button className="profile-button" onClick={logout}><span className="profile-avatar">{initials(user.name || user.email)}</span><span className="profile-meta"><strong>{user.name || "Your account"}</strong><small>{user.email || "Signed in"}</small></span><span className="logout-mark">↗</span></button></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <section className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Icon name="menu"/></button><div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14}/><strong>{selectedRepo ? repoLabel(selectedRepo) : "Overview"}</strong></div><div className="topbar-right"><span className="connection-status"><span className="status-dot"/> All systems ready</span><button className="button button-outline top-add" onClick={() => setShowAdd(true)}><Icon name="plus" size={16}/> Add repository</button></div></header>
      {error && <div className="notice-error" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss">×</button></div>}
      {selectedRepo ? <div className="chat-layout">
        <div className="chat-heading"><div><div className="section-eyebrow"><span className="green-pulse"/> REPOSITORY CHAT</div><h1>{repoLabel(selectedRepo)}<a href={selectedRepo.repoUrl} target="_blank" rel="noreferrer" className="repo-link" aria-label="Open repository"><Icon name="external" size={16}/></a></h1><p className="repo-subtitle">Ask anything about the code, structure, or decisions inside this repository.</p></div><span className="repo-pill"><Icon name="repo" size={14}/>{selectedRepo.repoUrl?.replace(/^https?:\/\//, "")}</span></div>
        <div className="chat-feed" ref={feedRef}>
          {messages.length === 0 ? <div className="welcome-state"><div className="welcome-art"><span className="art-orbit art-orbit-a"/><span className="art-orbit art-orbit-b"/><span className="art-core"><Icon name="spark" size={25}/></span><span className="art-node art-node-one"/><span className="art-node art-node-two"/><span className="art-node art-node-three"/></div><div className="welcome-eyebrow">A FRESH PERSPECTIVE</div><h2>What would you like to<br/>understand?</h2><p>Ask a question and I’ll look through <strong>{repoLabel(selectedRepo)}</strong><br className="desktop-break"/> to find a clear, code-grounded answer.</p><div className="suggestion-grid">{suggestions.map((prompt, index) => <button className="suggestion-card" key={prompt} onClick={() => sendMessage(prompt)}><span className="suggestion-number">0{index + 1}</span><span>{prompt}</span><Icon name="arrow" size={15}/></button>)}</div></div> : <div className="message-list">{messages.map(message => <article className={`message-row ${message.role}${message.failed ? " message-failed" : ""}`} key={message.localId}><div className={`message-avatar ${message.role === "assistant" ? "assistant-avatar" : "user-avatar"}`}>{message.role === "assistant" ? <Icon name="spark" size={16}/> : initials(user.name || user.email)}</div><div className="message-body"><div className="message-author">{message.role === "assistant" ? "Repowise" : "You"}<span>{message.role === "assistant" ? "CODE ASSISTANT" : "JUST NOW"}</span></div><div className="message-content">{message.content}</div></div></article>)}{sending && <article className="message-row assistant"><div className="message-avatar assistant-avatar"><Icon name="spark" size={16}/></div><div className="message-body"><div className="message-author">Repowise<span>READING THE CODE</span></div><div className="thinking"><i/><i/><i/></div></div></article>}</div>}
        </div>
        <div className="composer-area"><form className="composer" onSubmit={event => { event.preventDefault(); sendMessage(); }}><textarea ref={inputRef} rows="1" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder={`Ask a question about ${repoLabel(selectedRepo)}…`} aria-label="Your question" disabled={sending}/><div className="composer-bottom"><span><kbd>↵</kbd> to send <span className="composer-hint">·</span> <kbd>shift ↵</kbd> for a new line</span><button className="send-button" type="submit" disabled={!draft.trim() || sending} aria-label="Send message"><Icon name="send" size={17}/></button></div></form><div className="composer-caption">Answers are generated from the repository’s indexed code.</div></div>
      </div> : <div className="empty-workspace"><div className="empty-inner"><div className="empty-mark"><Icon name="repo" size={26}/></div><div className="section-eyebrow">A BETTER WAY INTO THE CODE</div><h1>Start with a repository.</h1><p>Connect a public GitHub repository and get a thoughtful, searchable companion for the code inside.</p><button className="button button-dark" onClick={() => setShowAdd(true)}><Icon name="plus" size={16}/> Add your first repository</button><div className="empty-details"><span><b>01</b> Connect a repository</span><span><b>02</b> Let us read the code</span><span><b>03</b> Ask away</span></div></div></div>}
    </section>
    {showAdd && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !addingRepo) setShowAdd(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="add-title"><button className="modal-close" onClick={() => setShowAdd(false)} aria-label="Close dialog">×</button><div className="modal-icon"><Icon name="repo" size={21}/></div><div className="section-eyebrow">ADD TO YOUR LIBRARY</div><h2 id="add-title">Connect a repository</h2><p className="modal-copy">We’ll index the code so you can start asking better questions.</p><form className="repo-form" onSubmit={addRepository}><label className="field"><span>Repository name</span><input value={repoName} onChange={e => setRepoName(e.target.value)} placeholder="e.g. my-api" required /></label><label className="field"><span>GitHub URL</span><input type="url" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/you/repository" required /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-dark modal-submit" disabled={addingRepo}>{addingRepo ? <><span className="spinner"/> Connecting & indexing…</> : <>Connect repository <Icon name="arrow" size={16}/></>}</button></form><div className="modal-footnote"><span className="status-dot"/> Public GitHub repositories are supported</div></section></div>}
  </main>;
}
