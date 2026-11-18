import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  /** Renders the trigger; `open` lets it show its pressed state. */
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode;
  id: string;
  /** Popover content; `close` dismisses it. */
  children: (close: () => void) => ReactNode;
};

/** Anchored dropdown panel (.pv) that closes on outside press or Escape. */
export function Popover({ trigger, id, children }: Props) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
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
      <div className={`pv${open ? " on" : ""}`} id={id} role="dialog" aria-hidden={!open}>
        {open && children(close)}
      </div>
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
