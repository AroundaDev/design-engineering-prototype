import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/chat";
import { AiTurn } from "~/components/chat/AiTurn";
import { CmdGlyph, IC } from "~/components/chat/icons";
import { SevTag } from "~/components/findings/FindingsTable";
import { Icon } from "~/components/ui/icons";
import { Popover, PvItem } from "~/components/ui/Popover";
import { toast } from "~/components/ui/Toast";
import { CMDS, QUICK, SUGGESTED, buildTurn, route, type ActKey } from "~/data/chat";
import { FINDINGS, findingById } from "~/data/findings";
import { useFindingsState } from "~/lib/findings-store";
import { newId, session, type Msg } from "~/lib/chat-session";
import { playOnce, prefersReducedMotion } from "~/lib/motion";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Chat · Security platform" },
    { name: "description", content: "AI security assistant prototype" },
  ];
}

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{ width: 11, height: 11 }}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);

type SuggMode = "sugg" | "cmd" | null;

export default function Chat() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const store = useFindingsState();
  const isRes = useCallback((id: string) => !!store.resolved[id], [store]);

  const [messages, setMessagesState] = useState<Msg[]>(session.messages);
  const [ctx, setCtx] = useState(session.ctx);
  const [ctxVisible, setCtxVisible] = useState(session.ctxVisible);
  const [personalize, setPersonalize] = useState(session.personalize);
  const [web, setWeb] = useState(session.web);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [sugg, setSugg] = useState<SuggMode>(null);
  const [si, setSi] = useState(0);
  const stopRef = useRef(false);
  const conv = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const inctx = useRef<HTMLDivElement>(null);
  const ask = useRef<HTMLInputElement>(null);

  const f = findingById(ctx) ?? FINDINGS[0];

  // Keep the in-memory session in sync so the chat survives leaving the screen.
  const setMessages = useCallback((fn: (m: Msg[]) => Msg[]) => {
    setMessagesState((m) => {
      const next = fn(m);
      session.messages = next;
      return next;
    });
  }, []);
  useEffect(() => {
    Object.assign(session, { ctx, ctxVisible, personalize, web });
  }, [ctx, ctxVisible, personalize, web]);

  const scrollEnd = useCallback(() => {
    const c = conv.current;
    if (c) c.scrollTop = c.scrollHeight;
  }, []);
  useEffect(scrollEnd, [messages, scrollEnd]);

  const seed = useCallback(
    (fid: string): Msg[] => [{ id: newId(), kind: "ctx", fid }],
    [],
  );

  const runTurn = useCallback(
    (act: ActKey, user: Msg | null, fid = ctx) => {
      const fx = findingById(fid) ?? FINDINGS[0];
      stopRef.current = false;
      setBusy(true);
      setSugg(null);
      const turn: Msg = { id: newId(), kind: "ai", spec: buildTurn(act, fx, isRes), done: false };
      setMessages((m) => [...m, ...(user ? [user] : []), turn]);
    },
    [ctx, isRes, setMessages],
  );

  const send = useCallback(
    (text?: string) => {
      const t = (text ?? input).trim();
      if (!t || busy) return;
      setInput("");
      const m = t.match(/^\/(\w+)\s*(.*)$/);
      const c = m && CMDS.find((x) => x.k === `/${m[1].toLowerCase()}`);
      if (c) runTurn(c.act, { id: newId(), kind: "user", text: t, cmd: { k: c.k, rest: m![2] } });
      else runTurn(route(t), { id: newId(), kind: "user", text: t });
    },
    [input, busy, runTurn],
  );

  function quick(act: ActKey) {
    if (busy) return;
    const c = CMDS.find((x) => x.act === act)!;
    runTurn(act, { id: newId(), kind: "user", text: c.k, cmd: { k: c.k, rest: "" } });
  }

  // Entry: a question passed in the URL (top bar, findings drawer), or the
  // opening report the first time the screen is shown.
  const started = useRef(false); // survives React's dev double-run of effects
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const askParam = params.get("ask");
    const ctxParam = params.get("ctx");
    let fid = session.ctx;
    if (ctxParam && findingById(ctxParam)) {
      fid = ctxParam;
      setCtx(fid);
      setCtxVisible(true);
    }
    if (askParam || ctxParam) setParams({}, { replace: true });
    if (askParam) {
      if (!session.played) {
        session.played = true;
        setMessages(() => seed(fid));
      }
      const t = askParam.trim();
      const m = t.match(/^\/(\w+)\s*(.*)$/);
      const c = m && CMDS.find((x) => x.k === `/${m[1].toLowerCase()}`);
      const user: Msg = c ? { id: newId(), kind: "user", text: t, cmd: { k: c.k, rest: m![2] } } : { id: newId(), kind: "user", text: t };
      runTurn(c ? c.act : route(t), user, fid);
      return;
    }
    if (!session.played) {
      session.played = true;
      setMessages(() => seed(fid));
      setTimeout(() => runTurn("report", null, fid), prefersReducedMotion() ? 0 : 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Line under the chat header continues across the sidebar.
  useLayoutEffect(() => {
    const rail = document.getElementById("rail");
    const h = head.current;
    if (!rail || !h) return;
    const sync = () => rail.style.setProperty("--hl", `${h.offsetTop + h.offsetHeight - 1}px`);
    sync();
    rail.dataset.hl = "";
    const ro = new ResizeObserver(sync);
    ro.observe(h);
    return () => {
      ro.disconnect();
      delete rail.dataset.hl;
    };
  }, []);

  function newChat() {
    playOnce(document.getElementById("newchat"), "pulse");
    if (busy) stopRef.current = true;
    setTimeout(() => {
      setSugg(null);
      setMessages(() => seed(ctx));
      runTurn("report", null);
    }, busy ? 60 : 0);
  }

  function onTurnFinish(id: number, stopped: boolean, secs: string) {
    setMessages((m) => m.map((x) => (x.id === id && x.kind === "ai" ? { ...x, done: true, stopped, secs } : x)));
    setBusy(false);
  }

  // ----- suggestion box -----
  const cmdMode = /^\/\w*$/.test(input);
  const cmdList = CMDS.filter((c) => c.k.startsWith(input.toLowerCase()));
  const list = sugg === "cmd" ? cmdList : SUGGESTED;
  const showSugg = sugg !== null && list.length > 0;

  function onInput(v: string) {
    setInput(v);
    setSi(0);
    setSugg(/^\/\w*$/.test(v) ? "cmd" : null);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    const n = list.length;
    if (e.key === "Enter" || (e.key === "Tab" && sugg === "cmd" && showSugg)) {
      e.preventDefault();
      if (showSugg && n && (sugg === "cmd" || !input.trim())) {
        if (sugg === "cmd") send(cmdList[si % n].k);
        else send(SUGGESTED[si % n]);
      } else send();
      return;
    }
    if (showSugg && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setSi((i) => (i + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
    }
    if (e.key === "Escape") setSugg(null);
  }

  function pickContext(id: string) {
    setCtx(id);
    setCtxVisible(true);
    requestAnimationFrame(() => playOnce(inctx.current, "flash"));
    ask.current?.focus();
  }

  return (
    <section id="s-chat" className="screen in" aria-label="AI chat">
      <div className="chat-bg" />
      <div className="chat-h" ref={head}>
        <h1>AI Chat</h1>
        <div className="r">
          <span>Personalize</span>
          <button
            className={`tog${personalize ? "" : " off"}`}
            type="button"
            role="switch"
            aria-checked={personalize}
            aria-label="Personalize answers"
            onClick={() => {
              setPersonalize(!personalize);
              toast(personalize ? "Answers are no longer personalized" : "Answers use your team’s context");
            }}
          />
          <button className="ib" type="button" id="newchat" aria-label="New chat" onClick={newChat}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M4 20h4L19 9l-4-4L4 16z" />
            </svg>
          </button>
          <button
            className="ib"
            type="button"
            aria-label="Share chat"
            onClick={(e) => {
              playOnce(e.currentTarget, "pulse");
              toast("Link to this chat copied");
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="6" r="2.5" />
              <circle cx="18" cy="18" r="2.5" />
              <path d="M8.2 11l7.6-4M8.2 13l7.6 4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="conv" ref={conv}>
        <div className="col">
          {messages.map((m) =>
            m.kind === "ctx" ? (
              <CtxBlock key={m.id} fid={m.fid} resolved={isRes(m.fid)} onOpen={() => navigate(`/findings?open=${m.fid}`)} />
            ) : m.kind === "user" ? (
              <div key={m.id} className="msg">
                <div className="ubub">
                  {m.cmd ? (
                    <>
                      <span className="cmdpill">{m.cmd.k}</span>
                      {m.cmd.rest && ` ${m.cmd.rest}`}
                    </>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            ) : (
              <AiTurn
                key={m.id}
                spec={m.spec}
                done={m.done}
                stopped={m.stopped}
                secs={m.secs}
                stopRef={stopRef}
                onFinish={(stopped, secs) => onTurnFinish(m.id, stopped, secs)}
                onProgress={scrollEnd}
                onFollow={(t) => send(t)}
                onRegenerate={() => {
                  if (busy) return;
                  stopRef.current = false;
                  setBusy(true);
                  setMessages((all) => [
                    ...all,
                    { id: newId(), kind: "ai", spec: { ...m.spec, html: m.spec.alt || m.spec.html }, done: false },
                  ]);
                }}
              />
            ),
          )}
        </div>
      </div>

      {showSugg && (
        <div className="sugg" role="listbox" aria-label={sugg === "cmd" ? "Commands" : "Suggested questions"}>
          <div className="hint">
            <span>{sugg === "cmd" ? "Commands" : "Suggested"}</span>
            <span><kbd>↑</kbd><kbd>↓</kbd>navigate</span>
            <span><kbd>{sugg === "cmd" ? "tab" : "↵"}</kbd>select</span>
            <span className="esc"><kbd>esc</kbd>close</span>
          </div>
          {sugg === "cmd"
            ? cmdList.map((c, i) => (
                <button
                  key={c.k}
                  type="button"
                  role="option"
                  aria-selected={i === si}
                  className={`cmd${i === si ? " on" : ""}`}
                  onMouseEnter={() => setSi(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => send(c.k)}
                >
                  <span className="g"><CmdGlyph name={c.icon} /></span>
                  <b>{c.k}</b>
                  <span className="ds">{c.desc}</span>
                </button>
              ))
            : SUGGESTED.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  role="option"
                  aria-selected={i === si}
                  className={i === si ? "on" : ""}
                  onMouseEnter={() => setSi(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => send(t)}
                >
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                  {t}
                </button>
              ))}
        </div>
      )}

      <div className="qa" role="toolbar" aria-label="Quick actions">
        <span className="qal">{IC.bolt}Quick actions</span>
        {QUICK.map((a) => (
          <button key={a.act} type="button" disabled={busy} onClick={() => quick(a.act)}>
            <span style={{ display: "inline-flex" }}><CmdGlyph name={a.icon} /></span>
            {a.label}
          </button>
        ))}
      </div>

      <div className="inbox">
        {ctxVisible && (
          <div className="inctx" ref={inctx}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 16, height: 16 }}>
              <path d="M9 14l-5-5 5-5M4 9h11a5 5 0 0 1 0 10h-3" />
            </svg>
            <span>{f.file.split(":")[0]}</span>
            <button
              type="button"
              aria-label="Remove context"
              onClick={() => {
                setCtxVisible(false);
                toast("Context removed");
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}
        <div className="inrow">
          <input
            ref={ask}
            value={input}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => {
              if (!busy && session.played && !input) {
                setSi(0);
                setSugg("sugg");
              }
            }}
            onBlur={() => setSugg(null)}
            placeholder="Ask AI anything, or type / for commands"
            aria-label="Ask AI anything"
            autoComplete="off"
          />
          <div className="inbar">
            <Popover
              id="pv-attach"
              up
              left
              dx={-14}
              style={{ maxHeight: 360, overflow: "auto" }}
              trigger={({ open, toggle }) => (
                <button
                  className={`ib${open ? " open" : ""}`}
                  type="button"
                  aria-label="Add a finding as context"
                  title="Add a finding as context"
                  aria-haspopup="true"
                  aria-expanded={open}
                  onClick={() => {
                    setSugg(null);
                    toggle();
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 15, height: 15 }}>
                    <path d="M21 12l-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8" />
                  </svg>
                </button>
              )}
            >
              {(close) => (
                <>
                  <div className="lb">Add context from findings</div>
                  {FINDINGS.map((x) => {
                    const cur = ctx === x.id && ctxVisible;
                    return (
                      <PvItem
                        key={x.id}
                        title={x.title}
                        sub={x.file}
                        glyph={<Icon name={x.icon} />}
                        end={cur ? <span style={{ color: "var(--teal)", display: "inline-flex" }}>{CHECK}</span> : <SevTag f={x} resolved={isRes(x.id)} />}
                        onClick={() => {
                          close();
                          pickContext(x.id);
                        }}
                      />
                    );
                  })}
                </>
              )}
            </Popover>
            <button
              className={`ib${web ? " on" : ""}`}
              type="button"
              aria-label="Include web results"
              title="Include web results"
              aria-pressed={web}
              onClick={() => setWeb(!web)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 15, height: 15 }}>
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
              </svg>
            </button>
            <span className={`webtag${web ? " on" : ""}`}>Web search on</span>
            <button
              className={`go${busy ? " stopping" : ""}`}
              type="button"
              id="go"
              aria-label={busy ? "Stop generating" : "Send"}
              onPointerDown={(e) => {
                if (!busy) playOnce(e.currentTarget, "lift");
              }}
              onClick={() => {
                if (busy) stopRef.current = true;
                else send();
              }}
            >
              {busy ? IC.stop : IC.send}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Finding card + "Get a detailed report" bubble that opens a conversation. */
function CtxBlock({ fid, resolved, onOpen }: { fid: string; resolved: boolean; onOpen: () => void }) {
  const f = findingById(fid)!;
  const card = useRef<HTMLButtonElement>(null);
  const last = useRef(resolved);
  useEffect(() => {
    if (last.current === resolved) return;
    last.current = resolved;
    playOnce(card.current?.querySelector(".sev") ?? null, "pop");
    playOnce(card.current, "ctxping");
  }, [resolved]);

  return (
    <div className="ctx">
      <div className="ctxwrap">
        <button className="ctxcard" type="button" ref={card} onClick={onOpen}>
          <span className="ci"><Icon name={f.icon} /></span>
          <span>
            {f.repo}, {f.scan.toLowerCase()}
            <small>
              {f.id} · <SevTag f={f} resolved={resolved} />
            </small>
          </span>
        </button>
      </div>
      <div className="ubub">Get a detailed report</div>
    </div>
  );
}
