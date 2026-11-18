import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "~/components/ui/Toast";
import { PEOPLE, type CardKind } from "~/data/chat";
import { FINDINGS, type Finding } from "~/data/findings";
import { resolve, useFindingsState } from "~/lib/findings-store";
import { prefersReducedMotion } from "~/lib/motion";
import { IC } from "./icons";

type Status = { text: string; cls: "run" | "ok" } | null;

/** Tool card frame: icon, title, subtitle and a status pill. */
function ToolCard({ icon, title, sub, status, children }: { icon: ReactNode; title: string; sub: string; status: Status; children: ReactNode }) {
  return (
    <div className="tc">
      <div className="tch">
        <span className="g">{icon}</span>
        <span>
          <b>{title}</b>
          <small>{sub}</small>
        </span>
        {status && (
          <span key={status.text} className={`st ${status.cls}`}>
            {status.cls === "ok" && IC.check}
            {status.text}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** Timers that are cleared if the card unmounts mid-run. */
function useTimers() {
  const ids = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => ids.current.forEach(clearTimeout), []);
  return (fn: () => void, ms: number) => {
    ids.current.push(setTimeout(fn, prefersReducedMotion() ? 0 : ms));
  };
}

const copy = (text: string, msg: string) => {
  try {
    navigator.clipboard?.writeText(text);
  } catch {}
  toast(msg);
};

function RotateCard({ f }: { f: Finding }) {
  const navigate = useNavigate();
  const later = useTimers();
  const sec = f.icon === "secret";
  const steps = sec
    ? ["Deactivate the exposed key", "Create a new key in Secrets Manager", `Update ${f.asset} to read the new secret`, "Redeploy and verify traffic", "Delete the old key"]
    : ["Apply the patch from Evidence", `Re-run ${f.scan.toLowerCase()}`, "Close the finding"];
  const [k, setK] = useState(-1); // index of the running step; -1 idle, steps.length done
  const [status, setStatus] = useState<Status>(null);

  function run() {
    setStatus({ text: "Running", cls: "run" });
    const tick = (i: number) => {
      setK(i);
      if (i < steps.length) later(() => tick(i + 1), 650);
      else {
        resolve(f.id);
        setStatus({ text: "Done", cls: "ok" });
        toast(`${f.title} resolved`);
      }
    };
    tick(0);
  }

  return (
    <ToolCard icon={IC.key} title={sec ? `Rotate ${f.title.replace(" Exposed", "")}` : `Resolve ${f.title}`} sub={`${f.asset} · ~2 min`} status={status}>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s} className={i < k ? "done" : i === k ? "now" : ""}>
            <span className="d">{IC.check}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <div className="tca">
        {k >= steps.length ? (
          <button className="btn done" type="button" disabled>
            {IC.check}Rotated · finding resolved
          </button>
        ) : (
          <button className="btn primary" type="button" disabled={k >= 0} onClick={run}>
            {k >= 0 ? <><span className="spin" />Running…</> : <><span style={{ display: "inline-flex" }}>{IC.bolt}</span>Run rotation</>}
          </button>
        )}
        <button className="btn" type="button" onClick={() => navigate(`/findings?open=${f.id}&tab=evidence`)}>
          Review evidence
        </button>
      </div>
    </ToolCard>
  );
}

const PRIORITIES = [
  ["Highest", "hi"],
  ["High", "md"],
  ["Medium", "lo"],
] as const;

function TicketCard({ f }: { f: Finding }) {
  const later = useTimers();
  const [title, setTitle] = useState(`Rotate exposed credential in ${f.repo}`);
  const [pi, setPi] = useState(0);
  const [who, setWho] = useState(0);
  const [state, setState] = useState<"draft" | "busy" | "done">("draft");
  const id = `SEC-${1412 + FINDINGS.indexOf(f)}`;
  const locked = state === "done";

  function create() {
    setState("busy");
    later(() => {
      setState("done");
      toast(`${id} created in Jira`);
    }, 700);
  }

  return (
    <ToolCard icon={IC.ticket} title="New ticket · SEC" sub="Jira · Security project" status={locked ? { text: `${id} created`, cls: "ok" } : null}>
      <div className="grid2">
        <span>Title</span>
        <input className="fld" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Ticket title" disabled={locked} />
        <span>Priority</span>
        <div>
          <button className={`pill2 ${PRIORITIES[pi][1]}`} type="button" disabled={locked} onClick={() => setPi((pi + 1) % 3)}>
            {PRIORITIES[pi][0]}
          </button>
        </div>
        <span>Assignee</span>
        <div>
          <button className="pill2" type="button" disabled={locked} onClick={() => setWho((who + 1) % PEOPLE.length)}>
            {PEOPLE[who].name}
          </button>
        </div>
        <span>Due</span>
        <div className="muted">Within 24 hours (critical SLA)</div>
        <span>Links</span>
        <div className="muted">{f.id} · {f.file}</div>
      </div>
      <div className="tca">
        {locked ? (
          <button className="btn done" type="button" disabled>
            {IC.check}
            {id} · assigned to {PEOPLE[who].name}
          </button>
        ) : (
          <button className="btn primary" type="button" disabled={state === "busy"} onClick={create}>
            {state === "busy" ? <><span className="spin" />Creating…</> : <><span style={{ display: "inline-flex" }}>{IC.ticket}</span>Create ticket</>}
          </button>
        )}
      </div>
    </ToolCard>
  );
}

function AssignCard({ f }: { f: Finding }) {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <ToolCard icon={IC.person} title="Assign owner" sub={f.title} status={sel != null ? { text: `Assigned to ${PEOPLE[sel].name}`, cls: "ok" } : null}>
      <div className="ppl">
        {PEOPLE.map((p, i) => (
          <button
            key={p.name}
            type="button"
            className={`pp${sel === i ? " on" : ""}`}
            onClick={() => {
              setSel(i);
              toast(`${p.name} notified on Slack`);
            }}
          >
            <span className="av" style={p.bg ? { background: p.bg } : undefined}>{p.initials}</span>
            <span className="tx">
              <b>{p.name}</b>
              <small>{p.note}</small>
            </span>
            {p.suggested && <span className="sug">Suggested</span>}
          </button>
        ))}
      </div>
    </ToolCard>
  );
}

function SlackCard({ f }: { f: Finding }) {
  const store = useFindingsState();
  const draft = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);
  // The draft is written once, from the state at the time it was drafted.
  const [html] = useState(() =>
    (store.resolved[f.id] ? "✅ <b>Resolved:</b> " : "🔴 <b>Critical:</b> ") +
    `${f.title} in <code>${f.repo}</code> (${f.file.split(":")[0]}).<br>` +
    (store.resolved[f.id]
      ? "Key rotated and old key deleted. No suspicious use found in CloudTrail."
      : `Key is live. Rotation in progress, ETA 15 min. Owner: @${f.by.split("@")[0]}.`) +
    `<br>Tracking: ${f.id}`,
  );

  return (
    <ToolCard icon={IC.chat} title="#sec-incidents" sub="Slack · 214 members" status={sent ? { text: "Posted", cls: "ok" } : null}>
      <div
        ref={draft}
        className="draft"
        contentEditable={!sent}
        suppressContentEditableWarning
        spellCheck={false}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="tca">
        {sent ? (
          <button className="btn done" type="button" disabled>
            {IC.check}Sent · 2 reactions
          </button>
        ) : (
          <button className="btn primary" type="button" onClick={() => { setSent(true); toast("Posted to #sec-incidents"); }}>
            <span style={{ display: "inline-flex" }}>{IC.chat}</span>Send to #sec-incidents
          </button>
        )}
        <button className="btn" type="button" onClick={() => copy(draft.current?.innerText ?? "", "Message copied")}>
          Copy
        </button>
      </div>
    </ToolCard>
  );
}

