import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/posture";
import { toast } from "~/components/ui/Toast";
import { totals } from "~/data/findings";
import { findingsHref, type FindingsFilter } from "~/data/overview";
import { useFindingsState } from "~/lib/findings-store";
import { fmt, useCountUp, useEntered } from "~/lib/motion";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Security posture center · Security platform" },
    { name: "description", content: "Security posture center prototype" },
  ];
}

/** Scan sources on the left; null means no findings in this demo. */
const SOURCES: [string, FindingsFilter | null][] = [
  ["Secrets detection", { type: "Secrets" }],
  ["SAST", { type: "SAST" }],
  ["SCA", { type: "SCA" }],
  ["IaC", { type: "IaC" }],
  ["SCM posture", { type: "SCM-PM" }],
  ["Container security", null],
  ["Cloud misconfig", { type: "IaC" }],
  ["API security", { type: "SAST", q: "cors" }],
  ["Other scans", null],
];

const TOTAL = 2521;

type Paths = { wires: string[]; ribbons: string[]; w: number; h: number };

export default function Posture() {
  const entered = useEntered(30);
  const total = useCountUp(TOTAL, 1600, entered);
  const store = useFindingsState();
  const t = totals(Object.keys(store.resolved));
  const navigate = useNavigate();
  const [hot, setHot] = useState<number | null>(null);
  const [paths, setPaths] = useState<Paths>({ wires: [], ribbons: [], w: 0, h: 0 });
  const po = useRef<HTMLDivElement>(null);
  const core = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLElement | null)[]>([]);
  const groups = useRef<(HTMLDivElement | null)[]>([]);

  // Wires (sources -> core) and ribbons (core -> stat groups) are measured from
  // the laid-out elements, in unscaled canvas pixels, and redrawn on resize
  // (window resize, sidebar collapse).
  useLayoutEffect(() => {
    const box = po.current!;
    const layout = () => {
      const pr = box.getBoundingClientRect();
      const sc = pr.width / box.offsetWidth || 1;
      const W = box.offsetWidth;
      const H = box.offsetHeight;
      const cr = core.current!.getBoundingClientRect();
      const cx = (cr.left + cr.width / 2 - pr.left) / sc;
      const cy = (cr.top + cr.height / 2 - pr.top) / sc;
      const R0 = cr.width / 2 / sc;
      const wires = dots.current.map((dot, i) => {
        if (!dot) return "";
        const r = dot.getBoundingClientRect();
        const x = (r.right - pr.left) / sc + 2;
        const y = (r.top + r.height / 2 - pr.top) / sc;
        const ty = cy + (i - 4) * 12;
        const tx = cx - R0 * 0.82;
        return `M${x.toFixed(1)} ${y.toFixed(1)} C${(x + 130).toFixed(1)} ${y.toFixed(1)} ${(tx - 120).toFixed(1)} ${ty.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
      });
      const ribbons = groups.current.map((g, k) => {
        if (!g) return "";
        const r = g.getBoundingClientRect();
        const gx = (r.left - pr.left) / sc;
        const gy = (r.top + r.height / 2 - pr.top) / sc;
        const sx = cx + R0 * 0.8;
        const sy = cy + (k ? 24 : -24);
        return `M${sx} ${sy} C${sx + 70} ${sy} ${gx - 80} ${gy} ${gx + 4} ${gy}`;
      });
      setPaths({ wires, ribbons, w: W, h: H });
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(box);
    // Measure again once the entrance slide (.rv translateY) has settled.
    const settle = setTimeout(layout, 900);
    return () => {
      ro.disconnect();
      clearTimeout(settle);
    };
  }, []);

  function stat(n: number, label: string, delta: string | null, filter: FindingsFilter | null, full = false) {
    const down = delta?.startsWith("+") && ["Critical", "High", "Medium"].includes(label);
    return (
      <button
        key={label}
        className={`sc${full ? " full" : ""}`}
        type="button"
        onClick={() => (filter ? navigate(findingsHref(filter)) : toast(`${label}: ${fmt(n)} findings`))}
      >
        <b>{fmt(n)}</b>
        {delta && <em className={down ? "dn" : "up"}>{delta}</em>}
        <small>{label}</small>
      </button>
    );
  }

  return (
    <section id="s-posture" className={`screen${entered ? " in" : ""}`} aria-label="Security posture center">
      <div className="po-bg" />
      <div className="rv" style={{ position: "relative", zIndex: 2 }}>
        <p className="crumb">
          <Link to="/">Dashboard</Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span>Posture</span>
        </p>
        <h1>Security posture center</h1>
      </div>

      <div className="po" ref={po}>
        <svg className="wires" viewBox={`0 0 ${paths.w} ${paths.h}`} width={paths.w} height={paths.h} aria-hidden="true">
          <defs>
            <linearGradient id="wg" x1="0" x2="1">
              <stop offset="0" stopColor="#FF8A1F" stopOpacity=".9" />
              <stop offset="1" stopColor="#FF8A1F" stopOpacity=".1" />
            </linearGradient>
          </defs>
          {paths.wires.map((d, i) =>
            d ? (
              <path key={i} d={d} className={hot === i ? "hot" : ""} style={{ transitionDelay: `${0.25 + i * 0.06}s` }} />
            ) : null,
          )}
        </svg>

        <div className="sources rv">
          <h3>Scan sources</h3>
          {SOURCES.map(([label, filter], i) => (
            <button
              key={label}
              className={`src${hot === i ? " on" : ""}`}
              type="button"
              onMouseEnter={() => setHot(i)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(null)}
              onClick={() => (filter ? navigate(findingsHref(filter)) : toast(`${label} has no open findings in this demo`))}
            >
              <span>{label}</span>
              <i ref={(el) => { dots.current[i] = el; }} />
            </button>
          ))}
        </div>

        <div className="core" ref={core}>
          <div className="rv" style={{ position: "absolute", inset: 0, transitionDelay: ".15s" }}>
            <div className="ring" />
            <div className="ball">
              <div>
                <span style={{ position: "relative", display: "inline-block" }}>
                  <b>{fmt(total)}</b>
                  <sup>+2.4%</sup>
                </span>
                <small>Total findings</small>
              </div>
            </div>
          </div>
        </div>

        <svg className="ribbons" viewBox={`0 0 ${paths.w} ${paths.h}`} width={paths.w} height={paths.h} aria-hidden="true">
          <defs>
            <filter id="rb" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <linearGradient id="rg" x1="0" x2="1">
              <stop offset="0" stopColor="#2EE6D6" stopOpacity=".05" />
              <stop offset=".55" stopColor="#2EE6D6" />
              <stop offset="1" stopColor="#2EE6D6" stopOpacity=".35" />
            </linearGradient>
          </defs>
          {paths.ribbons.map((d, i) =>
            d ? <path key={i} d={d} stroke="url(#rg)" strokeWidth={18} fill="none" filter="url(#rb)" /> : null,
          )}
        </svg>

        <div className="side" id="side">
          <div className="sh rv" style={{ transitionDelay: ".3s" } as CSSProperties}>
            <span className="ci">
              <svg viewBox="0 0 24 24" fill="#FFB347">
                <path d="M12 2c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-3-1-5 0-7z" />
              </svg>
            </span>
            Active findings
            <span>{fmt(t.active)}</span>
          </div>
          <div className="sg rv" style={{ transitionDelay: ".36s" }} ref={(el) => { groups.current[0] = el; }}>
            {stat(t.activeCrit, "Critical", "+18%", { sev: "critical" })}
            {stat(t.activeHigh, "High", "-3%", { sev: "high" })}
            {stat(480, "Medium", "+5%", { sev: "medium" })}
            {stat(246, "Low", "-1%", { sev: "low" })}
          </div>
          <div className="sh rv" style={{ transitionDelay: ".42s" }}>
            <span className="ci">
              <svg viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
                <path d="M8.5 12l2.5 2.5 4.5-5" stroke="#1b1e21" strokeWidth={2} fill="none" />
              </svg>
            </span>
            Resolved findings
            <span>{fmt(t.resolved)}</span>
          </div>
          <div className="sg rv" style={{ transitionDelay: ".48s" }} ref={(el) => { groups.current[1] = el; }}>
            {stat(t.fixed, "Confirmed fixed", null, { status: "resolved" })}
            {stat(298, "Under remediation", null, null)}
            {stat(145, "Awaiting verification", null, null, true)}
          </div>
        </div>
      </div>
    </section>
  );
}
