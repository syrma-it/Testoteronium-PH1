import { getSystemInfo } from "./sysinfo.js";
import { getDeviceId } from "./device.js";

const ADMIN_BACKEND_URL =
  (process.env["ADMIN_BACKEND_URL"] ?? "").replace(/\/+$/, "") || "http://localhost:5000";
const CHECKIN_ENDPOINT = `${ADMIN_BACKEND_URL}/api/agent/checkin`;
const ENROLL_TOKEN = process.env["ENROLL_TOKEN"] ?? process.env["ENROLLMENT_TOKEN"] ?? "";
const CHECKIN_INTERVAL_MS = 5000;
const REQUEST_TIMEOUT_MS = 4500;

let started = false;
let lastStatus: { at: number; ok: boolean; code?: number; error?: string } | null = null;

export interface CheckinPayload {
  device_id: string;
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
  enroll_token?: string;
}

export function buildCheckinPayload(): CheckinPayload {
  const info = getSystemInfo();
  const payload: CheckinPayload = {
    device_id: getDeviceId(),
    hostname: info.hostname,
    username: info.username,
    ip_address: info.ip_address,
    mac_address: info.mac_address,
    serial_number: info.serial_number,
    os_name: info.os_name,
    os_version: info.os_version,
    cpu: info.cpu,
    ram_gb: info.ram_gb,
    disk_gb: info.disk_gb,
  };
  if (ENROLL_TOKEN) payload.enroll_token = ENROLL_TOKEN;
  return payload;
}

export function getLastCheckin() {
  return lastStatus;
}

export async function performCheckin(): Promise<void> {
  try {
    const payload = buildCheckinPayload();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(CHECKIN_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": "testosteronium-agent/1.0" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      lastStatus = { at: Date.now(), ok: res.ok, code: res.status };
      console.log(`[checkin] ${res.ok ? "ok" : "http-" + res.status} -> ${CHECKIN_ENDPOINT}`);
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    lastStatus = { at: Date.now(), ok: false, error: msg };
    console.log(`[checkin] unreachable (silent, retrying): ${msg}`);
  }
}

export function startBackgroundCheckin(): void {
  if (started) return;
  started = true;
  void performCheckin();
  setInterval(() => void performCheckin(), CHECKIN_INTERVAL_MS);
  console.log(`[checkin] started (every ${CHECKIN_INTERVAL_MS / 1000}s -> ${CHECKIN_ENDPOINT})`);
}