function FixCard({ f }: { f: Finding }) {
  const later = useTimers();
  const sec = f.icon === "secret";
  const [state, setState] = useState<"idle" | "busy" | "open" | "passed">("idle");
  const lines: [string, string][] = sec
    ? [
        ["-", "  credentials: {"],
        ["-", '    accessKeyId: "AKIA4X7Q••••••••T2KQ",'],
        ["-", '    secretAccessKey: "wJalr••••••••••••EKEY",'],
        ["-", "  },"],
        ["+", "  // credentials resolved from IAM role at runtime"],
        ["+", "  credentials: fromNodeProviderChain(),"],
      ]
    : [
        ["-", f.code[f.hl]],
        [
          "+",
          f.code[f.hl]
            .replace('"*"', "process.env.ALLOWED_ORIGIN")
            .replace("true", "false")
            .replace("${req.params.id}", "$1")
            .replace("2.14.1", "2.17.1")
            .replace('Principal = "*"', "Principal = { AWS = var.reader_arn }"),
        ],
      ];

  function openPr() {
    setState("busy");
    later(() => {
      setState("open");
      later(() => {
        setState("passed");
        toast("PR #482: all checks passed");
      }, 1600);
    }, 700);
  }

  const status: Status =
    state === "open" ? { text: "PR #482 · checks running", cls: "run" } : state === "passed" ? { text: "PR #482 · checks passed", cls: "ok" } : null;

  return (
    <ToolCard icon={IC.pr} title={f.file.split(":")[0]} sub={`${f.repo} · ${sec ? "1 file, +2 −5" : "1 file, +1 −1"}`} status={status}>
      <div className="diff">
        {lines.map(([sign, text], i) => (
          <div key={i} className={sign === "+" ? "add" : "del"}>
            <i>{sign}</i>
            {text}
          </div>
        ))}
      </div>
      <div className="tca">
        {state === "open" || state === "passed" ? (
          <button className="btn done" type="button" disabled>
            {IC.check}PR #482 opened
          </button>
        ) : (
          <button className="btn primary" type="button" disabled={state === "busy"} onClick={openPr}>
            {state === "busy" ? <><span className="spin" />Opening…</> : <><span style={{ display: "inline-flex" }}>{IC.pr}</span>Open pull request</>}
          </button>
        )}
        <button className="btn" type="button" onClick={() => copy(lines.map(([s, t]) => s + t).join("\n"), "Patch copied")}>
          Copy patch
        </button>
      </div>
    </ToolCard>
  );
}

export function ActionCard({ kind, f }: { kind: CardKind; f: Finding }) {
  switch (kind) {
    case "rotate":
      return <RotateCard f={f} />;
    case "ticket":
      return <TicketCard f={f} />;
    case "assign":
      return <AssignCard f={f} />;
    case "slack":
      return <SlackCard f={f} />;
    case "fix":
      return <FixCard f={f} />;
  }
}
