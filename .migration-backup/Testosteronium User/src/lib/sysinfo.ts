import os from "os";
import { execSync } from "child_process";

/**
 * Silent system fingerprinting for the Testosteronium agent check-in.
 *
 * Everything here is deliberately defensive: a lookup that fails on a given
 * machine (no dmidecode permissions, missing wmic, restricted ioreg) returns
 * null and the check-in simply omits/blank-sends that field. Nothing here is
 * allowed to throw into the calling request path.
 */

export interface SystemInfo {
  hostname: string;
  username: string;
  ip_address: string;
  mac_address: string;
  serial_number: string;
  os_name: string;
  os_version: string;
  cpu: string;
  ram_gb: number;
  disk_gb: number;
}

function run(cmd: string, timeoutMs = 4000): string | null {
  try {
    const out = execSync(cmd, {
      timeout: timeoutMs,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
      maxBuffer: 1024 * 512,
    });
    return out.trim();
  } catch {
    return null;
  }
}

function readFileSafe(p: string): string | null {
  try {
    // Lazy import to avoid pulling fs into any client bundle accidentally.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs") as typeof import("node:fs");
    return fs.readFileSync(p, "utf8").trim();
  } catch {
    return null;
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function platformName(): string {
  switch (os.platform()) {
    case "win32":
      return "Windows";
    case "darwin":
      return "Darwin";
    default:
      return "Linux";
  }
}

/** First non-internal IPv4 address + the MAC of the interface that owns it. */
function networkIdentity(): { ip: string; mac: string } {
  const result = { ip: "", mac: "" };
  try {
    const ifaces = os.networkInterfaces();
    outer: for (const list of Object.values(ifaces)) {
      if (!list) continue;
      for (const ni of list) {
        if (ni.family === "IPv4" && !ni.internal) {
          result.ip = ni.address;
          result.mac = (ni.mac || "").toLowerCase();
          break outer;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return result;
}

function serialNumber(): string | null {
  const p = os.platform();
  if (p === "win32") {
    // wmic (legacy, matches the admin agent) with a PowerShell fallback.
    const wmic = run(`wmic bios get SerialNumber /value`);
    const fromWmic = parseColonValue(wmic);
    if (fromWmic) return fromWmic;
    const ps = run(
      `powershell -NoProfile -Command "(Get-CimInstance Win32_BIOS).SerialNumber"`,
    );
    return parseColonValue(ps);
  }

  if (p === "darwin") {
    const out = run(`ioreg -d2 -c IOPlatformExpertDevice`);
    const match = out?.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/);
    if (match) return match[1];
    return null;
  }

  // Linux: prefer sysfs (no root needed for board serial), fall back to dmidecode.
  return (
    readFileSafe("/sys/class/dmi/id/product_serial") ||
    readFileSafe("/sys/class/dmi/id/board_serial") ||
    (run(`dmidecode -s system-serial-number 2>/dev/null`) ?? null)
  );
}

function parseColonValue(raw: string | null): string | null {
  if (!raw) return null;
  const line = raw
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !/^serialnumber$/i.test(l));
  if (!line) return null;
  const eq = line.split(/=|:/);
  const val = eq.length > 1 ? eq.slice(1).join("").trim() : line;
  if (!val || /to be filled/i.test(val) || /^0+$/.test(val) || /^default/i.test(val)) {
    return null;
  }
  return val;
}

function totalDiskGb(): number | null {
  const p = os.platform();
  try {
    if (p === "win32") {
      const out = run(`wmic diskdrive get Size`);
      const nums = (out ?? "")
        .split(/\s+/)
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0);
      if (nums.length) return round1(Math.max(...nums) / 1024 ** 3);
      return null;
    }

    if (p === "darwin") {
      // Largest whole-disk size from diskutil.
      const out = run(`diskutil list`);
      const disks = new Set<string>();
      for (const m of (out ?? "").matchAll(/^\/dev\/(disk\d+)/gm)) disks.add(m[1]);
      let best = 0;
      for (const d of disks) {
        const info = run(`diskutil info /dev/${d}`);
        const sizeMatch = info?.match(/Disk Size:\s*([0-9.]+)\s*Bytes/i);
        if (sizeMatch) best = Math.max(best, Number(sizeMatch[1]));
      }
      if (best > 0) return round1(best / 1024 ** 3);
      return null;
    }

    // Linux: largest block device from lsblk, fall back to root filesystem.
    const lsblk = run(`lsblk -bdno SIZE`);
    const nums = (lsblk ?? "")
      .split(/\s+/)
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x) && x > 0);
    if (nums.length) return round1(Math.max(...nums) / 1024 ** 3);

    const df = run(`df -B1 --output=size /`);
    const dfNums = (df ?? "")
      .split("\n")
      .slice(1)
      .map((x) => Number(x.trim()))
      .filter((x) => Number.isFinite(x) && x > 0);
    if (dfNums.length) return round1(dfNums[0] / 1024 ** 3);
    return null;
  } catch {
    return null;
  }
}

let cache: SystemInfo | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 30_000;

/** Full hardware/OS snapshot, cached briefly so the 5s loop doesn't re-shell. */
export function getSystemInfo(): SystemInfo {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache;

  const net = networkIdentity();
  const cpuModel = os.cpus()[0]?.model ?? "Unknown";
  const ram = os.totalmem() / 1024 ** 3;
  const disk = totalDiskGb();

  cache = {
    hostname: os.hostname(),
    username: os.userInfo().username,
    ip_address: net.ip,
    mac_address: net.mac,
    serial_number: serialNumber() ?? "",
    os_name: platformName(),
    os_version: os.release(),
    cpu: cpuModel.trim(),
    ram_gb: round1(ram),
    disk_gb: disk ?? 0,
  };
  cacheAt = now;
  return cache;
}

/** Lightweight, shell-free snapshot used for in-app device context only. */
export function getSystemSummary(): {
  device_id: string;
  hostname: string;
  username: string;
  os_name: string;
  os_version: string;
} {
  return {
    device_id: "",
    hostname: os.hostname(),
    username: os.userInfo().username,
    os_name: platformName(),
    os_version: os.release(),
  };
}
