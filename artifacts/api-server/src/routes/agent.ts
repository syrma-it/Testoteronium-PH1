import { Router } from "express";
import { db } from "@workspace/db";
import { trackedAssets, enrollmentTokens } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * POST /api/agent/checkin
 * Called by enrolled devices (the Python agent, or this server's own check-in loop).
 * Upserts a row in tracked_assets keyed on device_id.
 */
router.post("/agent/checkin", async (req, res) => {
  const {
    device_id,
    hostname,
    username,
    ip_address,
    mac_address,
    serial_number,
    os_name,
    os_version,
    cpu,
    ram_gb,
    disk_gb,
    enroll_token,
  } = req.body as Record<string, string | number | undefined>;

  if (!device_id || !hostname) {
    res.status(400).json({ error: "device_id and hostname are required" });
    return;
  }

  // Validate enroll token if provided
  let enrolledViaToken: string | null = null;
  if (enroll_token) {
    const [token] = await db
      .select()
      .from(enrollmentTokens)
      .where(eq(enrollmentTokens.token, String(enroll_token)))
      .limit(1);

    if (token && !token.usedAt && new Date() < token.expiresAt) {
      enrolledViaToken = String(enroll_token);
      await db
        .update(enrollmentTokens)
        .set({ usedAt: new Date(), usedByMac: mac_address ? String(mac_address) : null })
        .where(eq(enrollmentTokens.token, String(enroll_token)));
    }
  }

  const now = new Date();
  const specs = cpu
    ? `${cpu}${ram_gb ? ` · ${ram_gb}GB RAM` : ""}${disk_gb ? ` · ${disk_gb}GB disk` : ""}`
    : null;

  await db
    .insert(trackedAssets)
    .values({
      deviceId: String(device_id),
      hostname: String(hostname),
      username: username ? String(username) : null,
      ipAddress: ip_address ? String(ip_address) : null,
      macAddress: mac_address ? String(mac_address) : null,
      serial: serial_number ? String(serial_number) : null,
      osName: os_name ? String(os_name) : null,
      osVersion: os_version ? String(os_version) : null,
      specs,
      status: "online",
      firstSeen: now,
      lastSeen: now,
      enrolledViaToken,
    })
    .onConflictDoUpdate({
      target: trackedAssets.deviceId,
      set: {
        hostname: String(hostname),
        username: username ? String(username) : null,
        ipAddress: ip_address ? String(ip_address) : null,
        macAddress: mac_address ? String(mac_address) : null,
        serial: serial_number ? String(serial_number) : null,
        osName: os_name ? String(os_name) : null,
        osVersion: os_version ? String(os_version) : null,
        specs,
        status: "online",
        lastSeen: now,
      },
    });

  res.json({ status: "ok" });
});

export default router;
