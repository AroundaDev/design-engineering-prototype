import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { appScale } from "~/lib/motion";

type CardProps = {
  title: string;
  icon: ReactNode;
  className?: string;
  delay?: number;
  /** Rendered after the title, e.g. an arrow link or tabs. */
  action?: ReactNode;
  children?: ReactNode;
};

/** Glass card with the pointer-following spotlight from the prototype. */
export function Card({ title, icon, className = "", delay = 0, action, children }: CardProps) {
  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    const k = appScale(c);
    c.style.setProperty("--mx", `${((e.clientX - r.left) / k).toFixed(0)}px`);
    c.style.setProperty("--my", `${((e.clientY - r.top) / k).toFixed(0)}px`);
  }

  return (
    <article
      className={`card rv ${className}`}
      style={{ transitionDelay: `${delay}s` } as CSSProperties}
      onPointerMove={onPointerMove}
    >
      <div className="ch">
        <span className="ci">{icon}</span>
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </article>
  );
}
