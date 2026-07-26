import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon, OtherIcon, TicketIcon } from "./icons";

function Toast({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="toast-in pointer-events-none absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center gap-2 rounded-md border border-hair bg-surface-2/95 px-3 py-1.5 text-xs text-muted shadow-lg backdrop-blur">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted" />
      Coming soon
    </div>
  );
}

export function HomeCards() {
  const [toast, setToast] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Ticket — the one enabled tool */}
      <Link
        to="/ticket"
        className="group relative flex min-h-[200px] flex-col overflow-hidden rounded-[10px] border border-hair bg-surface p-6 pl-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/60 hover:shadow-[0_18px_40px_-18px_rgba(52,209,180,0.45)] focus-visible:-translate-y-0.5 focus-visible:border-teal/60 focus-visible:outline-none"
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-teal" />
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-teal/30 bg-teal/10 text-teal">
            <TicketIcon className="h-5 w-5" />
          </span>
          <ChevronRightIcon className="h-5 w-5 text-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-teal" />
        </div>
        <div className="mt-5">
          <h2 className="font-mono text-lg font-semibold tracking-tight text-ink">Ticket</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Report a problem or request help from IT — track status until it's resolved.
          </p>
        </div>
        <div className="mt-auto pt-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-teal/80">
            Open support →
          </span>
        </div>
      </Link>

      {/* Other — disabled placeholder */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        onClick={() => {
          setToast(true);
          window.setTimeout(() => setToast(false), 2200);
        }}
        className="relative flex min-h-[200px] cursor-not-allowed flex-col overflow-hidden rounded-[10px] border border-hair bg-surface/60 p-6 pl-7 opacity-55"
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-muted" />
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-hair bg-surface-2 text-muted">
            <OtherIcon className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-5">
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-lg font-semibold tracking-tight text-ink">Other</h2>
            <span className="rounded border border-hair px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-faint">
              Soon
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            More self-service tools coming soon.
          </p>
        </div>
        <Toast show={toast} />
      </button>
    </div>
  );
}
