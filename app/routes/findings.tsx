import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import type { Route } from "./+types/findings";
import { FindingDrawer } from "~/components/findings/FindingDrawer";
import { FindingsTable } from "~/components/findings/FindingsTable";
import { TotalsCard } from "~/components/findings/TotalsCard";
import { FEATURED_ID, FINDINGS, SEVERITIES, findingById, totals, type Finding, type Severity } from "~/data/findings";
import type { FindingsFilter } from "~/data/overview";
import { useFindingsState } from "~/lib/findings-store";
import { prefersReducedMotion, useEntered } from "~/lib/motion";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Findings · Security platform" },
    { name: "description", content: "Findings list and detail prototype" },
  ];
}

/** The featured finding opens by itself once per page load, as in the prototype. */
let autoOpened = false;

function readFilter(p: URLSearchParams): FindingsFilter {
  const sev = p.get("sev");
  return {
    sev: SEVERITIES.includes(sev as Severity) ? (sev as Severity) : undefined,
    type: p.get("type") || undefined,
    status: p.get("status") === "resolved" ? "resolved" : undefined,
    q: p.get("q") || undefined,
  };
}

export default function Findings() {
  const entered = useEntered();
  const [params, setParams] = useSearchParams();
  const store = useFindingsState();
  const filter = readFilter(params);
  const openId = params.get("open");
  const selected = findingById(openId) ?? null;
  const isResolved = (id: string) => !!store.resolved[id];

  const rows = useMemo(
    () =>
      FINDINGS.filter((f) => {
        if (filter.status === "resolved" && !store.resolved[f.id]) return false;
        if (filter.sev && f.sev !== filter.sev) return false;
        if (filter.type && f.type !== filter.type) return false;
        if (filter.q) {
          const hay = `${f.title} ${f.id} ${f.file} ${f.asset} ${f.repo} ${f.branch}`.toLowerCase();
          if (!hay.includes(filter.q.toLowerCase())) return false;
        }
        return true;
      }),
    [filter.status, filter.sev, filter.type, filter.q, store.resolved],
  );

  function update(next: { filter?: FindingsFilter; open?: string | null }) {
    setParams(
      (prev) => {
        const p = new URLSearchParams();
        const f = next.filter ?? readFilter(prev);
        for (const [k, v] of Object.entries(f)) if (v) p.set(k, v);
        const o = next.open === undefined ? prev.get("open") : next.open;
        if (o) p.set("open", o);
        return p;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  // Keep showing the last finding while the drawer slides closed.
  const shown = useRef<Finding | null>(null);
  if (selected) shown.current = selected;

  useEffect(() => {
    if (autoOpened || openId) {
      autoOpened = true;
      return;
    }
    const t = setTimeout(() => {
      autoOpened = true;
      update({ open: FEATURED_ID });
    }, prefersReducedMotion() ? 0 : 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (e.key === "Escape" && tag !== "INPUT") update({ open: null });
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  const t = totals(Object.keys(store.resolved));
  const listKey = [filter.sev, filter.type, filter.status].join("|");

  return (
    <section className={`screen${entered ? " in" : ""}`} aria-label="Findings">
      <div className={`fd${selected ? " open" : ""}`}>
        <div className="fl">
          <h1 className="rv" style={{ marginBottom: 6 }}>Findings</h1>
          <TotalsCard {...t} delay={0.06} />
          <FindingsTable
            rows={rows}
            filter={filter}
            listKey={listKey}
            selected={selected?.id ?? null}
            isResolved={isResolved}
            onFilter={(f) => update({ filter: f })}
            onOpen={(id) => update({ open: id })}
            delay={0.12}
          />
        </div>
        <aside className="drawer" aria-label="Finding details" aria-hidden={!selected}>
          {shown.current && <FindingDrawer f={shown.current} store={store} onClose={() => update({ open: null })} />}
        </aside>
      </div>
    </section>
  );
}
