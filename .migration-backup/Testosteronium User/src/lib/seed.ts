import { db } from "@/db";
import { ticketComments, tickets } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Idempotent demo seed. The first time a device opens its ticket list and has
 * no tickets yet, we drop in a couple of realistic example requests (with an
 * agent reply each) so the list/detail/thread views have something to show.
 *
 * Marked in-process so we only ever hit the DB to check once per device.
 */
const seeded = new Set<string>();

export async function ensureSeed(deviceId: string): Promise<void> {
  if (seeded.has(deviceId)) return;

  const existing = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.deviceId, deviceId))
    .limit(1);

  if (existing.length > 0) {
    seeded.add(deviceId);
    return;
  }

  const created = await db
    .insert(tickets)
    .values([
      {
        deviceId,
        subject: "VPN drops every few minutes on the office Wi-Fi",
        description:
          "My GlobalProtect client keeps disconnecting every 5–10 minutes when I'm on the corporate Wi-Fi. It stays connected fine at home, so it seems specific to the office network. Working from desk 14 on floor 3.",
        category: "network",
        priority: "high",
        status: "in_progress",
        assignedAgent: "Maya Chen",
      },
      {
        deviceId,
        subject: "Request access to the Finance shared drive",
        description:
          "I've joined the budgeting project and need read access to \\\\corp\\Finance-Shared for the Q3 forecasts. My manager has approved this request.",
        category: "access",
        priority: "medium",
        status: "waiting_on_user",
        assignedAgent: "Devon Park",
      },
    ])
    .returning({ id: tickets.id });

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
      body: "Almost there — could you reply with your manager's email approval (a quick \"approved\" from them works) so I have it on record? Once I have that I'll add you to the Finance-Shared group and you'll have access after your next sign-in.",
    });
  }

  seeded.add(deviceId);
}
