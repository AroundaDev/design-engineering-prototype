import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { Stage } from "~/components/shell/Stage";
import { TopBar } from "~/components/shell/TopBar";
import { Rail } from "~/components/shell/Rail";

const RAIL_KEY = "secproto-rail";

/** App chrome shared by every screen: scaled stage, top bar, rail, main area. */
export default function Shell() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(RAIL_KEY) === "1") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "[") {
        e.preventDefault();
        toggle();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(RAIL_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  return (
    <Stage>
      <TopBar />
      <div className={`shell${collapsed ? " collapsed" : ""}`}>
        <Rail collapsed={collapsed} />
        <main className="main">
          <Outlet />
        </main>
        <button
          className="rtog"
          type="button"
          aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
          aria-controls="rail"
          aria-expanded={!collapsed}
          onClick={toggle}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>
    </Stage>
  );
}
