import { useLayoutEffect, useEffect, useRef, type ReactNode } from "react";
import { appScale, prefersReducedMotion } from "~/lib/motion";

/** Design size: the scale is chosen so the tighter viewport side matches it. */
const W = 1440;
const H = 900;

/** Elements that get a tap ripple from the pointer position. */
const RIPPLE =
  ".ri,.irow,.brow,.stage a,.tabs button,.askcard,.pill.bell,.ib,.tr,.btn,.chip,.dtabs button,.menu button,.sc,.notif button";

/** Below this width the app switches to the phone layout (html.m) instead of scaling. */
export const MOBILE_BREAKPOINT = 760;

/** True while the phone layout is active. */
export const isMobileLayout = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("m");

/**
 * Full-viewport canvas. The 1440×900 design is scaled so the tighter side of
 * the viewport matches it, and the canvas grows along the other side so it
 * fills the whole window: e.g. 1920×1080 → scale 1.2, 1600×900 layout.
 * Below MOBILE_BREAKPOINT the canvas fills the screen unscaled and the
 * mobile styles (html.m in prototype.css) take over.
 * Hidden until the first fit so SSR markup doesn't flash at full size.
 */
export function Stage({ children }: { children: ReactNode }) {
  const app = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = app.current!;
    const fit = () => {
      const mobile = innerWidth < MOBILE_BREAKPOINT;
      document.documentElement.classList.toggle("m", mobile);
      el.dataset.ready = "";
      if (mobile) {
        el.style.transform = el.style.width = el.style.height = "";
        return;
      }
      const s = Math.max(0.1, Math.min(innerWidth / W, innerHeight / H));
      el.style.width = `${innerWidth / s}px`;
      el.style.height = `${innerHeight / s}px`;
      el.style.transform = `scale(${s})`;
    };
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const el = app.current!;
    const onDown = (e: PointerEvent) => {
      if (prefersReducedMotion() || e.button > 0) return;
      const t = (e.target as Element).closest<HTMLElement>(RIPPLE);
      if (!t || (t as HTMLButtonElement).disabled) return;
      let wrap = t.querySelector<HTMLElement>(":scope > .rpw");
      if (!wrap) {
        wrap = document.createElement("span");
        wrap.className = "rpw";
        t.appendChild(wrap);
      }
      const r = t.getBoundingClientRect();
      const k = appScale(t);
      const x = (e.clientX - r.left) / k;
      const y = (e.clientY - r.top) / k;
      const d = 2 * Math.hypot(Math.max(x, t.offsetWidth - x), Math.max(y, t.offsetHeight - y));
      const p = document.createElement("span");
      p.className = "rp";
      Object.assign(p.style, { left: `${x}px`, top: `${y}px`, width: `${d}px`, height: `${d}px` });
      wrap.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    };
    el.addEventListener("pointerdown", onDown, { passive: true });
    return () => el.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <div id="stage">
      <div id="app" ref={app} role="application" aria-label="Security platform prototype">
        {children}
      </div>
    </div>
  );
}
