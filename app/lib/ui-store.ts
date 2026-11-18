import { useSyncExternalStore } from "react";

/** Account-menu preferences and app-wide UI flags (in memory, as in the prototype). */
export type Prefs = {
  workspace: string;
  compact: boolean;
  sound: boolean;
  shortcutsOpen: boolean;
};

const DEFAULTS: Prefs = { workspace: "Acme · Production", compact: false, sound: true, shortcutsOpen: false };
let prefs = DEFAULTS;
const subs = new Set<() => void>();

export function setPrefs(patch: Partial<Prefs>) {
  prefs = { ...prefs, ...patch };
  subs.forEach((f) => f());
}

export function usePrefs() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => prefs,
    () => DEFAULTS,
  );
}

export const WORKSPACES = [
  { name: "Acme · Production", sub: "4,389 findings · 14 repos" },
  { name: "Acme · Staging", sub: "1,204 findings · 6 repos" },
];

/** Recent top-bar searches, newest first (max 3). */
export let recentSearches = ["aws key", "payments-api", "CWE-89"];
export function pushRecent(q: string) {
  const t = q.trim();
  if (!t) return;
  recentSearches = [t, ...recentSearches.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 3);
}
