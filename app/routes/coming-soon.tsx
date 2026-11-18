import { Link, useLocation, useMatches } from "react-router";
import type { Route } from "./+types/coming-soon";

const TITLES: Record<string, string> = {
  findings: "Findings",
  posture: "Security posture center",
  chat: "AI Chat",
};

export function meta({ matches }: Route.MetaArgs) {
  const id = matches[matches.length - 1]?.id ?? "";
  return [{ title: `${TITLES[id] ?? "Coming soon"} · Security platform` }];
}

/** Stand-in for screens that haven't been ported from the prototype yet. */
export default function ComingSoon() {
  const matches = useMatches();
  const { search } = useLocation();
  const id = matches[matches.length - 1]?.id ?? "";
  const params = new URLSearchParams(search);

  return (
    <section className="screen in" aria-label={TITLES[id]}>
      <div className="soon">
        <h1>{TITLES[id] ?? "Coming soon"}</h1>
        <p>This screen hasn't been ported from the prototype yet.</p>
        {params.size > 0 && (
          <p>
            Requested with <code>{search}</code>
          </p>
        )}
        <p>
          <Link to="/">Back to overview</Link>
        </p>
      </div>
    </section>
  );
}
