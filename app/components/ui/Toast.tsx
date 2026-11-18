import { useEffect, useState } from "react";

type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

/** Shows a short status message at the bottom of the app. */
export function toast(msg: string) {
  listeners.forEach((l) => l(msg));
}

/** Rendered once inside the stage (see Shell). */
export function Toaster() {
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const l: Listener = (m) => {
      setMsg(m);
      setOn(true);
      clearTimeout(t);
      t = setTimeout(() => setOn(false), 2600);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className={`toast${on ? " on" : ""}`} role="status">
      <i />
      <span>{msg}</span>
    </div>
  );
}
