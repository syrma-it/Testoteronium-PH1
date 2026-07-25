import { db } from "@/db";
import { ticketComments, tickets, type TicketStatus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSystemInfo } from "@/lib/sysinfo";
import { resolveDeviceId } from "@/lib/ticket-server";

export const dynamic = "force-dynamic";

/** POST /api/tickets/<id>/comments — end user adds a reply. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isFinite(ticketId)) {
    return Response.json({ error: "Invalid ticket id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const deviceId = resolveDeviceId(url.searchParams.get("device_id"));

  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
  if (!ticket || ticket.deviceId !== deviceId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let bodyText = "";
  let providedAuthor = "";
  try {
    const json = (await req.json()) as { body?: string; author?: string };
    bodyText = String(json.body ?? "").trim();
    providedAuthor = String(json.author ?? "").trim();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!bodyText) {
    return Response.json({ error: "Reply cannot be empty" }, { status: 400 });
  }

  // The author defaults to the OS user of this device — the same identity that
  // checks in — so the thread always reads as "this employee" replying.
  const author = providedAuthor || getSystemInfo().username || "You";

  const [comment] = await db
    .insert(ticketComments)
    .values({
      ticketId,
      author,
      authorRole: "user",
      body: bodyText,
    })
    .returning();

  // A user reply reopens the active loop: bump a "Waiting on You" ticket back
  // to "In Progress" and always refresh updatedAt.
  const nextStatus: TicketStatus =
    ticket.status === "waiting_on_user" ? "in_progress" : ticket.status;

  await db
    .update(tickets)
    .set({ updatedAt: new Date(), status: nextStatus })
    .where(eq(tickets.id, ticketId));

  return Response.json({ comment, status: nextStatus }, { status: 201 });
}


