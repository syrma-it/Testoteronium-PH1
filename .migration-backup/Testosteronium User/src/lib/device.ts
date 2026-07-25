import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import os from "node:os";
import { getSystemInfo } from "./sysinfo";

/**
 * Stable per-installation device identity.
 *
 * A real enrollment agent writes a token once at install time and reuses it.
 * We mirror that: a UUID is generated on first run and persisted to a small
 * `.device-id` file. If the filesystem is read-only we fall back to a
 * deterministic hash of stable host fields so the identity is at least
 * consistent for that process lifetime.
 */

let cached: string | null = null;

function fallbackIdentity(): string {
  const info = getSystemInfo();
  const seed = [info.hostname, info.username, info.mac_address, info.os_name, info.cpu].join("|");
  let h1 = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h1 ^= seed.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  const hex = (h1 >>> 0).toString(16).padStart(8, "0");
  // Pad into a UUID-shaped string so downstream consumers see a consistent shape.
  return `00000000-0000-0000-0000-${hex}00000`;
}

function identityFilePath(): string {
  // Prefer a writable data dir next to the app; fall back to os tmpdir.
  const cwdDir = path.join(process.cwd(), ".data");
  try {
    fs.mkdirSync(cwdDir, { recursive: true });
    return path.join(cwdDir, "device-id");
  } catch {
    return path.join(os.tmpdir(), "testosteronium-device-id");
  }
}

export function getDeviceId(): string {
  if (cached) return cached;

  const file = identityFilePath();
  try {
    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, "utf8").trim();
      if (existing) {
        cached = existing;
        return cached;
      }
    }
    const id = randomUUID();
    fs.writeFileSync(file, id, { encoding: "utf8" });
    cached = id;
    return cached;
  } catch {
    cached = fallbackIdentity();
    return cached;
  }
}
