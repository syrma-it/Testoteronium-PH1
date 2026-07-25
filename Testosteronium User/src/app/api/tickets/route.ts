import { db } from "@/db";
import { tickets } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import {
  MAX_ATTACHMENT_BYTES,
  resolveDeviceId,
  stripAttachment,
  VALID_CATEGORIES,
  VALID_PRIORITIES,
} from "@/lib/ticket-server";

export const dynamic = "force-dynamic";

/** GET /api/tickets?device_id=<id> — list this device's own tickets. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const deviceId = resolveDeviceId(url.searchParams.get("device_id"));

  await ensureSeed(deviceId);

  const rows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.deviceId, deviceId))
    .orderBy(desc(tickets.updatedAt));

  return Response.json({
    device_id: deviceId,
    tickets: rows.map(stripAttachment),
  });
}

/** POST /api/tickets — create a new ticket (multipart/form-data). */
export async function POST(req: Request) {
  const deviceId = resolveDeviceId();

  // Reject oversized uploads by declared length before buffering the body.
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared && declared > MAX_ATTACHMENT_BYTES + 8192) {
    return Response.json(
      { error: "Attachment too large — please keep it under ~1MB." },
      { status: 413 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const subject = String(form.get("subject") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const category = String(form.get("category") ?? "other");
  const priority = String(form.get("priority") ?? "medium");

  if (!subject) {
    return Response.json({ error: "Subject is required" }, { status: 400 });
  }
  if (!description) {
    return Response.json({ error: "Description is required" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!VALID_PRIORITIES.includes(priority as (typeof VALID_PRIORITIES)[number])) {
    return Response.json({ error: "Invalid priority" }, { status: 400 });
  }

  const insert: typeof tickets.$inferInsert = {
    deviceId,
    subject,
    description,
    category: category as (typeof VALID_CATEGORIES)[number],
    priority: priority as (typeof VALID_PRIORITIES)[number],
    status: "open",
  };

  // Optional file attachment (stored inline as bytea).
  const file = form.get("attachment");
  if (file && file instanceof File && file.size > 0) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return Response.json(
        { error: "Attachment too large — please keep it under ~1MB." },
        { status: 413 },
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    insert.attachmentName = file.name;
    insert.attachmentMime = file.type || "application/octet-stream";
    insert.attachmentSize = file.size;
    insert.attachmentData = buffer;
  }

  const [created] = await db.insert(tickets).values(insert).returning();
  if (!created) {
    return Response.json({ error: "Failed to create ticket" }, { status: 500 });
  }

  return Response.json(stripAttachment(created), { status: 201 });
}
