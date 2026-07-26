import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const trackedAssets = pgTable("tracked_assets", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  hostname: text("hostname").notNull(),
  username: text("username"),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  serial: text("serial"),
  osName: text("os_name"),
  osVersion: text("os_version"),
  specs: text("specs"),
  status: text("status").notNull().default("online"),
  firstSeen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  enrolledViaToken: text("enrolled_via_token"),
});

export const manualAssets = pgTable("manual_assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"),
  owner: text("owner"),
  location: text("location"),
  serial: text("serial"),
  notes: text("notes"),
  source: text("source").notNull().default("Manual entry"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  addedOn: timestamp("added_on", { withTimezone: true }).notNull().defaultNow(),
});

export const fetchingAssets = pgTable("fetching_assets", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  mac: text("mac").notNull().unique(),
  guess: text("guess"),
  osGuess: text("os_guess"),
  connection: text("connection"),
  firstSeen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
});

export const enrollmentTokens = pgTable("enrollment_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  usedByMac: text("used_by_mac"),
});

export type TrackedAsset = typeof trackedAssets.$inferSelect;
export type ManualAsset = typeof manualAssets.$inferSelect;
export type FetchingAsset = typeof fetchingAssets.$inferSelect;
export type EnrollmentToken = typeof enrollmentTokens.$inferSelect;
