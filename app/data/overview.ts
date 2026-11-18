import type { IconName } from "~/components/ui/icons";

/** Filters understood by the Findings screen, passed as URL search params. */
export type FindingsFilter = {
  type?: string;
  sev?: "critical" | "high" | "medium" | "low";
  q?: string;
  status?: "resolved";
};

export function findingsHref(filter: FindingsFilter = {}) {
  const params = new URLSearchParams(
    Object.entries(filter).filter(([, v]) => v != null) as [string, string][],
  );
  const qs = params.toString();
  return qs ? `/findings?${qs}` : "/findings";
}

export type ScanTypeRow = {
  label: string;
  icon: IconName;
  /** Segment widths in [critical, high, medium, low] order; 0 hides the segment. */
  segments: [number, number, number, number];
  total: number;
};

export const SCAN_TYPES: ScanTypeRow[] = [
  { label: "Secrets", icon: "secret", segments: [3, 4, 4, 5], total: 101 },
  { label: "SAST", icon: "sast", segments: [1, 16, 52, 6], total: 904 },
  { label: "IaC", icon: "iac", segments: [2, 40, 0, 33], total: 981 },
  { label: "SCM-PM", icon: "scm", segments: [0, 4, 13, 12], total: 243 },
  { label: "SCA", icon: "sast", segments: [0, 3, 16, 0], total: 292 },
];

export const INSIGHTS: { text: string; count: number; filter: FindingsFilter }[] = [
  { text: "Potentially Valid Secrets found in Public Repositories", count: 6, filter: { type: "Secrets" } },
  { text: "Potentially Valid Secrets found in the Protected Branch", count: 6, filter: { type: "Secrets" } },
  { text: "Public storage exposed by infrastructure code", count: 4, filter: { type: "IaC" } },
  { text: "Critical Vulnerabilities with Available Patch aged beyond 30 d", count: 6, filter: { sev: "critical" } },
];

export const FUNNEL_STAGES: { value: string; label: string; filter: FindingsFilter }[] = [
  { value: "185", label: "All", filter: { type: "Secrets" } },
  { value: "26", label: "Potentially Valid", filter: { type: "Secrets" } },
  { value: "16", label: "In Protected Branch", filter: { type: "Secrets", q: "main" } },
  { value: "5", label: "Potentially Exposed", filter: { type: "Secrets", sev: "critical" } },
];

export type RangeKey = "1y" | "6m" | "3m" | "1m";

export const RANGES: { key: RangeKey; label: string; ticks: string[]; values: number[] }[] = [
  { key: "1y", label: "1 y", ticks: ["Apr", "Jun", "Aug", "Oct", "Dec", "Mar"], values: [6, 7.5, 9, 10.5, 11, 10, 9.5, 11, 12, 13, 12.5, 14] },
  { key: "6m", label: "6 m", ticks: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"], values: [7.4, 8, 8.6, 9.2, 9.6, 10, 9.4, 9.1, 8.9, 8.2, 8.8, 9.9, 10.8, 11.2] },
  { key: "3m", label: "3 m", ticks: ["Jan", "Feb", "Mar"], values: [9.2, 9.6, 9.1, 8.6, 8.9, 9.8, 10.4, 11, 11.2] },
  { key: "1m", label: "1 m", ticks: ["W1", "W2", "W3", "W4"], values: [10.2, 10.8, 10.4, 11, 11.6, 11.2, 11.8] },
];

export const MISCONFIG_SCORE = 65;
