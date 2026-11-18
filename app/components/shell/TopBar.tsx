import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { findingsHref } from "~/data/overview";
import { SendIcon } from "~/components/ui/icons";
import { playOnce } from "~/lib/motion";

export function TopBar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [seen, setSeen] = useState(false);
  const bell = useRef<HTMLButtonElement>(null);
  const send = useRef<HTMLButtonElement>(null);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(findingsHref({ q: term }));
  }

  function askAI() {
    playOnce(send.current, "fly");
    const term = q.trim();
    navigate(term ? `/chat?ask=${encodeURIComponent(term)}` : "/chat");
  }

  return (
    <div className="top">
      <form className="pill search" role="search" onSubmit={onSearch}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 18, height: 18, opacity: 0.85 }}>
          <path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8z" />
          <path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          aria-label="Search findings or ask AI"
        />
        <button ref={send} className="ib t" type="button" aria-label="Ask AI" style={{ marginLeft: 4 }} onClick={askAI}>
          <SendIcon size={18} />
        </button>
      </form>

      <button
        ref={bell}
        className={`pill bell${seen ? " seen" : ""}`}
        type="button"
        aria-label="Notifications"
        onClick={() => {
          playOnce(bell.current, "ringing");
          setSeen(true);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 20, height: 20 }}>
          <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        <i />
      </button>

      <button className="pill user" type="button" aria-label="Account">
        <span className="av">AR</span>
        <span>
          <b>Ariel R</b>
          <small>ariel.r@company.com</small>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 16, height: 16, opacity: 0.6, marginLeft: 4 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
