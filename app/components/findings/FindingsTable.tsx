import { useState, type CSSProperties } from "react";
import { Card } from "~/components/ui/Card";
import { Icon } from "~/components/ui/icons";
import { Popover, PvItem } from "~/components/ui/Popover";
import { toast } from "~/components/ui/Toast";
import { SEVERITIES, cap, type Finding, type Severity } from "~/data/findings";
import type { FindingsFilter } from "~/data/overview";
import { playOnce, prefersReducedMotion } from "~/lib/motion";
import { usePrefs } from "~/lib/ui-store";

export const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{ width: 11, height: 11 }}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);
const ROW_CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} style={{ width: 12, height: 12 }}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);

export function SevTag({ f, resolved }: { f: Finding; resolved: boolean }) {
  return <span className={`sev ${resolved ? "resolved" : f.sev}`}>{resolved ? "Resolved" : cap(f.sev)}</span>;
}

type ColKey = "type" | "asset" | "age";
const COL_W: Record<ColKey, string> = { type: "1.1fr", asset: "1.2fr", age: "90px" };

type Props = {
  rows: Finding[];
  filter: FindingsFilter;
  /** Changes when the filter changes, so rows replay their entrance. */
  listKey: string;
  selected: string | null;
  isResolved: (id: string) => boolean;
  onFilter: (next: FindingsFilter) => void;
  onOpen: (id: string) => void;
  delay: number;
};

