import { useLayoutEffect, useRef, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";

type Item = { to: string; label: string; icon: ReactNode };

const PRIMARY: Item[] = [
  {
    to: "/",
    label: "Security overview",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="4" width="7" height="7" rx="2" />
        <rect x="13" y="4" width="7" height="7" rx="2" />
        <rect x="4" y="13" width="7" height="7" rx="2" />
        <rect x="13" y="13" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    to: "/findings",
    label: "Findings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path d="M6 20V11M12 20V5M18 20v-6" />
      </svg>
    ),
  },
];

const SECONDARY: Item[] = [
  {
    to: "/posture",
    label: "Security posture center",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
        <rect x="5" y="10" width="14" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </svg>
    ),
  },
  {
    to: "/chat",
    label: "AI chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 3l1.8 4.9L17 10l-5.2 2.1L10 17l-1.8-4.9L3 10l5.2-2.1z" />
        <path d="M18 13l.9 2.4 2.4.9-2.4.9L18 20l-.9-2.4-2.4-.9 2.4-.9z" />
      </svg>
    ),
  },
];

function RailLink({ item }: { item: Item }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      aria-label={item.label}
      className={({ isActive }) => `ri${isActive ? " on" : ""}`}
    >
      {item.icon}
    </NavLink>
  );
}

/** Left navigation rail with one shared indicator that travels between items. */
export function Rail({ collapsed }: { collapsed: boolean }) {
  const rail = useRef<HTMLElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const el = ind.current!;
    const active = rail.current!.querySelector<HTMLElement>(".ri.on");
    if (!active || collapsed) {
      el.style.opacity = "0";
      placed.current = false;
      return;
    }
    const move = `translateY(${active.offsetTop}px)`;
    if (!placed.current) {
      // First placement (or after re-expanding): jump without travelling.
      el.style.transition = "none";
      el.style.transform = move;
      void el.offsetWidth;
      el.style.transition = "";
      el.style.opacity = "1";
      placed.current = true;
      return;
    }
    el.style.transform = move;
    el.classList.remove("go");
    void el.offsetWidth;
    el.classList.add("go");
  }, [pathname, collapsed]);

  return (
    <nav className="rail" id="rail" aria-label="Main" ref={rail}>
      <span className="rind" ref={ind} aria-hidden="true" style={{ opacity: 0 }} />
      {PRIMARY.map((i) => <RailLink key={i.to} item={i} />)}
      <div className="rsep" />
      {SECONDARY.map((i) => <RailLink key={i.to} item={i} />)}
      <div className="grow" />
      <button className="ri" type="button" disabled aria-label="Sign out">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" />
        </svg>
      </button>
    </nav>
  );
}
