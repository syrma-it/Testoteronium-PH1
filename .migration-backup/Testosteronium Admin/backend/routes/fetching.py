import os
from flask import Blueprint, jsonify, request
from db import query
from netscan import scan_network

fetching_bp = Blueprint("fetching", __name__)


@fetching_bp.route("/api/assets/fetching/scan", methods=["POST"])
def run_scan():
    """Triggers a fresh network sweep and upserts results into
    fetching_assets, skipping any MAC already claimed in tracked or manual.
    This can take a few seconds (pinging up to 254 hosts) — call it from a
    button click or a scheduled job, not on every page load."""
    subnet = request.args.get("subnet") or os.getenv("SCAN_SUBNET") or None
    discovered = scan_network(subnet_prefix=subnet)

    claimed_macs = {
        r["mac_address"].lower()
        for r in query("SELECT mac_address FROM tracked_assets")
        if r["mac_address"]
    }

    new_count = 0
    for d in discovered:
        if d["mac"] in claimed_macs:
            continue
        query(
            """
            INSERT INTO fetching_assets (ip_address, mac_address, vendor_guess, os_guess)
            VALUES (%(ip)s, %(mac)s, %(vendor_guess)s, %(os_guess)s)
            ON DUPLICATE KEY UPDATE
              ip_address = VALUES(ip_address),
              vendor_guess = VALUES(vendor_guess),
              os_guess = VALUES(os_guess),
              last_seen = CURRENT_TIMESTAMP
            """,
            d,
            fetch=False,
        )
        new_count += 1

    return jsonify({"status": "scan complete", "devices_seen": new_count})


@fetching_bp.route("/api/assets/fetching", methods=["GET"])
def list_fetching():
    rows = query(
        """
        SELECT id, ip_address AS ip, mac_address AS mac,
               vendor_guess AS guess, os_guess, connection,
               first_seen, last_seen
        FROM fetching_assets
        ORDER BY last_seen DESC
        """
    )
    return jsonify(rows)


@fetching_bp.route("/api/assets/fetching/<int:asset_id>/claim", methods=["POST"])
def claim_fetching(asset_id):
    """Move a fetching-asset row into manual_assets (e.g. 'yes this is
    Dave's personal laptop, log it') and remove it from the unclaimed list."""
    data = request.get_json(force=True, silent=True) or {}
    rows = query(
        "SELECT * FROM fetching_assets WHERE id = %s", (asset_id,)
    )
    if not rows:
        return jsonify({"error": "not found"}), 404
    row = rows[0]

    query(
        """
        INSERT INTO manual_assets (name, asset_type, owner, location, serial_number, notes, source)
        VALUES (%s, %s, %s, %s, %s, %s, 'manual')
        """,
        (
            data.get("name", f"Device {row['mac_address']}"),
            data.get("type", "Unclassified device"),
            data.get("owner"),
            data.get("location"),
            None,
            f"Claimed from network scan. IP {row['ip_address']}, MAC {row['mac_address']}.",
        ),
        fetch=False,
    )
    query("DELETE FROM fetching_assets WHERE id = %s", (asset_id,), fetch=False)
    return jsonify({"status": "claimed"})