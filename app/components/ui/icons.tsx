import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24" } as const;

export const ICONS = {
  secret: (p: P) => (
    <svg {...stroke} {...p}><circle cx="8" cy="12" r="4" /><path d="M12 12h9M18 12v3" /></svg>
  ),
  sast: (p: P) => (
    <svg {...stroke} {...p}><path d="M12 3v6M12 9l-6 5M12 9l6 5M6 14v5M18 14v5M12 9v10" /></svg>
  ),
  sca: (p: P) => (
    <svg {...stroke} {...p}><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></svg>
  ),
  scm: (p: P) => (
    <svg {...stroke} {...p}><path d="M12 3l8 3v6c0 4-3 7.5-8 9-5-1.5-8-5-8-9V6z" /></svg>
  ),
  iac: (p: P) => (
    <svg {...stroke} {...p}><path d="M8 4H6a2 2 0 0 0-2 2v3l-2 3 2 3v3a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v3l2 3-2 3v3a2 2 0 0 1-2 2h-2" /></svg>
  ),
  warn: (p: P) => (
    <svg {...stroke} {...p}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></svg>
  ),
} satisfies Record<string, (p: P) => React.JSX.Element>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...p }: { name: IconName } & P) {
  const C = ICONS[name];
  return <C {...p} />;
}

export function ArrowUpRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

export function SendIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: size, height: size }}>
      <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />
    </svg>
  );
}
