import { FINDINGS, type Finding } from "~/data/findings";

/**
 * Scripted AI replies for the chat prototype. Each action builds a turn
 * spec from the finding in context; answers are trusted HTML strings
 * (only our own data is interpolated). `.fchip` spans link to a finding.
 */

export type ActKey =
  | "report"
  | "rotate"
  | "ticket"
  | "assign"
  | "slack"
  | "fix"
  | "summary"
  | "verify"
  | "similar"
  | "explain"
  | "general";

export type CardKind = "rotate" | "ticket" | "assign" | "slack" | "fix";
export type Source = { t: string; f: string; tab: string };

export type TurnSpec = {
  findingId: string;
  steps: string[];
  title?: string;
  mins?: string;
  html: string;
  /** Shorter answer used by "Regenerate". */
  alt?: string;
  blast?: [string, string][];
  sources?: Source[];
  card?: CardKind;
  follow?: string[];
};

export type Person = { initials: string; name: string; note: string; bg: string; suggested?: boolean };
export const PEOPLE: Person[] = [
  { initials: "JR", name: "j.rivera", note: "Committed this key · payments team", bg: "linear-gradient(135deg,#9ad,#57a)", suggested: true },
  { initials: "MC", name: "m.chen", note: "Owns auth-service", bg: "linear-gradient(135deg,#c9a,#859)" },
  { initials: "SP", name: "s.patel", note: "Platform on-call this week", bg: "linear-gradient(135deg,#ad9,#5a7)" },
  { initials: "AR", name: "Ariel R (you)", note: "Security lead", bg: "" },
];

export type CmdIcon = "key" | "pr" | "ticket" | "person" | "chat" | "doc" | "sca" | "scm";
export const CMDS: { k: string; desc: string; act: ActKey; icon: CmdIcon }[] = [
  { k: "/rotate", desc: "Rotate the key and resolve", act: "rotate", icon: "key" },
  { k: "/fix", desc: "Generate a patch and open a PR", act: "fix", icon: "pr" },
  { k: "/ticket", desc: "Create a Jira ticket", act: "ticket", icon: "ticket" },
  { k: "/assign", desc: "Assign an owner", act: "assign", icon: "person" },
  { k: "/slack", desc: "Draft a team update", act: "slack", icon: "chat" },
  { k: "/summary", desc: "Executive summary", act: "summary", icon: "doc" },
  { k: "/similar", desc: "Find similar findings", act: "similar", icon: "sca" },
  { k: "/report", desc: "Full report on this finding", act: "report", icon: "scm" },
];

export const QUICK: { act: ActKey; label: string; icon: CmdIcon }[] = [
  { act: "rotate", label: "Rotate key", icon: "key" },
  { act: "fix", label: "Generate fix", icon: "pr" },
  { act: "ticket", label: "Create ticket", icon: "ticket" },
  { act: "assign", label: "Assign owner", icon: "person" },
  { act: "slack", label: "Brief the team", icon: "chat" },
  { act: "summary", label: "Exec summary", icon: "doc" },
];

export const SUGGESTED = [
  "How was this credential verified as live?",
  "Which other repos have similar exposed secrets?",
  "What’s the fastest way to revoke this key?",
];

/** Picks a scripted answer for free-text questions. */
export function route(q: string): ActKey {
  const l = q.toLowerCase();
  if (/report|detail/.test(l)) return "report";
  if (/revoke|rotate|fastest/.test(l)) return "rotate";
  if (/ticket|jira/.test(l)) return "ticket";
  if (/assign|owner/.test(l)) return "assign";
  if (/slack|update for|notify|message/.test(l)) return "slack";
  if (/fix|patch|pull request|\bpr\b/.test(l)) return "fix";
  if (/summar|executive|leadership/.test(l)) return "summary";
  if (/verif|live/.test(l)) return "verify";
  if (/other|similar|repos/.test(l)) return "similar";
  if (/explain|plain|simple/.test(l)) return "explain";
  return "general";
}

const chip = (f: Finding, label: string, tab?: string) =>
  `<span class="fchip" data-f="${f.id}"${tab ? ` data-tab="${tab}"` : ""}>${label}</span>`;
const fileOf = (f: Finding) => f.file.split(":")[0];

const REPORT_TITLES: Record<string, string> = {
  "FND-8f3a9c11": "Hardcoded AWS Key Finding",
  "FND-2c71de04": "Hardcoded JWT Secret Finding",
  "FND-0d44b7e3": "Stripe Test Key Finding",
};

