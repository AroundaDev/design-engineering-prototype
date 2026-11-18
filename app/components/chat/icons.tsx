import { ICONS } from "~/components/ui/icons";
import type { CmdIcon } from "~/data/chat";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24" } as const;

/** Icon set used by the chat screen (copied from the prototype). */
export const IC = {
  copy: <svg {...S}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></svg>,
  redo: <svg {...S}><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>,
  up: <svg {...S}><path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.3 6A2 2 0 0 1 17.7 20H7" /></svg>,
  down: <svg {...S}><path d="M17 13V4h3v9zM17 13l-4 8a2 2 0 0 1-3-2l1-5H5a2 2 0 0 1-2-2.3l1.3-6A2 2 0 0 1 6.3 4H17" /></svg>,
  pin: <svg {...S}><path d="M6 3h12v18l-6-4-6 4z" /></svg>,
  bolt: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>,
  key: <svg {...S}><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M16 7l3 3" /></svg>,
  ticket: <svg {...S}><path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3z" /><path d="M14 4v12" strokeDasharray="2 2" /></svg>,
  person: <svg {...S}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>,
  chat: <svg {...S}><path d="M4 5h16v11H9l-5 4z" /></svg>,
  pr: <svg {...S}><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M6 8.5v7M18 15.5V9a3 3 0 0 0-3-3h-4M13 4l-2 2 2 2" /></svg>,
  doc: <svg {...S}><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h6M9 16h6" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}><path d="M5 12l5 5 9-10" /></svg>,
  chev: <svg {...S}><path d="M9 6l6 6-6 6" /></svg>,
  stop: <svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="7" width="10" height="10" rx="2" /></svg>,
  send: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} style={{ width: 16, height: 16 }}><path d="M12 19V5M6 11l6-6 6 6" /></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
};

export function CmdGlyph({ name }: { name: CmdIcon }) {
  if (name === "sca" || name === "scm") {
    const C = ICONS[name];
    return <C />;
  }
  return IC[name];
}
