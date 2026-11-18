import { useSyncExternalStore } from "react";

/**
 * Per-visitor demo state for findings (resolved + comments), saved in
 * localStorage under the same key the prototype used. Shared by every screen.
 */
const KEY = "secproto-v1";

export type Comment = { x: string; t: string };
export type State = {
  resolved: Record<string, { by: string; at: number }>;
  comments: Record<string, Comment[]>;
};

const EMPTY: State = { resolved: {}, comments: {} };
let state: State | null = null;
const subs = new Set<() => void>();

function load(): State {
  if (state) return state;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    state = { resolved: saved?.resolved || {}, comments: saved?.comments || {} };
  } catch {
    state = { ...EMPTY };
  }
  return state;
}

function set(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  subs.forEach((f) => f());
}

export function useFindingsState() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    load,
    () => EMPTY,
  );
}

export function resolve(id: string) {
  const s = load();
  set({ ...s, resolved: { ...s.resolved, [id]: { by: "Ariel R", at: Date.now() } } });
}

export function reopen(id: string) {
  const s = load();
  const { [id]: _, ...rest } = s.resolved;
  set({ ...s, resolved: rest });
}

export function addComment(id: string, x: string) {
  const s = load();
  set({ ...s, comments: { ...s.comments, [id]: [...(s.comments[id] || []), { x, t: "Just now" }] } });
}
