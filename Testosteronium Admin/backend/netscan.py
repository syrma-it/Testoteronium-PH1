"""
netscan.py — cross-platform LAN discovery for the "Fetching Assets" card.

Strategy (no extra system tools required beyond what ships with the OS):
  1. Ping-sweep the subnet concurrently to populate the OS's own ARP cache.
  2. Read that ARP cache (`arp -a` on Windows/macOS, `ip neigh` on Linux) to
     get IP <-> MAC pairs — this is the same technique tools like Fing and
     Advanced IP Scanner use, and it works for any device that responds to
     ARP, regardless of whether it's Windows, Linux, macOS, or Android.
  3. Guess the vendor from the MAC's OUI (first 3 bytes) — narrows Android
     vs Apple vs a known PC vendor.
  4. Guess the OS family from ping TTL:
       Windows  -> TTL ~128
       Linux/Android/macOS/iOS -> TTL ~64 (default TTLs get decremented by
       hops, so we round up to the nearest common default)
     Combined with the vendor guess this distinguishes "Apple product"
     (macOS/iOS) from "Linux/Android" even though both default to TTL 64.

This only touches the local network the backend machine is on — same scope
as any legitimate network inventory tool (nmap -sn, Fing, Advanced IP
Scanner) used on a company's own network.
"""

import platform
import re
import socket
import subprocess
import concurrent.futures

# A short table of common OUI prefixes -> vendor. Extend as needed; a full
# IEEE OUI CSV (https://standards-oui.ieee.org/oui/oui.csv) can be loaded
# into a dict the same shape if you want exhaustive coverage.
OUI_VENDORS = {
    "3c:22:fb": "Apple", "a4:83:e7": "Apple", "f0:18:98": "Apple",
    "dc:a6:32": "Raspberry Pi Foundation", "b8:27:eb": "Raspberry Pi Foundation",
    "00:1a:11": "Google", "f4:f5:d8": "Google",
    "e8:50:8b": "Samsung", "5c:0a:5b": "Samsung", "8c:79:f5": "Samsung",
    "3c:5a:b4": "Xiaomi", "64:cc:2e": "Xiaomi",
    "00:1e:c2": "Apple", "d0:37:45": "TP-Link",
    "00:15:5d": "Microsoft (Hyper-V)", "00:0c:29": "VMware",
    "b0:83:fe": "Dell", "d4:be:d9": "Dell", "f8:bc:12": "Dell",
    "00:21:cc": "HP", "3c:d9:2b": "HP",
    "54:e1:ad": "Lenovo", "00:23:8b": "Lenovo",
}


def guess_vendor(mac: str) -> str:
    prefix = mac.lower()[0:8]
    return OUI_VENDORS.get(prefix, "Unknown vendor")


def guess_os_from_ttl(ttl: int, vendor: str) -> str:
    if ttl is None:
        return "Unknown"
    if ttl >= 100:
        return "Windows"
    # TTL ~64 covers Linux, Android, macOS, iOS — disambiguate with vendor.
    if "Apple" in vendor:
        return "macOS / iOS"
    if vendor in ("Samsung", "Xiaomi", "Google"):
        return "Android (likely)"
    return "Linux / Android (likely)"


def _ping(ip: str, timeout_ms: int = 500):
    """Ping once, return TTL if the host replied, else None. Cross-platform
    flag differences handled here."""
    is_windows = platform.system().lower() == "windows"
    if is_windows:
        cmd = ["ping", "-n", "1", "-w", str(timeout_ms), ip]
    else:
        cmd = ["ping", "-c", "1", "-W", str(max(1, timeout_ms // 1000)), ip]

    try:
        out = subprocess.run(
            cmd, capture_output=True, text=True, timeout=2
        ).stdout
    except Exception:
        return None

    m = re.search(r"ttl[=\s](\d+)", out, re.IGNORECASE)
    return int(m.group(1)) if m else None


def _local_subnet_prefix() -> str:
    """Best-effort guess of the local /24, e.g. '192.168.1'."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = "127.0.0.1"
    finally:
        s.close()
    return ".".join(local_ip.split(".")[:3])


def _read_arp_table():
    """Returns {ip: mac} from the OS's ARP/neighbor cache."""
    system = platform.system().lower()
    result = {}
    try:
        if system == "linux":
            out = subprocess.run(
                ["ip", "neigh"], capture_output=True, text=True, timeout=3
            ).stdout
            for line in out.splitlines():
                m = re.match(
                    r"(\d+\.\d+\.\d+\.\d+).*lladdr\s+([0-9a-fA-F:]{17})", line
                )
                if m:
                    result[m.group(1)] = m.group(2).lower()
        else:  # Windows and macOS both support `arp -a`
            out = subprocess.run(
                ["arp", "-a"], capture_output=True, text=True, timeout=3
            ).stdout
            for line in out.splitlines():
                m = re.search(
                    r"(\d+\.\d+\.\d+\.\d+)\)?\s+.*?"
                    r"([0-9a-fA-F]{1,2}[:-][0-9a-fA-F]{1,2}(?:[:-][0-9a-fA-F]{1,2}){4})",
                    line,
                )
                if m:
                    mac = m.group(2).replace("-", ":").lower()
                    result[m.group(1)] = mac
    except Exception:
        pass
    return result


def scan_network(subnet_prefix: str = None, max_workers: int = 40):
    """Full sweep: ping every host in the /24 to populate ARP cache, then
    read the cache and fingerprint each device. Returns a list of dicts:
    {ip, mac, vendor_guess, os_guess}."""
    prefix = subnet_prefix or _local_subnet_prefix()
    hosts = [f"{prefix}.{i}" for i in range(1, 255)]

    ttls = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {ex.submit(_ping, ip): ip for ip in hosts}
        for fut in concurrent.futures.as_completed(futures):
            ip = futures[fut]
            ttl = fut.result()
            if ttl is not None:
                ttls[ip] = ttl

    arp_table = _read_arp_table()

    devices = []
    for ip, mac in arp_table.items():
        if not ip.startswith(prefix):
            continue
        vendor = guess_vendor(mac)
        os_guess = guess_os_from_ttl(ttls.get(ip), vendor)
        devices.append(
            {"ip": ip, "mac": mac, "vendor_guess": vendor, "os_guess": os_guess}
        )
    return devices