import type { TicketCategory, TicketPriority, TicketStatus } from "./types";

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  hardware: "Hardware",
  software: "Software",
  network: "Network",
  access: "Access",
  other: "Other",
};

export const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
  { value: "network", label: "Network" },
  { value: "access", label: "Access" },
  { value: "other", label: "Other" },
];

export const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const PRIORITY_META: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "#5a6478" },
  medium: { label: "Medium", color: "#F2A93B" },
  high: { label: "High", color: "#F26B6B" },
};

export const STATUS_META: Record<TicketStatus, { label: string; bg: string; text: string }> = {
  open: { label: "Open", bg: "bg-teal/10", text: "text-teal" },
  in_progress: { label: "In Progress", bg: "bg-blue-500/10", text: "text-blue-400" },
  waiting_on_user: { label: "Waiting on You", bg: "bg-amber-500/10", text: "text-amber-400" },
  resolved: { label: "Resolved", bg: "bg-green-500/10", text: "text-green-400" },
  closed: { label: "Closed", bg: "bg-hair", text: "text-faint" },
};

export function formatTicketId(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
