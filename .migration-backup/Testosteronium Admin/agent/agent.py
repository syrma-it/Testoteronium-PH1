"""
agent.py — lightweight cross-platform check-in agent.

Run this on any Windows / Linux / macOS machine you want to show up in
Tracked Assets. It collects hostname, IP, MAC, serial number, OS, and
hardware specs, then POSTs to the backend every CHECKIN_INTERVAL seconds.

Setup:
    pip install psutil requests
    python agent.py

To run it silently on startup:
  - Windows: add a shortcut to `pythonw agent.py` in the Startup folder,
    or register it as a scheduled task.
  - Linux: add a systemd user service or a cron @reboot entry.
  - macOS: add a LaunchAgent plist.
"""

import os
import platform
import socket
import subprocess
import time
import uuid

import psutil
import requests

BACKEND_URL = os.getenv("TESTO_BACKEND_URL", "http://localhost:5000")
CHECKIN_INTERVAL = int(os.getenv("TESTO_CHECKIN_SECONDS", 300))


def get_mac_address() -> str:
    mac = uuid.getnode()
    return ":".join(f"{(mac >> ele) & 0xff:02x}" for ele in range(40, -8, -8))


def get_local_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


def get_serial_number() -> str:
    system = platform.system().lower()
    try:
        if system == "windows":
            out = subprocess.run(
                ["wmic", "bios", "get", "serialnumber"],
                capture_output=True, text=True, timeout=5,
            ).stdout
            lines = [l.strip() for l in out.splitlines() if l.strip()]
            return lines[1] if len(lines) > 1 else "unknown"

        if system == "linux":
            # Needs root for dmidecode; falls back gracefully if not.
            try:
                out = subprocess.run(
                    ["sudo", "-n", "dmidecode", "-s", "system-serial-number"],
                    capture_output=True, text=True, timeout=5,
                ).stdout.strip()
                if out:
                    return out
            except Exception:
                pass
            try:
                with open("/sys/class/dmi/id/product_serial") as fh:
                    return fh.read().strip()
            except Exception:
                return "unknown"

        if system == "darwin":
            out = subprocess.run(
                ["ioreg", "-l"], capture_output=True, text=True, timeout=5
            ).stdout
            for line in out.splitlines():
                if "IOPlatformSerialNumber" in line:
                    return line.split("=")[-1].strip().strip('"')
            return "unknown"
    except Exception:
        pass
    return "unknown"


def collect_snapshot() -> dict:
    vm = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    return {
        "hostname": socket.gethostname(),
        "username": os.getlogin() if hasattr(os, "getlogin") else "unknown",
        "ip_address": get_local_ip(),
        "mac_address": get_mac_address(),
        "serial_number": get_serial_number(),
        "os_name": platform.system(),
        "os_version": platform.release(),
        "cpu": platform.processor() or platform.machine(),
        "ram_gb": round(vm.total / (1024 ** 3), 1),
        "disk_gb": round(disk.total / (1024 ** 3), 1),
    }


def checkin_once():
    payload = collect_snapshot()
    try:
        res = requests.post(f"{BACKEND_URL}/api/agent/checkin", json=payload, timeout=10)
        print(f"[{time.strftime('%H:%M:%S')}] check-in -> {res.status_code}")
    except requests.RequestException as e:
        print(f"[{time.strftime('%H:%M:%S')}] check-in failed: {e}")


if __name__ == "__main__":
    while True:
        checkin_once()
        time.sleep(CHECKIN_INTERVAL)