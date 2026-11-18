import { Link } from "react-router";
import { Card } from "~/components/ui/Card";
import { ArrowUpRight, Icon } from "~/components/ui/icons";
import { INSIGHTS, findingsHref } from "~/data/overview";

export function PriorityInsights({ delay }: { delay: number }) {
  return (
    <Card
      title="Priority Insights"
      className="ins-glow"
      delay={delay}
      icon={
        <svg viewBox="0 0 24 24" fill="#fff">
          <path d="M12 3l10 18H2z" />
          <path d="M12 10v5M12 17.5v.5" stroke="#1b1e21" strokeWidth={2} />
        </svg>
      }
      action={
        <Link className="arrow" to="/findings" aria-label="Open findings">
          <ArrowUpRight />
        </Link>
      }
    >
      <div className="ins">
        {INSIGHTS.map((row) => (
          <Link key={row.text} className="irow" to={findingsHref(row.filter)}>
            <span>{row.text}</span>
            <span className="w">
              <span className="warn"><Icon name="warn" /></span>
              <span>{row.count}</span>
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
