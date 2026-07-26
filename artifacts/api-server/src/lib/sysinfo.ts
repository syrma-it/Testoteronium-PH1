import os from "os";
import { execSync } from "child_process";
import fs from "node:fs";

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
    case "win32": return "Windows";
    case "darwin": return "Darwin";
    default: return "Linux";
  }
}

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
  } catch { /* ignore */ }
  return result;
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
  if (!val || /to be filled/i.test(val) || /^0+$/.test(val) || /^default/i.test(val)) return null;
  return val;
}

function serialNumber(): string | null {
  const p = os.platform();
  if (p === "win32") {
    const wmic = run("wmic bios get SerialNumber /value");
    const fromWmic = parseColonValue(wmic);
    if (fromWmic) return fromWmic;
    return parseColonValue(run('powershell -NoProfile -Command "(Get-CimInstance Win32_BIOS).SerialNumber"'));
  }
  if (p === "darwin") {
    const out = run("ioreg -d2 -c IOPlatformExpertDevice");
    const match = out?.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/);
    if (match) return match[1];
    return null;
  }
  return (
    readFileSafe("/sys/class/dmi/id/product_serial") ||
    readFileSafe("/sys/class/dmi/id/board_serial") ||
    run("dmidecode -s system-serial-number 2>/dev/null") ||
    null
  );
}

function totalDiskGb(): number | null {
  const p = os.platform();
  try {
    if (p === "win32") {
      const out = run("wmic diskdrive get Size");
      const nums = (out ?? "")
        .split(/\s+/)
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0);
      return nums.length > 0 ? round1(Math.max(...nums) / 1024 ** 3) : null;
    }
    if (p === "darwin") {
      const out = run("df -k /");
      const lines = (out ?? "").trim().split("\n");
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        const kb = Number(parts[1]);
        if (Number.isFinite(kb) && kb > 0) return round1(kb / (1024 ** 2));
      }
      return null;
    }
    const out = run("df -k /");
    const lines = (out ?? "").trim().split("\n");
    if (lines.length >= 2) {
      const parts = lines[1].split(/\s+/);
      const kb = Number(parts[1]);
      if (Number.isFinite(kb) && kb > 0) return round1(kb / (1024 ** 2));
    }
    return null;
  } catch {
    return null;
  }
}

let cache: SystemInfo | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 30_000;

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

export function getSystemSummary() {
  return {
    device_id: "",
    hostname: os.hostname(),
    username: os.userInfo().username,
    os_name: platformName(),
    os_version: os.release(),
  };
}
