import { Router, type Request } from "express";
import multer from "multer";
import { db } from "@workspace/db";
import { tickets, ticketComments } from "@workspace/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { getDeviceId } from "../lib/device.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10_000_000 } });

const VALID_CATEGORIES = ["hardware", "software", "network", "access", "other"] as const;
const VALID_PRIORITIES = ["low", "medium", "high"] as const;
const MAX_ATTACHMENT_BYTES = 1_000_000;

function resolveDeviceId(provided?: string | null): string {
  const v = (provided ?? "").trim();
  return v || getDeviceId();
}

function stripAttachment(row: typeof tickets.$inferSelect) {
  const { attachmentData: _d, ...rest } = row;
  return rest;
}

/** Idempotent seeder — adds two demo tickets for a device on first visit */
const seeded = new Set<string>();

async function ensureSeed(deviceId: string) {
  if (seeded.has(deviceId)) return;
  const existing = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.deviceId, deviceId)).limit(1);
  if (existing.length > 0) { seeded.add(deviceId); return; }

  const created = await db.insert(tickets).values([
    {
      deviceId,
      subject: "VPN drops every few minutes on the office Wi-Fi",
      description: "My GlobalProtect client keeps disconnecting every 5–10 minutes when I'm on the corporate Wi-Fi. It stays connected fine at home, so it seems specific to the office network. Working from desk 14 on floor 3.",
      category: "network",
      priority: "high",
      status: "in_progress",
      assignedAgent: "Maya Chen",
    },
    {
      deviceId,
      subject: "Request access to the Finance shared drive",
      description: "I've joined the budgeting project and need read access to \\\\corp\\Finance-Shared for the Q3 forecasts. My manager has approved this request.",
      category: "access",
      priority: "medium",
      status: "waiting_on_user",
      assignedAgent: "Devon Park",
    },
  ]).returning({ id: tickets.id });

  if (created[0]) {
    await db.insert(ticketComments).values({
      ticketId: created[0].id,
      author: "Maya Chen",
      authorRole: "agent",
      body: "Thanks for flagging this. I can see intermittent reconnects from your machine in the gateway logs. Can you confirm which SSID you're on (Corp-Staff vs. Corp-Devices) and roughly what time the last drop happened? I'll adjust your client profile in the meantime.",
    });
  }
  if (created[1]) {
    await db.insert(ticketComments).values({
      ticketId: created[1].id,
      author: "Devon Park",
      authorRole: "agent",
      body: "Almost there — could you reply with your manager's email approval so I have it on record? Once I have that I'll add you to the Finance-Shared group and you'll have access after your next sign-in.",
    });
  }
  seeded.add(deviceId);
}

/** GET /api/tickets?device_id=<id> */
router.get("/tickets", async (req, res) => {
  const deviceId = resolveDeviceId(req.query["device_id"] as string);
  await ensureSeed(deviceId);
  const rows = await db.select().from(tickets).where(eq(tickets.deviceId, deviceId)).orderBy(desc(tickets.updatedAt));
  res.json({ device_id: deviceId, tickets: rows.map(stripAttachment) });
});

/** GET /api/tickets/:id */
router.get("/tickets/:id", async (req, res) => {
  const id = parseInt(req.params["id"] ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deviceId = resolveDeviceId(req.query["device_id"] as string);

  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!ticket || ticket.deviceId !== deviceId) { res.status(404).json({ error: "Not found" }); return; }

  const comments = await db.select().from(ticketComments).where(eq(ticketComments.ticketId, id)).orderBy(asc(ticketComments.createdAt));
  res.json({ ticket: stripAttachment(ticket), comments });
});

/** POST /api/tickets — multipart/form-data */
router.post("/tickets", upload.single("attachment"), async (req: Request, res) => {
  const deviceId = resolveDeviceId(req.body["device_id"] as string | undefined ?? req.query["device_id"] as string);

  const declared = Number(req.headers["content-length"] ?? "0");
  if (declared && declared > MAX_ATTACHMENT_BYTES + 8192) {
    res.status(413).json({ error: "Attachment too large — please keep it under ~1MB." });
    return;
  }

  const subject = String(req.body["subject"] ?? "").trim();
  const description = String(req.body["description"] ?? "").trim();
  const category = String(req.body["category"] ?? "other");
  const priority = String(req.body["priority"] ?? "medium");

  if (!subject) { res.status(400).json({ error: "Subject is required" }); return; }
  if (!description) { res.status(400).json({ error: "Description is required" }); return; }
  if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    res.status(400).json({ error: "Invalid category" }); return;
  }
  if (!VALID_PRIORITIES.includes(priority as typeof VALID_PRIORITIES[number])) {
    res.status(400).json({ error: "Invalid priority" }); return;
  }

  const insert: typeof tickets.$inferInsert = {
    deviceId,
    subject,
    description,
    category: category as typeof VALID_CATEGORIES[number],
    priority: priority as typeof VALID_PRIORITIES[number],
    status: "open",
  };

  const file = req.file;
  if (file && file.size > 0) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      res.status(413).json({ error: "Attachment must be 1MB or smaller" }); return;
    }
    insert.attachmentName = file.originalname;
    insert.attachmentMime = file.mimetype || "application/octet-stream";
    insert.attachmentSize = file.size;
    insert.attachmentData = file.buffer;
  }

  const [created] = await db.insert(tickets).values(insert).returning();
  if (!created) { res.status(500).json({ error: "Failed to create ticket" }); return; }

  res.status(201).json(stripAttachment(created));
});

/** POST /api/tickets/:id/comments */
router.post("/tickets/:id/comments", async (req, res) => {
  const id = parseInt(req.params["id"] ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const deviceId = resolveDeviceId(req.query["device_id"] as string);
  const body = String(req.body["body"] ?? "").trim();
  const author = String(req.body["author"] ?? "User").trim() || "User";

  if (!body) { res.status(400).json({ error: "Body is required" }); return; }

  const [ticket] = await db.select({ id: tickets.id, deviceId: tickets.deviceId, status: tickets.status })
    .from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!ticket || ticket.deviceId !== deviceId) { res.status(404).json({ error: "Not found" }); return; }

  const [comment] = await db.insert(ticketComments).values({
    ticketId: id,
    author,
    authorRole: "user",
    body,
  }).returning();

  // Reopen waiting tickets when user replies
  if (ticket.status === "waiting_on_user") {
    await db.update(tickets).set({ status: "in_progress", updatedAt: new Date() }).where(eq(tickets.id, id));
  } else {
    await db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, id));
  }

  res.status(201).json({ comment, status: "created" });
});

/** GET /api/tickets/:id/attachment — binary download */
router.get("/tickets/:id/attachment", async (req, res) => {
  const id = parseInt(req.params["id"] ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!ticket || !ticket.attachmentData) { res.status(404).json({ error: "Not found" }); return; }

  res.setHeader("Content-Disposition", `attachment; filename="${ticket.attachmentName ?? "file"}"`);
  res.setHeader("Content-Type", ticket.attachmentMime ?? "application/octet-stream");
  res.send(ticket.attachmentData);
});

export default router;
