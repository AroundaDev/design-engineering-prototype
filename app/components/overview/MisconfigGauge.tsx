import { Link } from "react-router";
import { Card } from "~/components/ui/Card";
import { ArrowUpRight } from "~/components/ui/icons";
import { useCountUp } from "~/lib/motion";

const ARC = 503; // length of the 160px-radius half circle
const INDUSTRY_AVG = 65;

const TICKS = Array.from({ length: 61 }, (_, i) => {
  const a = Math.PI * (1 - i / 60);
  const r1 = 184;
  const r2 = i % 5 ? 194 : 198;
  return {
    x1: (200 + r1 * Math.cos(a)).toFixed(1),
    y1: (220 - r1 * Math.sin(a)).toFixed(1),
    x2: (200 + r2 * Math.cos(a)).toFixed(1),
    y2: (220 - r2 * Math.sin(a)).toFixed(1),
  };
});

/** Half-circle score gauge: arc fills, needle sweeps and the number counts up. */
export function MisconfigGauge({ score, run, delay }: { score: number; run: boolean; delay: number }) {
  const value = useCountUp(score, 1500, run);
  const k = run ? score / 100 : 0;

  return (
    <Card
      title="Misconfiguration Score"
      className="gauge"
      delay={delay}
      icon={
        <svg viewBox="0 0 24 24" fill="#fff">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" stroke="#fff" strokeWidth={2} />
        </svg>
      }
      action={
        <Link className="arrow" to="/posture" aria-label="Open posture center">
          <ArrowUpRight />
        </Link>
      }
    >
      <div className="legend">
        <span><i className="dot" style={{ background: "#fff" }} />Your Score</span>
        <span><i className="dot" style={{ background: "rgba(255,255,255,.55)" }} />Industry average</span>
      </div>
      <svg className="g" viewBox="0 0 400 230" aria-hidden="true">
        <defs>
          <linearGradient id="gw" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".95" />
            <stop offset="1" stopColor="#fff" stopOpacity=".45" />
          </linearGradient>
        </defs>
        <g>
          {TICKS.map((t, i) => (
            <line key={i} {...t} stroke="rgba(255,255,255,.55)" strokeWidth={1.4} />
          ))}
          <g transform="translate(200 220)">
            <rect x="-22" y="-205" width="44" height="26" rx="13" fill="rgba(255,255,255,.25)" transform="rotate(26)" />
            <text x="0" y="-187" textAnchor="middle" fontSize="13" fill="#fff" fontFamily="Inter" transform="rotate(26)">
              {INDUSTRY_AVG}
            </text>
          </g>
        </g>
        <path
          d="M40 220 A160 160 0 0 1 360 220"
          fill="none"
          stroke="url(#gw)"
          strokeWidth={44}
          strokeDasharray={ARC}
          style={{ strokeDashoffset: ARC * (1 - k), transition: "stroke-dashoffset 1.6s var(--ease)" }}
        />
        <circle cx="200" cy="220" r="118" fill="rgba(255,90,0,.55)" />
        <path
          d="M200 220 L200 70"
          stroke="#fff"
          strokeWidth={2.5}
          style={{
            transformOrigin: "200px 220px",
            transform: `rotate(${-90 + 180 * k}deg)`,
            transition: "transform 1.6s var(--ease)",
          }}
        />
      </svg>
      <div className="val">{value}</div>
    </Card>
  );
}
