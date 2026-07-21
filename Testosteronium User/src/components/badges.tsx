import type { TicketCategory, TicketPriority, TicketStatus } from "@/lib/types";
import { CATEGORY_LABEL, PRIORITY_META, STATUS_META } from "@/lib/format";

export function StatusBadge({
  status,
  size = "md",
}: {
  status: TicketStatus;
  size?: "sm" | "md";
}) {
  const meta = STATUS_META[status];
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium uppercase tracking-wide ${pad}`}
      style={{
        color: meta.color,
        borderColor: `${meta.color}40`,
        backgroundColor: `${meta.color}14`,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: TicketPriority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-muted"
      style={{ color: meta.color }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label} priority
    </span>
  );
}

export function CategoryChip({ category }: { category: TicketCategory }) {
  return (
    <span className="inline-flex items-center rounded-md border border-hair bg-surface-2 px-2 py-0.5 font-mono text-[11px] tracking-wide text-muted">
      {CATEGORY_LABEL[category]}
    </span>
  );
}
