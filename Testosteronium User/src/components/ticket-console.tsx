"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CategoryChip,
  PriorityDot,
  StatusBadge,
} from "@/components/badges";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DownloadIcon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  TicketIcon,
} from "@/components/icons";
import {
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
  PRIORITY_META,
  PRIORITY_OPTIONS,
  STATUS_META,
  formatDate,
  formatTicketId,
  initials,
  relativeTime,
} from "@/lib/format";
import type {
  ClientComment,
  ClientTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";

const FIELD =
  "w-full rounded-md border border-hair bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-faint outline-none transition focus:border-teal/60 focus:ring-1 focus:ring-teal/30";
const LABEL =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted";

const FILTERS: ("all" | TicketStatus)[] = [
  "all",
  "open",
  "in_progress",
  "waiting_on_user",
  "resolved",
  "closed",
];

function Avatar({ name, tone }: { name: string; tone: "user" | "agent" }) {
  const isAgent = tone === "agent";
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold ${
        isAgent
          ? "bg-teal/15 text-teal ring-1 ring-teal/30"
          : "bg-hair text-ink ring-1 ring-hair-strong"
      }`}
    >
      {initials(name)}
    </span>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/* --------------------------------- list ---------------------------------- */

function TicketRow({
  ticket,
  onOpen,
}: {
  ticket: ClientTicket;
  onOpen: (id: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(ticket.id)}
      className="group flex w-full items-center gap-3 border-b border-hair px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
    >
      <div className="min-w-0 flex-1">
        <span className="font-mono text-[10px] tracking-wide text-faint">
          {formatTicketId(ticket.id)}
        </span>
        <p className="mt-0.5 truncate text-sm text-ink">{ticket.subject}</p>
      </div>

      <div className="hidden w-24 shrink-0 sm:block">
        <CategoryChip category={ticket.category} />
      </div>

      <div className="hidden w-20 shrink-0 md:block">
        <PriorityDot priority={ticket.priority} />
      </div>

      <div className="w-[124px] shrink-0">
        <StatusBadge status={ticket.status} size="sm" />
      </div>

      <div className="hidden w-32 shrink-0 items-center gap-1.5 lg:flex">
        {ticket.assignedAgent ? (
          <>
            <Avatar name={ticket.assignedAgent} tone="agent" />
            <span className="truncate text-xs text-muted">
              {ticket.assignedAgent}
            </span>
          </>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
            Unassigned
          </span>
        )}
      </div>

      <div className="hidden w-16 shrink-0 text-right font-mono text-[10px] text-muted sm:block">
        {relativeTime(ticket.updatedAt)}
      </div>

      <ChevronRightIcon className="h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-teal" />
    </button>
  );
}

function FilterPills({
  active,
  counts,
  onChange,
}: {
  active: "all" | TicketStatus;
  counts: Record<string, number>;
  onChange: (v: "all" | TicketStatus) => void;
}) {
  return (
    <div className="scroll-slim -mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1">
      {FILTERS.map((f) => {
        const label = f === "all" ? "All" : STATUS_META[f].label;
        const isActive = active === f;
        return (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] tracking-wide transition-colors ${
              isActive
                ? "border-teal/50 bg-teal/10 text-teal"
                : "border-hair text-muted hover:border-hair-strong hover:text-ink"
            }`}
          >
            {label}
            <span className={isActive ? "text-teal/70" : "text-faint"}>
              {counts[f] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- thread --------------------------------- */

function ThreadMessage({
  role,
  author,
  body,
  createdAt,
}: {
  role: "user" | "agent";
  author: string;
  body: string;
  createdAt: string;
}) {
  const isUser = role === "user";
  const displayName = isUser ? author || "You" : author;
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar name={displayName} tone={role} />
      <div className={`flex max-w-[80%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-medium text-ink">{displayName}</span>
          {!isUser && (
            <span className="rounded border border-teal/30 bg-teal/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-teal">
              IT Support
            </span>
          )}
          <span className="font-mono text-[10px] text-faint">
            {relativeTime(createdAt)}
          </span>
        </div>
        <div
          className={`whitespace-pre-wrap break-words rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "border border-teal/25 bg-teal/10 text-ink"
              : "border border-hair bg-surface-2 text-ink"
          }`}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ new ticket ------------------------------- */

function NewTicketModal({
  deviceId,
  onClose,
  onCreated,
}: {
  deviceId: string;
  onClose: () => void;
  onCreated: (ticket: ClientTicket) => void;
}) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("hardware");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError("Subject and description are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("subject", subject.trim());
      form.set("description", description.trim());
      form.set("category", category);
      form.set("priority", priority);
      form.set("device_id", deviceId);
      if (file) form.set("attachment", file, file.name);

      const res = await fetch("/api/tickets", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create ticket");
      }
      const created = (await res.json()) as ClientTicket;
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="toast-in flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[14px] border border-hair bg-surface shadow-2xl sm:rounded-[14px]">
        <div className="flex items-center justify-between border-b border-hair px-5 py-4">
          <div className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4 text-teal" />
            <h3 className="font-mono text-sm font-semibold tracking-tight text-ink">
              New Support Ticket
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="scroll-slim flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            <div>
              <label className={LABEL} htmlFor="nt-subject">
                Subject
              </label>
              <input
                id="nt-subject"
                className={FIELD}
                placeholder="Brief summary of the issue"
                value={subject}
                maxLength={140}
                onChange={(e) => setSubject(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL} htmlFor="nt-category">
                  Category
                </label>
                <select
                  id="nt-category"
                  className={FIELD}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c} className="bg-surface">
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="nt-priority">
                  Priority
                </label>
                <select
                  id="nt-priority"
                  className={FIELD}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p} className="bg-surface">
                      {PRIORITY_META[p].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL} htmlFor="nt-desc">
                Description
              </label>
              <textarea
                id="nt-desc"
                className={`${FIELD} min-h-[120px] resize-y`}
                placeholder="Describe what's happening, when it started, and any error messages you've seen."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className={LABEL} htmlFor="nt-file">
                Attachment <span className="normal-case text-faint">(optional)</span>
              </label>
              {file ? (
                <div className="flex items-center justify-between rounded-md border border-hair bg-surface-2 px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                    <PaperclipIcon className="h-4 w-4 shrink-0 text-teal" />
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-faint">({formatBytes(file.size)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="ml-2 shrink-0 rounded p-1 text-muted hover:text-ink"
                    aria-label="Remove attachment"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="nt-file"
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-hair-strong bg-surface-2 px-3 py-2.5 text-sm text-muted transition-colors hover:border-teal/40 hover:text-ink"
                >
                  <PaperclipIcon className="h-4 w-4" />
                  Add a screenshot or log (max 1MB)
                  <input
                    id="nt-file"
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            {error && (
              <p className="rounded-md border border-[#F26B6B]/30 bg-[#F26B6B]/10 px-3 py-2 text-xs text-[#F26B6B]">
                {error}
              </p>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-hair px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-hair px-3.5 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal px-4 py-2 text-sm font-medium text-[#06120f] transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ main console ----------------------------- */

export function TicketConsole({
  deviceId,
  deviceName,
  userName,
  osName,
}: {
  deviceId: string;
  deviceName: string;
  userName: string;
  osName: string;
}) {
  const [tickets, setTickets] = useState<ClientTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "detail">("list");
  const [selected, setSelected] = useState<{
    ticket: ClientTicket;
    comments: ClientComment[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  const [showNew, setShowNew] = useState(false);

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/tickets?device_id=${encodeURIComponent(deviceId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("bad response");
      const data = (await res.json()) as { tickets: ClientTicket[] };
      setTickets(data.tickets);
    } catch {
      setLoadError("Couldn't load your tickets. Retrying…");
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openTicket = useCallback(
    async (id: number) => {
      setLoadingDetail(true);
      setReplyError(null);
      try {
        const res = await fetch(
          `/api/tickets/${id}?device_id=${encodeURIComponent(deviceId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error("bad response");
        const data = (await res.json()) as {
          ticket: ClientTicket;
          comments: ClientComment[];
        };
        setSelected(data);
        setView("detail");
        setReply("");
        requestAnimationFrame(() => replyRef.current?.focus());
      } catch {
        setLoadError("Couldn't open this ticket.");
      } finally {
        setLoadingDetail(false);
      }
    },
    [deviceId],
  );

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setSending(true);
    setReplyError(null);
    try {
      const res = await fetch(
        `/api/tickets/${selected.ticket.id}/comments?device_id=${encodeURIComponent(deviceId)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ body: reply.trim(), author: userName }),
        },
      );
      if (!res.ok) throw new Error("bad response");
      const data = (await res.json()) as {
        comment: ClientComment;
        status: TicketStatus;
      };
      setSelected({
        ticket: {
          ...selected.ticket,
          status: data.status,
          updatedAt: new Date().toISOString(),
        },
        comments: [...selected.comments, data.comment],
      });
      setReply("");
      // Keep the list badge in sync.
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selected.ticket.id
            ? { ...t, status: data.status, updatedAt: new Date().toISOString() }
            : t,
        ),
      );
      requestAnimationFrame(() => replyRef.current?.focus());
    } catch {
      setReplyError("Couldn't send your reply. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function backToList() {
    setView("list");
    setSelected(null);
  }

  function handleCreated(ticket: ClientTicket) {
    setShowNew(false);
    void loadList();
    setSelected({ ticket, comments: [] });
    setView("detail");
    setReply("");
    requestAnimationFrame(() => replyRef.current?.focus());
  }

  const counts: Record<string, number> = { all: tickets.length };
  for (const t of tickets) counts[t.status] = (counts[t.status] ?? 0) + 1;
  const visible =
    filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="mt-8">
      {view === "list" ? (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <FilterPills active={filter} counts={counts} onChange={setFilter} />
            </div>
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-teal px-3.5 py-2 text-sm font-medium text-[#06120f] transition-colors hover:bg-teal/90"
            >
              <PlusIcon className="h-4 w-4" />
              New Ticket
            </button>
          </div>

          <div className="overflow-hidden rounded-[10px] border border-hair bg-surface">
            {loading ? (
              <div className="divide-y divide-hair">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-4">
                    <div className="h-3 w-16 animate-pulse rounded bg-hair-strong" />
                    <div className="h-3 flex-1 animate-pulse rounded bg-hair-strong" />
                  </div>
                ))}
              </div>
            ) : loadError && tickets.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-muted">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void loadList()}
                  className="mt-3 rounded-md border border-hair px-3 py-1.5 text-xs text-muted hover:text-ink"
                >
                  Retry
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-hair bg-surface-2 text-faint">
                  <TicketIcon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm text-ink">No tickets here</p>
                <p className="mt-1 max-w-xs text-xs text-muted">
                  {filter === "all"
                    ? "You haven't reported any issues yet. Open a ticket and IT will pick it up."
                    : `Nothing with status "${STATUS_META[filter as TicketStatus].label}".`}
                </p>
                <button
                  type="button"
                  onClick={() => setShowNew(true)}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-teal/40 bg-teal/10 px-3.5 py-2 text-sm text-teal transition-colors hover:bg-teal/15"
                >
                  <PlusIcon className="h-4 w-4" />
                  Open your first ticket
                </button>
              </div>
            ) : (
              visible.map((t) => (
                <TicketRow key={t.id} ticket={t} onOpen={(id) => void openTicket(id)} />
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={backToList}
            className="mb-4 inline-flex items-center gap-1 font-mono text-xs text-muted transition-colors hover:text-ink"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            All tickets
          </button>

          {loadingDetail || !selected ? (
            <div className="rounded-[10px] border border-hair bg-surface p-8 text-center text-sm text-muted">
              Loading ticket…
            </div>
          ) : (
            <div className="space-y-5">
              {/* header panel */}
              <div className="overflow-hidden rounded-[10px] border border-hair bg-surface">
                <div className="border-b border-hair p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] tracking-wide text-faint">
                        {formatTicketId(selected.ticket.id)}
                      </span>
                      <h2 className="mt-1 font-mono text-xl font-semibold tracking-tight text-ink">
                        {selected.ticket.subject}
                      </h2>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge status={selected.ticket.status} />
                        <CategoryChip category={selected.ticket.category} />
                        <PriorityDot priority={selected.ticket.priority} />
                      </div>
                    </div>
                    <div className="shrink-0 rounded-lg border border-hair bg-surface-2 px-3 py-2.5 text-right">
                      <p className="font-mono text-[10px] uppercase tracking-wide text-faint">
                        Assigned to
                      </p>
                      {selected.ticket.assignedAgent ? (
                        <p className="mt-1 flex items-center justify-end gap-1.5 text-sm text-ink">
                          <Avatar name={selected.ticket.assignedAgent} tone="agent" />
                          {selected.ticket.assignedAgent}
                        </p>
                      ) : (
                        <p className="mt-1 font-mono text-xs text-muted">Unassigned</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-muted">
                    <span>
                      <span className="text-faint">Opened</span>{" "}
                      {formatDate(selected.ticket.createdAt)}
                    </span>
                    <span>
                      <span className="text-faint">Updated</span>{" "}
                      {formatDate(selected.ticket.updatedAt)}
                    </span>
                  </div>

                  {selected.ticket.attachmentName && (
                    <a
                      href={`/api/tickets/${selected.ticket.id}/attachment?device_id=${encodeURIComponent(deviceId)}`}
                      className="mt-4 inline-flex items-center gap-2 rounded-md border border-hair bg-surface-2 px-3 py-2 text-xs text-muted transition-colors hover:border-teal/40 hover:text-ink"
                    >
                      <DownloadIcon className="h-4 w-4 text-teal" />
                      {selected.ticket.attachmentName}
                      {selected.ticket.attachmentSize
                        ? ` · ${formatBytes(selected.ticket.attachmentSize)}`
                        : ""}
                    </a>
                  )}
                </div>

                {/* thread */}
                <div className="space-y-5 p-5">
                  <ThreadMessage
                    role="user"
                    author={userName || "You"}
                    body={selected.ticket.description}
                    createdAt={selected.ticket.createdAt}
                  />
                  {selected.comments.map((c) => (
                    <ThreadMessage
                      key={c.id}
                      role={c.authorRole}
                      author={c.author}
                      body={c.body}
                      createdAt={c.createdAt}
                    />
                  ))}
                </div>

                {/* reply */}
                <div className="border-t border-hair p-5">
                  <label className={LABEL} htmlFor="reply">
                    Add a reply
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <textarea
                      id="reply"
                      ref={replyRef}
                      className={`${FIELD} min-h-[72px] flex-1 resize-y`}
                      placeholder={
                        selected.ticket.status === "resolved" ||
                        selected.ticket.status === "closed"
                          ? "Reopen the conversation by replying…"
                          : "Write a reply to IT support…"
                      }
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          e.preventDefault();
                          void sendReply();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void sendReply()}
                      disabled={sending || !reply.trim()}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-teal px-4 py-2.5 text-sm font-medium text-[#06120f] transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60 sm:self-stretch"
                    >
                      <SendIcon className="h-4 w-4" />
                      {sending ? "Sending…" : "Send"}
                    </button>
                  </div>
                  {replyError && (
                    <p className="mt-2 text-xs text-[#F26B6B]">{replyError}</p>
                  )}
                  <p className="mt-2 font-mono text-[10px] text-faint">
                    ⌘/Ctrl + Enter to send · replies reopen a waiting ticket
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  This ticket is bound to{" "}
                  <span className="font-mono text-ink">{deviceName}</span>
                </span>
                <button
                  type="button"
                  onClick={() => void openTicket(selected.ticket.id)}
                  className="font-mono text-[11px] text-faint hover:text-muted"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showNew && (
        <NewTicketModal
          deviceId={deviceId}
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
