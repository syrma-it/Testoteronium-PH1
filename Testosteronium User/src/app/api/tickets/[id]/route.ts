import { db } from "@/db";
import { ticketComments, tickets } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { resolveDeviceId, stripAttachment } from "@/lib/ticket-server";

export const dynamic = "force-dynamic";

/** GET /api/tickets/<id> — full detail + comment thread (scoped to device). */
export async function GET(
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

  const comments = await db
    .select()
    .from(ticketComments)
    .where(eq(ticketComments.ticketId, ticketId))
    .orderBy(asc(ticketComments.createdAt));

  return Response.json({ ticket: stripAttachment(ticket), comments });
}
