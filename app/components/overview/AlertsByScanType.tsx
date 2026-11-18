import { Link } from "react-router";
import { Card } from "~/components/ui/Card";
import { Icon } from "~/components/ui/icons";
import { SCAN_TYPES, findingsHref } from "~/data/overview";
import { fmt } from "~/lib/motion";

const SEG = ["c", "h", "m", "l"] as const;
const LEGEND = [
  ["Critical", "var(--crit)"],
  ["High", "var(--high)"],
  ["Medium", "var(--med)"],
  ["Low", "#3b5a59"],
] as const;

/** Stacked severity bars per scan type; segments grow in once `grow` is true. */
export function AlertsByScanType({ grow, delay }: { grow: boolean; delay: number }) {
  return (
    <Card
      title="Alerts by Scan Type"
      delay={delay}
      icon={
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
        </svg>
      }
    >
      <div className={`bars${grow ? " in" : ""}`}>
        {SCAN_TYPES.map((row) => (
          <Link
            key={row.label}
            className="brow"
            to={findingsHref({ type: row.label })}
            aria-label={`Show ${row.label} findings`}
          >
            <span className="ic"><Icon name={row.icon} /></span>
            <span>{row.label}</span>
            <span className="track">
              {row.segments.map((w, i) =>
                w ? (
                  <span key={i} className={`seg ${SEG[i]}`} style={{ width: grow ? `${w * 1.22}%` : 0 }} />
                ) : null,
              )}
            </span>
            <b>{fmt(row.total)}</b>
          </Link>
        ))}
      </div>
      <div className="legend">
        {LEGEND.map(([label, color]) => (
          <span key={label}>
            <i className="dot" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </Card>
  );
}
