import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import { useNavigate } from "react-router";
import { toast } from "~/components/ui/Toast";
import type { TurnSpec } from "~/data/chat";
import { findingById } from "~/data/findings";
import { addComment } from "~/lib/findings-store";
import { prefersReducedMotion } from "~/lib/motion";
import { ActionCard } from "./cards";
import { IC } from "./icons";

type Props = {
  spec: TurnSpec;
  /** Finished turns (e.g. after coming back to the screen) render without replaying. */
  done: boolean;
  stopped?: boolean;
  secs?: string;
  /** Set by the Stop button; checked between steps and words. */
  stopRef: RefObject<boolean>;
  onFinish: (stopped: boolean, secs: string) => void;
  onProgress: () => void;
  onFollow: (text: string) => void;
  onRegenerate: () => void;
};

/** Reveals text nodes of `el` a few words at a time; resolves true if stopped. */
function streamInto(el: HTMLElement, html: string, stopRef: RefObject<boolean>, onProgress: () => void, onDone: (stopped: boolean) => void) {
  el.innerHTML = html;
  const nodes: { n: Text; t: string }[] = [];
  const walk = (node: Node) => {
    [...node.childNodes].forEach((c) => {
      if (c.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (c as Text).data.split(/(\s+)/).forEach((p) => {
          if (!p) return;
          const t = document.createTextNode("");
          frag.appendChild(t);
          nodes.push({ n: t, t: p });
        });
        c.parentNode!.replaceChild(frag, c);
      } else walk(c);
    });
  };
  walk(el);
  const caret = document.createElement("span");
  caret.className = "caret";
  el.appendChild(caret);
  let i = 0;
  let timer: ReturnType<typeof setTimeout>;
  const step = () => {
    if (stopRef.current) {
      caret.remove();
      return onDone(true);
    }
    const n = Math.min(nodes.length, i + 3);
    for (; i < n; i++) nodes[i].n.data = nodes[i].t;
    onProgress();
    if (i < nodes.length) timer = setTimeout(step, 26);
    else {
      caret.remove();
      onDone(false);
    }
  };
  step();
  return () => clearTimeout(timer);
}

