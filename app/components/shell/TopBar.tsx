import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { SevTag } from "~/components/findings/FindingsTable";
import { Icon, SendIcon } from "~/components/ui/icons";
import { Popover, PvItem } from "~/components/ui/Popover";
import { toast } from "~/components/ui/Toast";
import { FINDINGS } from "~/data/findings";
import { findingsHref } from "~/data/overview";
import { useFindingsState } from "~/lib/findings-store";
import { playOnce, prefersReducedMotion } from "~/lib/motion";
import { WORKSPACES, pushRecent, recentSearches, setPrefs, usePrefs } from "~/lib/ui-store";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24" } as const;
const SVG = {
  search: <svg {...S}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>,
  clock: <svg {...S}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  spark: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 3l1.8 4.9L17 10l-5.2 2.1L10 17l-1.8-4.9L3 10l5.2-2.1z" /></svg>,
  grid: <svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg>,
  bars: <svg {...S} strokeLinecap="round"><path d="M6 20V11M12 20V5M18 20v-6" /></svg>,
  lock: <svg {...S}><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>,
  kbd: <svg {...S}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></svg>,
  rows: <svg {...S}><path d="M4 6h16M4 12h16M4 18h16" /></svg>,
  bell: <svg {...S}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /></svg>,
  arrow: <svg {...S} style={{ width: 13, height: 13 }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
};

const JUMP = [
  { to: "/", label: "Security overview", icon: SVG.grid, key: "O" },
  { to: "/findings", label: "Findings", icon: SVG.bars, key: "F" },
  { to: "/posture", label: "Security posture center", icon: SVG.lock, key: "P" },
  { to: "/chat", label: "AI chat", icon: SVG.spark, key: "C" },
];

const NOTIFS = [
  { id: "FND-8f3a9c11", title: "New critical finding", text: "AWS Access Key Exposed · payment-service", when: "2h ago" },
  { id: "FND-e5f9c3a2", title: "Severity raised", text: "Public S3 Bucket Policy is now High", when: "5h ago" },
  { id: "FND-2c71de04", title: "Reminder", text: "Hardcoded JWT Secret is past its due date", when: "1d ago" },
];

/** Wraps the first case-insensitive match of `q` in <mark>. */
function highlight(s: string, q: string): ReactNode {
  const i = q ? s.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return s;
  return (
    <>
      {s.slice(0, i)}
      <mark>{s.slice(i, i + q.length)}</mark>
      {s.slice(i + q.length)}
    </>
  );
}

type Row = { key: string; title: ReactNode; sub?: ReactNode; glyph: ReactNode; teal?: boolean; end?: ReactNode; run: () => void };

export function TopBar() {
  const navigate = useNavigate();
  const store = useFindingsState();
  const prefs = usePrefs();
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const bell = useRef<HTMLButtonElement>(null);
  const send = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const notif = useRef<HTMLDivElement>(null);
  const panelList = useRef<HTMLDivElement>(null);

  function finishSearch() {
    setQ("");
    setSearchOpen(false);
    input.current?.blur();
  }

  function go(to: string) {
    finishSearch();
    navigate(to);
  }

  function askAI() {
    playOnce(send.current, "fly");
    const term = q.trim();
    pushRecent(term);
    finishSearch();
    navigate(term ? `/chat?ask=${encodeURIComponent(term)}` : "/chat");
  }

  // ----- search results -----
  const term = q.trim();
  const matches = term
    ? FINDINGS.filter((f) => `${f.title} ${f.id} ${f.file} ${f.asset} ${f.repo} ${f.ref}`.toLowerCase().includes(term.toLowerCase())).slice(0, 4)
    : [];
  const sections: { label: ReactNode; rows: Row[]; none?: string }[] = term
    ? [
        {
          label: (
            <>
              <span>Findings</span>
              <span>{matches.length} {matches.length === 1 ? "match" : "matches"}</span>
            </>
          ),
          none: matches.length ? undefined : `No findings match “${term}”. Try a repo, file or CWE.`,
          rows: matches.map((f) => ({
            key: f.id,
            title: highlight(f.title, term),
            sub: highlight(`${f.asset} · ${f.file}`, term),
            glyph: <Icon name={f.icon} />,
            end: <SevTag f={f} resolved={!!store.resolved[f.id]} />,
            run: () => {
              pushRecent(term);
              go(`/findings?open=${f.id}`);
            },
          })),
        },
        {
          label: null,
          rows: [
            {
              key: "ask",
              title: `Ask AI “${term}”`,
              sub: "Answers with context from your findings",
              glyph: SVG.spark,
              teal: true,
              run: () => {
                pushRecent(term);
                go(`/chat?ask=${encodeURIComponent(term)}`);
              },
            },
            ...(matches.length
              ? [
                  {
                    key: "all",
                    title: "Show all results in Findings",
                    glyph: SVG.search,
                    run: () => {
                      pushRecent(term);
                      go(findingsHref({ q: term }));
                    },
                  },
                ]
              : []),
          ],
        },
      ]
    : [
        {
          label: "Recent",
          rows: recentSearches.map((r) => ({
            key: `r-${r}`,
            title: r,
            glyph: SVG.clock,
            end: SVG.arrow,
            run: () => {
              setQ(r);
              setActive(0);
              input.current?.focus();
            },
          })),
        },
        {
          label: "Jump to",
          rows: JUMP.map((j) => ({
            key: j.to,
            title: j.label,
            glyph: j.icon,
            end: (
              <>
                <kbd>G</kbd>
                <kbd>{j.key}</kbd>
              </>
            ),
            run: () => go(j.to),
          })),
        },
      ];
  const rows = sections.flatMap((s) => s.rows);

  useEffect(() => {
    panelList.current?.querySelector(".it.act")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    const n = rows.length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!n) return;
      setActive((a) => (a + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      rows[active % Math.max(n, 1)]?.run();
    } else if (e.key === "Escape") {
      finishSearch();
    }
  }

  // ----- notifications -----
  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!notif.current?.contains(t) && !bell.current?.contains(t)) setNotifOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setNotifOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  return (
    <>
      <div className="top">
        <Popover
          id="pv-search"
          open={searchOpen}
          onOpenChange={(o) => {
            setSearchOpen(o);
            if (!o) setQ("");
          }}
          trigger={() => (
            <form
              className={`pill search${searchOpen ? " open" : ""}${q ? " typed" : ""}`}
              role="search"
              onSubmit={(e) => e.preventDefault()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 18, height: 18, opacity: 0.85 }}>
                <path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8z" />
                <path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" />
              </svg>
              <input
                ref={input}
                id="gq"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                onFocus={() => {
                  setActive(0);
                  setNotifOpen(false);
                  setTimeout(() => setSearchOpen(true), prefersReducedMotion() ? 0 : 120);
                }}
                onKeyDown={onSearchKey}
                placeholder="Search"
                aria-label="Search findings or ask AI"
                aria-expanded={searchOpen}
                aria-controls="pv-search"
                autoComplete="off"
              />
              <kbd className="sk" aria-hidden="true">/</kbd>
              <button ref={send} className="ib t" type="button" aria-label="Ask AI" style={{ marginLeft: 4 }} onClick={askAI}>
                <SendIcon size={18} />
              </button>
            </form>
          )}
        >
          {() => (
            <div ref={panelList}>
              {sections.map((s, si) => {
                const offset = sections.slice(0, si).reduce((n, x) => n + x.rows.length, 0);
                return (
                  <Fragment key={si}>
                    {s.label ? <div className="lb">{s.label}</div> : <div className="sep" />}
                    {s.none && <div className="none">{s.none}</div>}
                    {s.rows.map((r, i) => (
                      <SearchRow key={r.key} row={r} active={offset + i === active % Math.max(rows.length, 1)} onHover={() => setActive(offset + i)} />
                    ))}
                  </Fragment>
                );
              })}
              <div className="foot">
                <span><kbd>↑</kbd><kbd>↓</kbd>navigate</span>
                <span><kbd>↵</kbd>open</span>
                <span style={{ marginLeft: "auto" }}><kbd>esc</kbd>close</span>
              </div>
            </div>
          )}
        </Popover>

        <button
          ref={bell}
          className={`pill bell${seen ? " seen" : ""}`}
          type="button"
          aria-label="Notifications"
          aria-haspopup="menu"
          aria-expanded={notifOpen}
          onClick={() => {
            playOnce(bell.current, "ringing");
            setSeen(true);
            setNotifOpen((o) => !o);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 20, height: 20 }}>
            <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
          <i />
        </button>

        <Popover
          id="pv-user"
          trigger={({ open, toggle }) => (
            <button
              className={`pill user${open ? " open" : ""}`}
              type="button"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={toggle}
            >
              <span className="av">AR</span>
              <span>
                <b>Ariel R</b>
                <small>ariel.r@company.com</small>
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 16, height: 16, opacity: 0.6, marginLeft: 4 }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
        >
          {(close) => (
            <>
              <div className="ph">
                <span className="av">AR</span>
                <span>
                  <b>Ariel R</b>
                  <small>ariel.r@company.com</small>
                  <span className="ws">{prefs.workspace}</span>
                </span>
                <span className="role">Security lead</span>
              </div>
              <div className="sep" />
              <div className="lb">Workspace</div>
              {WORKSPACES.map((w) => (
                <PvItem
                  key={w.name}
                  title={w.name}
                  sub={w.sub}
                  on={prefs.workspace === w.name}
                  pre={<span className="rd" />}
                  onClick={() => {
                    if (prefs.workspace === w.name) return;
                    setPrefs({ workspace: w.name });
                    toast(`Switched to ${w.name}`);
                  }}
                />
              ))}
              <div className="sep" />
              <PvItem
                title="Compact table rows"
                glyph={SVG.rows}
                end={<span className={`tog${prefs.compact ? "" : " off"}`} />}
                onClick={() => {
                  setPrefs({ compact: !prefs.compact });
                  toast(prefs.compact ? "Comfortable rows on" : "Compact rows on");
                }}
              />
              <PvItem
                title="Sound on critical alerts"
                glyph={SVG.bell}
                end={<span className={`tog${prefs.sound ? "" : " off"}`} />}
                onClick={() => setPrefs({ sound: !prefs.sound })}
              />
              <PvItem
                title="Keyboard shortcuts"
                glyph={SVG.kbd}
                end={<kbd>?</kbd>}
                onClick={() => {
                  close();
                  setPrefs({ shortcutsOpen: true });
                }}
              />
            </>
          )}
        </Popover>
      </div>

      <div className={`notif${notifOpen ? " on" : ""}`} role="menu" ref={notif} aria-hidden={!notifOpen}>
        {NOTIFS.map((n) => (
          <button
            key={n.id}
            type="button"
            role="menuitem"
            tabIndex={notifOpen ? 0 : -1}
            onClick={() => {
              setNotifOpen(false);
              navigate(`/findings?open=${n.id}`);
            }}
          >
            <span className="warn"><Icon name="warn" /></span>
            <span>
              <b style={{ fontWeight: 500 }}>{n.title}</b>
              <small>{n.text} · {n.when}</small>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function SearchRow({ row, active, onHover }: { row: Row; active: boolean; onHover: () => void }) {
  return (
    <button className={`it${active ? " act" : ""}`} type="button" onMouseEnter={onHover} onMouseDown={(e) => e.preventDefault()} onClick={row.run}>
      <span className={`g${row.teal ? " t" : ""}`}>{row.glyph}</span>
      <span className="tx">
        <span>{row.title}</span>
        {row.sub && <small>{row.sub}</small>}
      </span>
      {row.end && <span className="end">{row.end}</span>}
    </button>
  );
}
