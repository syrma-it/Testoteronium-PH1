import { CATEGORY_LABEL, PRIORITY_META, STATUS_META } from "../lib/format";
import type { TicketCategory, TicketPriority, TicketStatus } from "../lib/types";

export function CategoryChip({ category }: { category: TicketCategory }) {
  const label = CATEGORY_LABEL[category] ?? category;
  return (
    <span className="inline-flex items-center rounded-full border border-hair bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
      {label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: TicketPriority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta?.color }}
      />
      {meta?.label ?? priority}
    </span>
  );
}

export function StatusBadge({
  status,
  size = "md",
}: {
  status: TicketStatus;
  size?: "sm" | "md";
}) {
  const meta = STATUS_META[status];
  const px = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-medium ${px} ${meta?.bg ?? ""} ${meta?.text ?? "text-muted"}`}
    >
      {meta?.label ?? status}
    </span>
  );
}
