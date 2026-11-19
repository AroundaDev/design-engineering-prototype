import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { setPrefs, usePrefs } from "~/lib/ui-store";

const ROUTES: Record<string, string> = { o: "/", f: "/findings", p: "/posture", c: "/chat" };

const k = (...keys: string[]) => keys.map((x) => <kbd key={x}>{x}</kbd>);
const ROWS: [string, ReactNode][] = [
  ["Search or ask AI", k("/")],
  ["Go to overview", <>{k("G")} then {k("O")}</>],
  ["Go to findings", <>{k("G")} then {k("F")}</>],
  ["Go to posture center", <>{k("G")} then {k("P")}</>],
  ["Open AI chat", <>{k("G")} then {k("C")}</>],
  ["Navigate lists", k("↑", "↓")],
  ["Close panel or menu", k("esc")],
  ["Show or hide sidebar", k("[")],
  ["Show this list", k("?")],
];

/**
 * Global keyboard shortcuts: "/" focuses search, "?" opens the shortcuts
 * list, "G" then O/F/P/C switches screens (with a "Go to…" hint).
 * "[" (sidebar) lives in Shell.
 */
export function Shortcuts() {
  const navigate = useNavigate();
  const { shortcutsOpen } = usePrefs();
  const [chord, setChord] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (shortcutsOpen) closeBtn.current?.focus();
  }, [shortcutsOpen]);

  useEffect(() => {
    let waiting = false;
    let timer: ReturnType<typeof setTimeout>;
    const stopChord = () => {
      waiting = false;
      setChord(false);
      clearTimeout(timer);
    };
    const onKey = (e: KeyboardEvent) => {
      const open = document.querySelector(".mdl.on");
      if (e.key === "Escape" && open) {
        e.stopPropagation();
        setPrefs({ shortcutsOpen: false });
        return;
      }
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (waiting) {
        const to = ROUTES[e.key.toLowerCase()];
        stopChord();
        if (to) {
          e.preventDefault();
          setPrefs({ shortcutsOpen: false });
          navigate(to);
        }
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        setPrefs({ shortcutsOpen: false });
        document.getElementById("gq")?.focus();
      } else if (e.key === "?") {
        e.preventDefault();
        setPrefs({ shortcutsOpen: !open });
      } else if (e.key.toLowerCase() === "g") {
        waiting = true;
        setChord(true);
        timer = setTimeout(stopChord, 1200);
      }
    };
    addEventListener("keydown", onKey, true);
    return () => {
      removeEventListener("keydown", onKey, true);
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <>
      <div
        className={`mdl${shortcutsOpen ? " on" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        aria-hidden={!shortcutsOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPrefs({ shortcutsOpen: false });
        }}
      >
        <div className="box2">
          <h2>
            Keyboard shortcuts
            <button ref={closeBtn} type="button" aria-label="Close" tabIndex={shortcutsOpen ? 0 : -1} onClick={() => setPrefs({ shortcutsOpen: false })}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </h2>
          {ROWS.map(([label, keys]) => (
            <div key={label} className="row">
              <span>{label}</span>
              <span>{keys}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={`chord${chord ? " on" : ""}`} aria-hidden="true">
        Go to… {k("O")} overview {k("F")} findings {k("P")} posture {k("C")} chat
      </div>
    </>
  );
}
