import { Router } from "express";
import { db } from "@workspace/db";
import { trackedAssets, manualAssets, fetchingAssets } from "@workspace/db/schema";
import { eq, isNull, sql } from "drizzle-orm";

const router = Router();

/** GET /api/assets/summary */
router.get("/assets/summary", async (_req, res) => {
  const [tracked, manual, fetching] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(trackedAssets),
    db.select({ count: sql<number>`count(*)::int` }).from(manualAssets).where(isNull(manualAssets.deletedAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(fetchingAssets),
  ]);
  res.json({
    tracked: tracked[0]?.count ?? 0,
    manual: manual[0]?.count ?? 0,
    fetching: fetching[0]?.count ?? 0,
  });
});

/** GET /api/assets/tracked */
router.get("/assets/tracked", async (_req, res) => {
  const rows = await db.select().from(trackedAssets).orderBy(trackedAssets.lastSeen);
  res.json(rows.map((r) => ({
    id: r.id,
    hostname: r.hostname,
    username: r.username,
    ip: r.ipAddress,
    mac_address: r.macAddress,
    serial: r.serial,
    os: r.osName,
    specs: r.specs,
    status: r.status,
    first_seen: r.firstSeen?.toISOString() ?? "",
    last_seen: r.lastSeen?.toISOString() ?? "",
    enrolled_via_token: r.enrolledViaToken,
  })));
});

/** GET /api/assets/manual */
router.get("/assets/manual", async (_req, res) => {
  const rows = await db.select().from(manualAssets).where(isNull(manualAssets.deletedAt)).orderBy(manualAssets.addedOn);
  res.json(rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    owner: r.owner,
    location: r.location,
    serial: r.serial,
    notes: r.notes,
    source: r.source,
    addedOn: r.addedOn?.toISOString()?.split("T")[0] ?? "",
  })));
});

/** POST /api/assets/manual */
router.post("/assets/manual", async (req, res) => {
  const { name, type, owner, location, serial, notes } = req.body as Record<string, string>;
  if (!name?.trim()) { res.status(400).json({ error: "name is required" }); return; }

  const [created] = await db.insert(manualAssets).values({
    name: name.trim(),
    type: type?.trim() || null,
    owner: owner?.trim() || null,
    location: location?.trim() || null,
    serial: serial?.trim() || null,
    notes: notes?.trim() || null,
    source: "Manual entry",
  }).returning({ id: manualAssets.id });

  res.status(201).json({ status: "created", id: created?.id ?? null });
});

/** PUT /api/assets/manual/:id */
router.put("/assets/manual/:id", async (req, res) => {
  const id = parseInt(req.params["id"] ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, type, owner, location, serial, notes } = req.body as Record<string, string>;
  await db.update(manualAssets).set({
    ...(name ? { name: name.trim() } : {}),
    type: type?.trim() || null,
    owner: owner?.trim() || null,
    location: location?.trim() || null,
    serial: serial?.trim() || null,
    notes: notes?.trim() || null,
  }).where(eq(manualAssets.id, id));

  res.json({ status: "updated" });
});

/** DELETE /api/assets/manual/:id (soft) */
router.delete("/assets/manual/:id", async (req, res) => {
  const id = parseInt(req.params["id"] ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.update(manualAssets).set({ deletedAt: new Date() }).where(eq(manualAssets.id, id));
  res.json({ status: "deleted" });
});

/** GET /api/assets/fetching */
router.get("/assets/fetching", async (_req, res) => {
  const rows = await db.select().from(fetchingAssets).orderBy(fetchingAssets.firstSeen);
  res.json(rows.map((r) => ({
    id: r.id,
    ip: r.ip,
    mac: r.mac,
    guess: r.guess,
    os_guess: r.osGuess,
    connection: r.connection,
    first_seen: r.firstSeen?.toISOString() ?? "",
    last_seen: r.lastSeen?.toISOString() ?? "",
  })));
});

export default router;