/** "Details" card: search, filter chips, column picker, export and the findings list. */
export function FindingsTable({ rows, filter, listKey, selected, isResolved, onFilter, onOpen, delay }: Props) {
  const [cols, setCols] = useState<Record<ColKey, boolean>>({ type: true, asset: true, age: true });
  const [exporting, setExporting] = useState<"idle" | "busy" | "done">("idle");
  const rm = prefersReducedMotion();
  const { compact } = usePrefs();

  const template = ["44px", "2.2fr", "1fr", ...(Object.keys(COL_W) as ColKey[]).filter((k) => cols[k]).map((k) => COL_W[k])];
  const hidden = (Object.keys(cols) as ColKey[]).filter((k) => !cols[k]).map((k) => ` h-${k}`).join("");

  function runExport(name: string, n: number, btn: HTMLElement | null) {
    setExporting("busy");
    setTimeout(() => {
      setExporting("done");
      toast(`${name} · ${n} findings ready`);
      setTimeout(() => {
        setExporting("idle");
        playOnce(btn, "drop");
      }, 1400);
    }, rm ? 300 : 950);
  }

  const chips = (
    <div className="fchips">
      {(["sev", "type", "status"] as const).map((k) =>
        filter[k] ? (
          <button key={k} className="chip on" type="button" aria-label="Clear filter" onClick={() => onFilter({ ...filter, [k]: undefined })}>
            {{ sev: "Severity: ", type: "Type: ", status: "Status: " }[k]}
            {filter[k]}
            <span className="x">✕</span>
          </button>
        ) : null,
      )}
      {!filter.sev &&
        SEVERITIES.map((s: Severity) => (
          <button key={s} className="chip" type="button" onClick={() => onFilter({ ...filter, sev: s })}>
            {cap(s)}
          </button>
        ))}
    </div>
  );

  return (
    <Card
      title="Details"
      className={`det${hidden}${compact ? " compact" : ""}`}
      delay={delay}
      icon={
        <svg viewBox="0 0 24 24" fill="#fff">
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M9 9v6M14 11v4" stroke="#1b1e21" strokeWidth={2} />
        </svg>
      }
      action={
        <>
          <label className="fsearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14, opacity: 0.6 }}>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              value={filter.q ?? ""}
              onChange={(e) => onFilter({ ...filter, q: e.target.value || undefined })}
              placeholder="Search by title, file, or ID"
              aria-label="Search findings"
            />
          </label>

          <Popover
            id="pv-cols"
            trigger={({ open, toggle }) => (
              <button id="cols" className={`btn${open ? " open" : ""}`} type="button" aria-haspopup="true" aria-expanded={open} onClick={toggle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M9 4v16M15 4v16" />
                </svg>
                Columns
              </button>
            )}
          >
            {() => (
              <>
                <div className="lb">
                  <span>Visible columns</span>
                  <span>{3 + Object.values(cols).filter(Boolean).length} of 6</span>
                </div>
                {(
                  [
                    ["Title", null],
                    ["Severity", null],
                    ["Type", "type"],
                    ["Asset", "asset"],
                    ["Age", "age"],
                  ] as const
                ).map(([label, key]) => (
                  <PvItem
                    key={label}
                    title={label}
                    disabled={!key}
                    pre={<span className={`ck${!key || cols[key] ? " on" : ""}`}>{CHECK}</span>}
                    end={key ? undefined : "Always"}
                    onClick={key ? () => setCols((c) => ({ ...c, [key]: !c[key] })) : undefined}
                  />
                ))}
              </>
            )}
          </Popover>

          <Popover
            id="pv-exp"
            trigger={({ open, toggle }) => (
              <button
                id="exp"
                className={`btn${open ? " open" : ""}${exporting !== "idle" ? " busy" : ""}`}
                type="button"
                aria-haspopup="true"
                aria-expanded={open}
                onClick={toggle}
              >
                {exporting === "busy" ? (
                  <>
                    <span className="spin" />
                    Exporting…
                    <span className="bar" />
                  </>
                ) : exporting === "done" ? (
                  <>
                    <span style={{ color: "var(--ok)", display: "inline-flex" }}>{CHECK}</span>
                    Exported
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
                    </svg>
                    Export
                  </>
                )}
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="lb">
                  <span>Export {rows.length} findings</span>
                  <span>current filters</span>
                </div>
                {EXPORTS.map(([title, sub, file, glyph]) => (
                  <PvItem
                    key={title}
                    title={title}
                    sub={sub}
                    glyph={glyph}
                    onClick={() => {
                      close();
                      runExport(file, rows.length, document.getElementById("exp"));
                    }}
                  />
                ))}
              </>
            )}
          </Popover>
        </>
      }
    >
      {chips}
      <div className="thead" style={{ "--cols": template.join(" ") } as CSSProperties}>
        <span><span className="cb" /></span>
        <span>Title</span>
        <span>Severity</span>
        <span>Type</span>
        <span>Asset</span>
        <span className="agecol">Age</span>
      </div>
      <div className="tbody" role="list" key={listKey} style={{ "--cols": template.join(" ") } as CSSProperties}>
        {rows.length === 0 ? (
          <div className="empty">
            No findings match these filters.
            <br />
            <button type="button" onClick={() => onFilter({})}>Clear filters</button>
          </div>
        ) : (
          rows.map((f, i) => {
            const res = isResolved(f.id);
            const on = selected === f.id;
            return (
              <button
                key={f.id}
                className={`tr${on ? " on" : ""}`}
                type="button"
                role="listitem"
                aria-label={`${f.title}, ${res ? "resolved" : f.sev}`}
                aria-current={on || undefined}
                style={{ animationDelay: `${i * 0.04}s` }}
                onClick={() => onOpen(f.id)}
              >
                <span><span className="cb">{on ? ROW_CHECK : null}</span></span>
                <span>
                  {f.title}
                  <small>{f.cat}</small>
                </span>
                <span><SevTag f={f} resolved={res} /></span>
                <span className="ty">
                  <span className="ic"><Icon name={f.icon} /></span>
                  <span>
                    {f.type}
                    <small>{f.typeSub}</small>
                  </span>
                </span>
                <span>{f.asset}</span>
                <span className="age">{f.age}</span>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}

const G = { fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24" } as const;
const EXPORTS = [
  ["CSV", "Spreadsheet, one row per finding", "findings.csv", <svg {...G}><path d="M4 6h16M4 12h16M4 18h16" /></svg>],
  ["JSON", "Full detail, for scripts and SIEM", "findings.json", <svg {...G}><path d="M8 7l-5 5 5 5M16 7l5 5-5 5" /></svg>],
  [
    "PDF summary",
    "Report with charts for stakeholders",
    "security-summary.pdf",
    <svg {...G}><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /></svg>,
  ],
] as const;
