import { useEffect, useState, useSyncExternalStore } from "react";

const RM_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the user asked for reduced motion. Always false during SSR. */
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(RM_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => matchMedia(RM_QUERY).matches,
    () => false,
  );
}

export function prefersReducedMotion() {
  return typeof matchMedia !== "undefined" && matchMedia(RM_QUERY).matches;
}

/** Ratio between an element's on-screen size and its layout size (the stage scale). */
export function appScale(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return r.width / (el.offsetWidth || 1) || 1;
}

export const easeOutCubic = (k: number) => 1 - Math.pow(1 - k, 3);

/** Runs `step(eased 0..1)` for `duration` ms. Returns a cancel function. */
export function tween(duration: number, step: (e: number) => void) {
  if (prefersReducedMotion()) {
    step(1);
    return () => {};
  }
  const t0 = performance.now();
  let raf = 0;
  const frame = (t: number) => {
    const k = Math.max(0, Math.min(1, (t - t0) / duration));
    step(easeOutCubic(k));
    if (k < 1) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

/** Becomes true on the frame after mount, so CSS entrance transitions run. */
export function useEntered(delay = 0) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    let raf = 0;
    const id = setTimeout(() => {
      raf = requestAnimationFrame(() => setEntered(true));
    }, delay);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [delay]);
  return entered;
}

/** Counts from 0 to `to` once `start` is true. */
export function useCountUp(to: number, duration: number, start: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    return tween(duration, (e) => setValue(Math.round(to * e)));
  }, [to, duration, start]);
  return value;
}

/** Restarts a one-shot CSS animation class on an element. */
export function playOnce(el: Element | null, cls: string, ms = 700) {
  if (!el || prefersReducedMotion()) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}

export const fmt = (n: number) => n.toLocaleString("en-US");