export function AiTurn({ spec, done, stopped, secs, stopRef, onFinish, onProgress, onFollow, onRegenerate }: Props) {
  const navigate = useNavigate();
  const f = findingById(spec.findingId)!;
  // live phases: steps -> answer (streaming) -> finished
  const [stepIdx, setStepIdx] = useState(done ? spec.steps.length : 0);
  const [phase, setPhase] = useState<"steps" | "answer" | "end">(done ? "end" : "steps");
  const [took, setTook] = useState(secs ?? "");
  const [wasStopped, setWasStopped] = useState(!!stopped);
  const [open, setOpen] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);
  const [pinned, setPinned] = useState(false);
  // Fixed at mount: live turns own the answer's DOM while streaming, so React
  // must not replace it when the parent later marks the turn done.
  const [staticHtml] = useState(done ? spec.html : "");
  const t0 = useRef(Date.now());
  const html = useRef<HTMLDivElement>(null);

  // Reasoning steps, one every 420ms.
  useEffect(() => {
    if (phase !== "steps") return;
    if (stopRef.current) {
      setWasStopped(true);
      setPhase("end");
      onFinish(true, "");
      return;
    }
    if (stepIdx < spec.steps.length) {
      const id = setTimeout(() => setStepIdx((i) => i + 1), stepIdx === 0 ? 0 : prefersReducedMotion() ? 0 : 420);
      onProgress();
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      if (stopRef.current) {
        setWasStopped(true);
        setPhase("end");
        onFinish(true, "");
        return;
      }
      setTook(((Date.now() - t0.current) / 1000).toFixed(1));
      setPhase("answer");
    }, prefersReducedMotion() ? 0 : 420);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stepIdx]);

  // Stream the answer word by word.
  useEffect(() => {
    if (phase !== "answer" || !html.current) return;
    const finish = (s: boolean) => {
      setWasStopped(s);
      setPhase("end");
      onFinish(s, took);
    };
    if (prefersReducedMotion()) {
      html.current.innerHTML = spec.html;
      finish(false);
      return;
    }
    return streamInto(html.current, spec.html, stopRef, onProgress, finish);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "end") onProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const answered = phase !== "steps" && took !== "";
  const complete = phase === "end" && !wasStopped;

  function onBodyClick(e: MouseEvent) {
    const c = (e.target as Element).closest<HTMLElement>(".fchip");
    if (c) navigate(`/findings?open=${c.dataset.f}${c.dataset.tab ? `&tab=${c.dataset.tab}` : ""}`);
  }

  const bodyText = () => html.current?.innerText ?? "";

  return (
    <div className="msg ai">
      <div className={`think${open ? " open" : ""}`}>
        <button className="thh" type="button" onClick={() => setOpen((o) => !o)}>
          {answered ? (
            <>
              <span className="ok">{IC.check}</span>
              <span className="tht">
                Worked through {spec.steps.length} {spec.steps.length === 1 ? "step" : "steps"} · {took}s
              </span>
              <span className="chv">{IC.chev}</span>
            </>
          ) : phase === "end" ? (
            <span className="tht">Stopped before answering</span>
          ) : (
            <>
              <span className="spin" />
              <span className="tht">{spec.steps[Math.max(0, stepIdx - 1)]}…</span>
            </>
          )}
        </button>
        <ul className="thl">
          {spec.steps.slice(0, Math.max(stepIdx, 1)).map((s, i) => (
            <li key={i} className={i < stepIdx - 1 || answered ? "done" : ""}>
              <span className="d">{IC.check}</span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      {answered && (
        <div className="ans">
          {spec.title && (
            <h3>
              {spec.title}
              {spec.mins && <small>{spec.mins}</small>}
            </h3>
          )}
          <div className="body" onClick={onBodyClick}>
            <div style={{ display: "contents" }} ref={html} dangerouslySetInnerHTML={{ __html: staticHtml }} />
            {phase === "end" && wasStopped && <span className="stopped">Stopped</span>}
            {complete && spec.blast && (
              <div className="blast">
                {spec.blast.map(([b, s]) => (
                  <div key={s}>
                    <b>{b}</b>
                    <small>{s}</small>
                  </div>
                ))}
              </div>
            )}
            {complete && spec.sources && (
              <div className="srcs">
                <span className="lbl">Sources</span>
                {spec.sources.map((s, i) => (
                  <button key={i} className="sref" type="button" onClick={() => navigate(`/findings?open=${s.f}&tab=${s.tab}`)}>
                    <i>{i + 1}</i>
                    {s.t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {complete && spec.card && <ActionCard kind={spec.card} f={f} />}

          {complete && (
            <div className="tbar">
              <button
                type="button"
                aria-label="Copy"
                data-tip="Copy"
                className={copied ? "ok" : ""}
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText(bodyText());
                  } catch {}
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1400);
                  toast("Answer copied");
                }}
              >
                {copied ? IC.check : IC.copy}
              </button>
              <button type="button" aria-label="Regenerate" data-tip="Regenerate" onClick={onRegenerate}>
                {IC.redo}
              </button>
              <button
                type="button"
                aria-label="Helpful"
                data-tip="Helpful"
                aria-pressed={vote === "up"}
                className={vote === "up" ? "on" : ""}
                onClick={() => {
                  const on = vote !== "up";
                  setVote(on ? "up" : null);
                  if (on) toast("Thanks, this helps tune answers");
                }}
              >
                {IC.up}
              </button>
              <button
                type="button"
                aria-label="Not helpful"
                data-tip="Not helpful"
                aria-pressed={vote === "down"}
                className={vote === "down" ? "on" : ""}
                onClick={() => {
                  const on = vote !== "down";
                  setVote(on ? "down" : null);
                  if (on) toast("Got it. I’ll keep answers shorter next time");
                }}
              >
                {IC.down}
              </button>
              <button
                type="button"
                aria-label="Save to finding"
                data-tip="Save to finding"
                className={pinned ? "on" : ""}
                onClick={() => {
                  if (pinned) return;
                  addComment(f.id, `AI summary: ${bodyText().slice(0, 160)}…`);
                  setPinned(true);
                  toast(`Saved to ${f.id} comments`);
                }}
              >
                {IC.pin}
              </button>
              <span className="tm">Just now</span>
            </div>
          )}

          {complete && spec.follow && (
            <div className="follow">
              {spec.follow.map((t) => (
                <button key={t} type="button" onClick={() => onFollow(t)}>
                  <span>{IC.arrow}</span>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
