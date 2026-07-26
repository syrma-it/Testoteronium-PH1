import { Router } from "express";
import { db } from "@workspace/db";
import { enrollmentTokens } from "@workspace/db/schema";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

const router = Router();

function tokenStatus(t: typeof enrollmentTokens.$inferSelect): string {
  if (t.usedAt) return "used";
  if (new Date() > t.expiresAt) return "expired";
  return "active";
}

/** GET /api/enrollment-tokens */
router.get("/enrollment-tokens", async (_req, res) => {
  const rows = await db.select().from(enrollmentTokens).orderBy(enrollmentTokens.createdAt);
  res.json(rows.map((r) => ({
    token: r.token,
    label: r.label,
    created_at: r.createdAt.toISOString(),
    expires_at: r.expiresAt.toISOString(),
    used_at: r.usedAt?.toISOString() ?? null,
    used_by_mac: r.usedByMac ?? null,
    status: tokenStatus(r),
  })));
});

/** POST /api/enrollment-tokens */
router.post("/enrollment-tokens", async (req, res) => {
  const label = String(req.body["label"] ?? "").trim() || null;
  const expiresHours = Number(req.body["expires_hours"] ?? 72);
  if (!Number.isFinite(expiresHours) || expiresHours <= 0) {
    res.status(400).json({ error: "expires_hours must be a positive number" }); return;
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + expiresHours * 3600_000);

  const [created] = await db.insert(enrollmentTokens).values({ token, label, expiresAt }).returning();
  if (!created) { res.status(500).json({ error: "Failed to create token" }); return; }

  res.status(201).json({
    token: created.token,
    label: created.label,
    created_at: created.createdAt.toISOString(),
    expires_at: created.expiresAt.toISOString(),
    used_at: null,
    used_by_mac: null,
    status: "active",
  });
});

/** GET /api/patch/:token/info — EnrollPage token validation */
router.get("/patch/:token/info", async (req, res) => {
  const { token } = req.params;
  const [row] = await db.select().from(enrollmentTokens).where(eq(enrollmentTokens.token, token!)).limit(1);
  if (!row) { res.status(404).json({ reason: "This link does not exist." }); return; }
  if (row.usedAt) { res.status(410).json({ reason: "This link has already been used." }); return; }
  if (new Date() > row.expiresAt) { res.status(410).json({ reason: "This link has expired." }); return; }
  res.json({ token: row.token, label: row.label });
});

/** GET /api/patch/:token/download — stub agent script download */
router.get("/patch/:token/download", async (req, res) => {
  const { token } = req.params;
  const [row] = await db.select().from(enrollmentTokens).where(eq(enrollmentTokens.token, token!)).limit(1);
  if (!row || row.usedAt || new Date() > row.expiresAt) {
    res.status(410).json({ error: "Token invalid or expired" }); return;
  }

  const script = `#!/usr/bin/env python3
"""
Testosteronium enrollment agent — auto-generated for token: ${token}
Run once to register this device with IT.
"""
import json, os, platform, socket, subprocess, sys, time, uuid

ENROLL_TOKEN = "${token}"
SERVER_URL = "${process.env["VITE_API_BASE"] ?? "https://your-server.example.com"}/api/agent/checkin"

def get_mac():
    try:
        macs = []
        for iface, addrs in socket.if_nameindex():
            pass
    except Exception:
        pass
    return str(uuid.getnode()).replace(':', '-')

def collect():
    return {
        "device_id": str(uuid.uuid5(uuid.NAMESPACE_DNS, socket.gethostname())),
        "hostname": socket.gethostname(),
        "username": os.getlogin(),
        "os_name": platform.system(),
        "os_version": platform.release(),
        "enroll_token": ENROLL_TOKEN,
    }

import urllib.request
data = json.dumps(collect()).encode()
req = urllib.request.Request(SERVER_URL, data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        print("Enrolled successfully:", r.read().decode())
except Exception as e:
    print("Error:", e)
`;

  res.setHeader("Content-Disposition", `attachment; filename="enroll_agent.py"`);
  res.setHeader("Content-Type", "text/x-python");
  res.send(script);
});

export default router;
