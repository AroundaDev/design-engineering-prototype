import { useEffect, useRef } from "react";
import { Card } from "~/components/ui/Card";
import { fmt, playOnce } from "~/lib/motion";

/** Number that bumps whenever its value changes (not on first render). */
function Bump({ value }: { value: number }) {
  const el = useRef<HTMLElement>(null);
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value) playOnce(el.current, "bump");
    last.current = value;
  }, [value]);
  return <b ref={el}>{fmt(value)}</b>;
}

function Tick({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="tick" style={{ color }}>
      <span>
        <Bump value={value} />
        <span style={{ color: "var(--t1)" }}>{label}</span>
      </span>
      <div className="ticks" />
    </div>
  );
}

type Props = { total: number; crit: number; high: number; res: number; delay: number };

export function TotalsCard({ total, crit, high, res, delay }: Props) {
  return (
    <Card
      title="Total findings"
      className="tot"
      delay={delay}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
          <circle cx="8" cy="12" r="4" />
          <path d="M12 12h9M18 12v3M21 12v2" />
        </svg>
      }
    >
      <div className="row">
        <div className="big">
          <b>{fmt(total)}</b>
          <small>
            <i>↑ 12%</i> vs last 7 days
          </small>
        </div>
        <Tick value={crit} label="Critical" color="var(--crit)" />
        <Tick value={high} label="High" color="var(--high)" />
        <Tick value={res} label="Resolved" color="var(--or2)" />
      </div>
    </Card>
  );
}
