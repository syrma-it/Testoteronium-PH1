import type { TicketCategory, TicketPriority, TicketStatus } from "@/lib/types";

export const STATUS_META: Record<
  TicketStatus,
  { label: string; color: string; dot: string }
> = {
  open: { label: "Open", color: "#F2A93B", dot: "#F2A93B" },
  in_progress: { label: "In Progress", color: "#5B8DEF", dot: "#5B8DEF" },
  waiting_on_user: { label: "Waiting on You", color: "#B98CFF", dot: "#B98CFF" },
  resolved: { label: "Resolved", color: "#34D1B4", dot: "#34D1B4" },
  closed: { label: "Closed", color: "#8792A6", dot: "#8792A6" },
};

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  hardware: "Hardware",
  software: "Software",
  network: "Network",
  access: "Access",
  other: "Other",
};

export const PRIORITY_META: Record<
  TicketPriority,
  { label: string; color: string }
> = {
  low: { label: "Low", color: "#8792A6" },
  medium: { label: "Medium", color: "#F2A93B" },
  high: { label: "High", color: "#F26B6B" },
};

export const CATEGORY_OPTIONS: TicketCategory[] = [
  "hardware",
  "software",
  "network",
  "access",
  "other",
];

export const PRIORITY_OPTIONS: TicketPriority[] = ["low", "medium", "high"];

export function formatTicketId(id: number): string {
  return `TKT-${String(id).padStart(5, "0")}`;
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function initials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
