import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { appScale } from "~/lib/motion";

type Props = {
  /** Renders the trigger; `open` lets it show its pressed state. */
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode;
  id: string;
  /** Open above the trigger instead of below. */
  up?: boolean;
  /** Align the panel's left edge with the trigger (plus `dx`) instead of its right edge. */
  left?: boolean;
  dx?: number;
  style?: CSSProperties;
  /** Popover content; `close` dismisses it. */
  children: (close: () => void) => ReactNode;
};

/**
 * Anchored dropdown panel (.pv), rendered into the scaled #app canvas so no
 * card or input box clips it. Closes on outside press or Escape.
 */
export function Popover({ trigger, id, up, left, dx = 0, style, children }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const [host, setHost] = useState<HTMLElement | null>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => setHost(document.getElementById("app")), []);

  useLayoutEffect(() => {
    if (!open || !host || !wrap.current) return;
    const k = appScale(host);
    const ar = host.getBoundingClientRect();
    const r = wrap.current.getBoundingClientRect();
    setPos({
      ...(up ? { bottom: (ar.bottom - r.top) / k + 8 } : { top: (r.bottom - ar.top) / k + 8 }),
      ...(left ? { left: (r.left - ar.left) / k + dx } : { right: (ar.right - r.right) / k }),
    });
  }, [open, host, up, left, dx]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!wrap.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <span className="pvwrap" ref={wrap}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {host &&
        createPortal(
          <div
            ref={panel}
            className={`pv${up ? " up" : ""}${open ? " on" : ""}`}
            id={id}
            role="dialog"
            aria-hidden={!open}
            style={{ ...pos, ...style }}
          >
            {open && children(close)}
          </div>,
          host,
        )}
    </span>
  );
}

type ItemProps = {
  title: string;
  sub?: string;
  glyph?: ReactNode;
  pre?: ReactNode;
  end?: ReactNode;
  on?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

/** One row inside a popover. */
export function PvItem({ title, sub, glyph, pre, end, on, disabled, onClick }: ItemProps) {
  return (
    <button className={`it${on ? " on" : ""}${disabled ? " dis" : ""}`} type="button" onClick={onClick} disabled={disabled}>
      {glyph && <span className="g">{glyph}</span>}
      {pre}
      <span className="tx">
        <span>{title}</span>
        {sub && <small>{sub}</small>}
      </span>
      {end && <span className="end">{end}</span>}
    </button>
  );
}
