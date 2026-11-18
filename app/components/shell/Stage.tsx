import { useLayoutEffect, useEffect, useRef, type ReactNode } from "react";
import { appScale, prefersReducedMotion } from "~/lib/motion";

const W = 1440;
const H = 900;
/** Minimum gap between the canvas and the viewport edges, in screen px. */
const PAD_Y = 32;
const PAD_X = 24;

/** Elements that get a tap ripple from the pointer position. */
const RIPPLE =
  ".ri,.irow,.brow,.stage a,.tabs button,.askcard,.pill.bell,.ib,.tr,.btn,.chip,.dtabs button,.menu button";

/**
 * Fixed 1440×900 canvas scaled to fit the viewport (with edge padding), as in the prototype.
 * Hidden until the first fit so SSR markup doesn't flash at full size.
 */
export function Stage({ children }: { children: ReactNode }) {
  const app = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = app.current!;
    const fit = () => {
      const s = Math.max(
        0.1,
        Math.min((innerWidth - 2 * PAD_X) / W, (innerHeight - 2 * PAD_Y) / H),
      );
      el.style.transform = `translate(-50%, -50%) scale(${s})`;
      el.dataset.ready = "";
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
