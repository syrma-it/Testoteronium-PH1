import { getDeviceId } from "./device";
import type { Ticket } from "@/db/schema";

export const VALID_CATEGORIES = [
  "hardware",
  "software",
  "network",
  "access",
  "other",
] as const;

export const VALID_PRIORITIES = ["low", "medium", "high"] as const;

// ~1MB. This sandbox caps total request body near 1MiB, so we keep the cap
// under that and validate on both client and server to avoid a hard reset.
export const MAX_ATTACHMENT_BYTES = 1_000_000;

export function resolveDeviceId(provided?: string | null): string {
  const v = (provided ?? "").trim();
  return v || getDeviceId();
}

/** Drops the heavy bytea blob before sending a ticket to the client. */
export function stripAttachment(row: Ticket) {
  const { attachmentData: _attachmentData, ...rest } = row;
  return rest;
}
