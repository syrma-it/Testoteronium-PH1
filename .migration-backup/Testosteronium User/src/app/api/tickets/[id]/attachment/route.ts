import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveDeviceId } from "@/lib/ticket-server";

export const dynamic = "force-dynamic";

/** GET /api/tickets/<id>/attachment — streams the stored attachment. */
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

  const [ticket] = await db
    .select({
      deviceId: tickets.deviceId,
      name: tickets.attachmentName,
      mime: tickets.attachmentMime,
      data: tickets.attachmentData,
    })
    .from(tickets)
    .where(eq(tickets.id, ticketId));

  if (!ticket || ticket.deviceId !== deviceId || !ticket.data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(ticket.data as unknown as BodyInit, {
    headers: {
      "content-type": ticket.mime || "application/octet-stream",
      "content-disposition": `inline; filename="${encodeURIComponent(ticket.name ?? "attachment")}"`,
      "cache-control": "private, no-cache",
    },
  });
}
