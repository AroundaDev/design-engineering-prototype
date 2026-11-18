import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "~/components/ui/Toast";
import { FINDINGS, type Finding } from "~/data/findings";
import { addComment, reopen, resolve, type State } from "~/lib/findings-store";
import { playOnce, prefersReducedMotion } from "~/lib/motion";
import { SevTag } from "./FindingsTable";

type Tab = "overview" | "evidence" | "activity" | "comments";
const TABS: Tab[] = ["overview", "evidence", "activity", "comments"];

const STEP_ICONS = {
  commit: <><path d="M3 12h5M16 12h5" /><circle cx="12" cy="12" r="3.5" /></>,
  scan: <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />,
  key: <><circle cx="8" cy="14" r="4" /><path d="M11 11l8-8M16 5l3 3" /></>,
  ok: <path d="M5 12l5 5 9-10" />,
  warn: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17v.5" /></>,
};

/** Splits a code line so quoted strings can be tinted. */
function codeLine(l: string) {
  return l.split(/(".*?")/g).map((part, i) => (i % 2 ? <span key={i} className="s">{part}</span> : part));
}

type Props = { f: Finding; store: State; onClose: () => void };

/** Right-hand detail panel for the selected finding. */
export function FindingDrawer({ f, store, onClose }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [lit, setLit] = useState(0);
  const [menu, setMenu] = useState(false);
  const [draft, setDraft] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const res = !!store.resolved[f.id];
  const comments = store.comments[f.id] || [];

  // A new finding resets the tab and replays the detection flow, step by step.
  useEffect(() => {
    setTab("overview");
    setMenu(false);
    setDraft("");
    if (prefersReducedMotion()) {
      setLit(4);
      return;
    }
    setLit(0);
    const ids = [0, 1, 2, 3].map((i) => setTimeout(() => setLit(i + 1), 250 + i * 260));
    return () => ids.forEach(clearTimeout);
  }, [f.id]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!menuRef.current?.contains(t) && !t.closest("[aria-haspopup='menu']")) setMenu(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menu]);

  function popBadges() {
    requestAnimationFrame(() =>
      [".tr.on .sev", "#dr .meta .sev", "#dr .kv .sev", "#dr .dfoot .btn"].forEach((s) => playOnce(document.querySelector(s), "pop")),
    );
  }

  function toggleResolved() {
    if (res) {
      reopen(f.id);
      toast("Finding reopened");
    } else {
      resolve(f.id);
      toast(`${f.title} marked as resolved`);
    }
    popBadges();
  }

  function sendComment() {
    const x = draft.trim();
    if (!x) return;
    addComment(f.id, x);
    setDraft("");
    toast("Comment added");
  }

  const steps: [string, ReactNode][] = [
    ["Code committed", STEP_ICONS.commit],
    ["Scan matched pattern", STEP_ICONS.scan],
    [f.icon === "secret" ? "Credential verified live" : "Exploit path confirmed", STEP_ICONS.key],
    [res ? "Resolved" : `Flagged ${f.sev}`, res ? STEP_ICONS.ok : STEP_ICONS.warn],
  ];

  const acts: [string, string, string][] = [
    ...comments.map((c): [string, string, string] => [c.t, "Ariel R", " commented"]).reverse(),
    ...(res ? [["Just now", "Ariel R", " marked it resolved"] as [string, string, string]] : []),
    [`${f.age} ago`, "Scanner", " opened this finding"],
    ["Today 09:12", "Policy engine", ` set severity to ${f.sev}`],
  ];

  return (
    <div className="dr" id="dr">
      <div className="dr-h">
        <h2>{f.title}</h2>
        <button className="close" type="button" aria-label="Close details" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="meta">
          <SevTag f={f} resolved={res} />
          ID: {f.id}
        </div>
      </div>

      <div className="dtabs" role="tablist">
        {TABS.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {k[0].toUpperCase() + k.slice(1)}
            {k === "comments" && comments.length ? ` (${comments.length})` : ""}
          </button>
        ))}
      </div>

      <div className="dbody" role="tabpanel">
        {tab === "overview" && (
          <>
            <div className="box">
              <div className="flow">
                {steps.map(([label, icon], i) => (
                  <div key={i} className={i < lit ? "lit" : ""}>
                    <i style={i === 3 && res ? { background: "var(--ok)" } : undefined}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>{icon}</svg>
                    </i>
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <div className="box">
              <h3>General details</h3>
              <div className="kv">
                {(
                  [
                    ["Finding", f.finding],
                    ["Scan type", f.scan],
                    ["Repository", f.repo],
                    ["File & line", f.file],
                    ["Branch", f.branch],
                    ["Committed by", f.by],
                    ["Reference", f.ref],
                  ] as const
                ).map(([k, v]) => (
                  <KV key={k} k={k} v={v} />
                ))}
              </div>
            </div>
            <div className="box">
              <h3>Status</h3>
              <div className="kv">
                <KV k="Severity" v={<SevTag f={f} resolved={res} />} />
                <KV k="Owner" v={res ? store.resolved[f.id].by : "Unassigned"} />
                <KV k="Due" v="Within 24 hours" />
              </div>
            </div>
          </>
        )}

        {tab === "evidence" && (
          <div className="box">
            <h3>{f.file}</h3>
            <div className="code">
              {f.code.map((l, i) => (
                <div key={i} className={i === f.hl ? "hl" : ""}>
                  <i>{i + 1}</i>
                  {codeLine(l)}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--t2)", marginTop: 10 }}>
              Line {f.hl + 1} matched the detection rule for {f.ref}.
            </p>
          </div>
        )}

        {tab === "activity" && (
          <div className="box">
            {acts.map(([tm, who, what], i) => (
              <div key={i} className="act">
                <span className="tm">{tm}</span>
                <span>
                  <b>{who}</b>
                  {what}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "comments" && (
          <div className="box">
            <div className="cmt">
              <span className="av" style={{ background: "linear-gradient(135deg,#9ad,#57a)" }}>JR</span>
              <div>
                <b style={{ fontWeight: 500 }}>j.rivera</b>
                <small> · 1 day ago</small>
                <div>This key was only meant for the staging bucket. I can rotate it today.</div>
              </div>
            </div>
            {comments.map((c, i) => (
              <div key={i} className="cmt">
                <span className="av">AR</span>
                <div>
                  <b style={{ fontWeight: 500 }}>Ariel R</b>
                  <small> · {c.t}</small>
                  <div>{c.x}</div>
                </div>
              </div>
            ))}
            <div className="cin">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendComment()}
                placeholder="Write a comment"
                aria-label="Write a comment"
              />
              <button className="btn" type="button" onClick={sendComment}>Comment</button>
            </div>
          </div>
        )}
      </div>

      <div className="dfoot">
        <button className={`btn ${res ? "done" : "primary"}`} type="button" onClick={toggleResolved}>
          <span style={{ display: "inline-flex" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} style={{ width: 12, height: 12 }}>
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
          {res ? "Resolved · Reopen" : "Mark as resolved"}
        </button>
        <button className="btn" type="button" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          More actions
          <span style={{ display: "inline-flex" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
      </div>
      <div className={`menu${menu ? " on" : ""}`} role="menu" ref={menuRef}>
        <button type="button" role="menuitem" onClick={() => navigate(`/chat?ask=${encodeURIComponent("Get a detailed report")}&ctx=${f.id}`)}>
          Ask AI about this finding
        </button>
        <button type="button" role="menuitem" onClick={() => { toast("Assigned to Ariel R"); setMenu(false); }}>
          Assign to me
        </button>
        <button type="button" role="menuitem" onClick={() => { toast(`Ticket SEC-${1400 + FINDINGS.indexOf(f)} created`); setMenu(false); }}>
          Create a ticket
        </button>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <>
      <span>{k}</span>
      <span>{v}</span>
    </>
  );
}