export function buildTurn(act: ActKey, f: Finding, isRes: (id: string) => boolean): TurnSpec {
  const res = isRes(f.id);
  const sec = f.icon === "secret";
  const base = { findingId: f.id };
  switch (act) {
    case "report":
      return {
        ...base,
        steps: [
          `Reading ${f.id}`,
          `Tracing commit history in ${f.repo}`,
          sec ? "Verifying credential with the provider" : "Checking if the path is reachable",
          "Drafting remediation",
        ],
        title: REPORT_TITLES[f.id] || `${f.title} Finding`,
        mins: "3 min read",
        html:
          `During the latest ${f.scan.toLowerCase()} run, the issue was found in ${chip(f, fileOf(f), "evidence")} on the <b>${f.branch}</b> branch of ${f.repo}. ` +
          (sec ? "The key was cross-checked and <b>verified as a live, active credential</b>, so it’s flagged " : "It is flagged ") +
          `<b>${res ? "resolved" : f.sev}</b>. The commit traces back to ${f.by}.`,
        alt:
          `<b>Short version:</b> a ${sec ? "live credential" : "confirmed issue"} sits in ${chip(f, fileOf(f), "evidence")} on ${f.branch} of ${f.repo}. Anyone with repo access can use it. ` +
          (sec ? "Rotate it first, then add a pre-commit hook." : "Apply the patch and re-scan."),
        blast: [
          [sec ? "3" : "1", sec ? "S3 buckets reachable" : "service affected"],
          [f.asset, "blast radius"],
          [f.age, "exposed for"],
        ],
        sources: [
          { t: `${f.scan} · today 09:14`, f: f.id, tab: "activity" },
          { t: `Commit 7c1e9a2 · ${f.by.split("@")[0]}`, f: f.id, tab: "evidence" },
          { t: f.ref, f: f.id, tab: "overview" },
        ],
        follow: sec
          ? ["How was this credential verified as live?", "Which other repos have similar exposed secrets?"]
          : ["Which other repos have similar issues?", "Explain the risk in plain words"],
      };
    case "rotate":
      return {
        ...base,
        steps: ["Checking IAM permissions", "Finding services that use this key", "Preparing a safe rotation plan"],
        html: res
          ? "This finding is already <b>resolved</b>. Nothing left to rotate."
          : "Here’s a zero-downtime plan. I’ll run each step and stop if anything fails.",
        card: res ? undefined : "rotate",
        follow: ["Draft a Slack update for the team", "Create a ticket to add a pre-commit hook"],
      };
    case "ticket":
      return {
        ...base,
        steps: ["Reading finding details", "Matching the SEC project template"],
        html: "I drafted a ticket. Edit anything, then create it.",
        card: "ticket",
        follow: ["Assign an owner", "Draft a Slack update for the team"],
      };
    case "assign":
      return {
        ...base,
        steps: [`Checking git blame for ${fileOf(f)}`, "Looking up service owners and on-call"],
        html: `<b>${PEOPLE[0].name}</b> committed the key and is on the payments team, so they’re the best fit. Pick someone:`,
        card: "assign",
        follow: ["Create a ticket for this", "Draft a Slack update for the team"],
      };
    case "slack":
      return {
        ...base,
        steps: ["Summarizing impact", "Writing for #sec-incidents"],
        html: "Here’s a short update. You can edit it before sending.",
        card: "slack",
        follow: ["Write an executive summary", "Generate a fix"],
      };
    case "fix":
      return {
        ...base,
        steps: [`Reading ${f.file}`, "Writing a patch", "Running tests on the patch"],
        html: sec
          ? "The fix reads credentials from the default AWS provider chain, so no secret lives in code. Tests pass."
          : "Here’s a patch for the flagged line. Tests pass.",
        card: "fix",
        follow: ["Create a ticket to add a pre-commit hook", "Draft a Slack update for the team"],
      };
    case "summary":
      return {
        ...base,
        steps: ["Pulling posture metrics", "Writing for a non-technical reader"],
        title: "Executive summary",
        mins: "30 sec read",
        html:
          `<b>What happened:</b> a ${sec ? "cloud access key" : "security weakness"} was left in code for the ${f.asset} service.<br>` +
          "<b>Risk:</b> anyone with access to the code could have read payment data storage. We found no sign it was used.<br>" +
          `<b>Status:</b> ${res ? "fixed and closed." : "fix in progress, expected within the hour."}<br>` +
          "<b>Prevention:</b> we’re adding automatic checks that block this kind of commit.",
        sources: [
          { t: "Posture center · 2,521 findings", f: f.id, tab: "overview" },
          { t: f.id, f: f.id, tab: "activity" },
        ],
        follow: ["Draft a Slack update for the team", "Which other repos have similar exposed secrets?"],
      };
    case "verify":
      return {
        ...base,
        steps: ["Reading scanner logs", "Checking the provider response"],
        html: "The scanner called the provider’s identity endpoint with the leaked key at <b>09:14</b>. The call succeeded and returned the <b>payments-prod</b> account, so the credential is live, not a revoked or sample key. That check raised it from High to <b>Critical</b>.",
        sources: [{ t: "Scanner log · 09:14", f: f.id, tab: "activity" }],
        follow: ["What’s the fastest way to revoke this key?", "Assign an owner"],
      };
    case "similar": {
      const sim = FINDINGS.filter((x) => x.icon === f.icon && x.id !== f.id);
      return {
        ...base,
        steps: [`Searching ${FINDINGS.length} open findings`, "Grouping by pattern"],
        html:
          `I found <b>${sim.length} more</b> with the same pattern:<ul>` +
          sim.map((x) => `<li>${chip(x, x.title)}, ${x.repo} · ${isRes(x.id) ? "resolved" : x.sev}</li>`).join("") +
          "</ul>Fixing the JWT secret first gives the biggest risk reduction, since it signs every user session.",
        follow: ["Create a ticket for each of these", "Write an executive summary"],
      };
    }
    case "explain":
      return {
        ...base,
        steps: ["Simplifying the finding"],
        html: `Think of it like leaving a spare key under the doormat. The code for <b>${f.asset}</b> contains a working key, so anyone who can see the code can open the storage it protects. Nothing bad has been seen yet, but the door is unlocked until we change the key.`,
        follow: ["What’s the fastest way to revoke this key?", "Write an executive summary"],
      };
    default:
      return {
        ...base,
        steps: [`Reading context from ${f.id}`],
        html: `Here’s what I know about ${chip(f, f.title)}: it’s <b>${res ? "resolved" : f.sev}</b> in ${f.repo}, found by ${f.scan.toLowerCase()}. I can rotate the key, open a fix PR, create a ticket, or brief the team. Type <b>/</b> to see everything I can do.`,
        follow: ["Generate a fix", "Write an executive summary"],
      };
  }
}
