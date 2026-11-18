import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Card } from "~/components/ui/Card";
import { RANGES, type RangeKey } from "~/data/overview";
import { appScale, tween } from "~/lib/motion";

const W = 440;
const H = 200;
const MAX = 15;
const RESOLVED_LEVEL = 1.1;
const y = (v: number) => H - (v / MAX) * (H - 20);

type Hover = { px: number; py: number; tx: number; value: number };

/** Range tabs with a sliding pill; the indicator jumps on first paint, then glides. */
function RangeTabs({ value, onChange }: { value: RangeKey; onChange: (k: RangeKey) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    const place = (instant: boolean) => {
      const b = box.current?.querySelector<HTMLElement>("button.on");
      const p = pill.current;
      if (!b || !p) return;
      if (instant) p.style.transition = "none";
      p.style.width = `${b.offsetWidth}px`;
      p.style.transform = `translateX(${b.offsetLeft}px)`;
      if (instant) {
        void p.offsetWidth;
        p.style.transition = "";
      }
    };
    place(first.current);
    first.current = false;
    // Inter can load after first paint and change button widths.
    document.fonts?.ready.then(() => place(true));
  }, [value]);

  return (
    <div className="tabs" role="tablist" aria-label="Range" ref={box}>
      <span className="tind" ref={pill} aria-hidden="true" />
      {RANGES.map((r) => (
        <button
          key={r.key}
          type="button"
          role="tab"
          aria-selected={r.key === value}
          className={r.key === value ? "on" : undefined}
          onClick={() => onChange(r.key)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export function OpenVsResolved({ run, delay }: { run: boolean; delay: number }) {
  const [range, setRange] = useState<RangeKey>("6m");
  const [reveal, setReveal] = useState(0); // 0..1 clip width
  const [hover, setHover] = useState<Hover | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const data = RANGES.find((r) => r.key === range)!;

  const { line, area, peak } = useMemo(() => {
    const pts = data.values.map((v, i) => [(i * W) / (data.values.length - 1), y(v)] as const);
    const line = "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");
    const area = `${line} L${W} ${H} L0 ${H}Z`;
    const peak = pts.reduce((a, p) => (p[1] < a[1] ? p : a));
    return { line, area, peak };
  }, [data]);

  // Draw the line in from the left on entrance and on every range change.
  useEffect(() => {
    if (!run) return;
    setReveal(0);
    return tween(1100, setReveal);
  }, [run, range]);

  function onPointer(e: PointerEvent<HTMLDivElement>) {
    const ch = chartRef.current!;
    const r = ch.getBoundingClientRect();
    const k = appScale(ch);
    const cw = ch.offsetWidth;
    const chh = ch.offsetHeight;
    const n = data.values.length;
    const i = Math.max(0, Math.min(n - 1, Math.round((((e.clientX - r.left) / k) / cw) * (n - 1))));
    const px = (i / (n - 1)) * cw;
    const py = (y(data.values[i]) / H) * chh;
    setHover({ px, py, tx: Math.max(60, Math.min(cw - 60, px)), value: data.values[i] });
  }

  const res = y(RESOLVED_LEVEL);

  return (
    <Card
      title="Open vs. Resolved"
      delay={delay}
      icon={
        <svg viewBox="0 0 24 24" fill="#fff">
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M9 9v6M14 11v4" stroke="#1b1e21" strokeWidth={2} />
        </svg>
      }
      action={<RangeTabs value={range} onChange={setRange} />}
    >
      <div
        ref={chartRef}
        className={`chart${hover ? " hov" : ""}`}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Open findings over ${data.label}`}>
          <defs>
            <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FF7A1A" stopOpacity=".55" />
              <stop offset="1" stopColor="#FF7A1A" stopOpacity="0" />
            </linearGradient>
            <clipPath id="cl">
              <rect x="0" y="-20" width={(W * reveal).toFixed(1)} height={H + 40} />
            </clipPath>
          </defs>
          {[15, 10, 5, 1].map((t) => (
            <g key={t}>
              <line x1="0" x2={W} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,.08)" />
              <text x="-8" y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgba(244,245,246,.5)" fontFamily="Inter">
                ${t}k
              </text>
            </g>
          ))}
          {data.ticks.map((m, i) => (
            <text key={m} x={(i * W) / (data.ticks.length - 1)} y={H + 24} textAnchor="middle" fontSize="12" fill="rgba(244,245,246,.5)" fontFamily="Inter">
              {m}
            </text>
          ))}
          <g clipPath="url(#cl)">
            <path d={area} fill="url(#ag)" />
            <path d={line} fill="none" stroke="#FF8A1F" strokeWidth={2} />
          </g>
          <line x1="0" x2={W} y1={res} y2={res} stroke="#2EE6D6" strokeWidth={2} style={{ filter: "drop-shadow(0 0 4px #2EE6D6)" }} />
          <circle cx={peak[0]} cy={peak[1]} r="7" fill="#FF8A1F" stroke="#fff" strokeWidth={2} opacity={reveal >= 1 ? 1 : 0}>
            <title>Peak open findings</title>
          </circle>
        </svg>
        {hover && (
          <>
            <span className="xh" style={{ left: hover.px }} />
            <span className="xd" style={{ left: hover.px, top: hover.py }} />
            <span className="xt" style={{ left: hover.tx, top: hover.py }}>
              <small>Open</small>
              <b style={{ fontWeight: 500 }}>${hover.value.toFixed(1)}k</b>
            </span>
          </>
        )}
      </div>
      <div className="legend" style={{ position: "absolute", bottom: 16, left: 0 }}>
        <span><i className="dot" style={{ background: "var(--or)" }} />Open</span>
        <span><i className="dot" style={{ background: "var(--teal)" }} />Resolved</span>
      </div>
    </Card>
  );
}
