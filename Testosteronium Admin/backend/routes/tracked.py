from flask import Blueprint, jsonify, request
from db import query

tracked_bp = Blueprint("tracked", __name__)


@tracked_bp.route("/api/assets/tracked", methods=["GET"])
def list_tracked():
    rows = query(
        """
        SELECT id, hostname, username, ip_address AS ip,
               mac_address, serial_number AS serial,
               CONCAT(os_name, ' ', os_version) AS os,
               CONCAT(cpu, ' \u00b7 ', ram_gb, 'GB') AS specs,
               status, first_seen, last_seen, enrolled_via_token
        FROM tracked_assets
        ORDER BY last_seen DESC
        """
    )
    return jsonify(rows)


@tracked_bp.route("/api/agent/checkin", methods=["POST"])
def agent_checkin():
    """The agent (see agent/agent.py, or a generated enrollment script from
    the Generate Patch flow) POSTs here on every check-in. Upserts on
    mac_address so re-running doesn't create duplicate rows. If an
    enroll_token is included, it's validated and marked used."""
    data = request.get_json(force=True, silent=True) or {}

    required = ["hostname", "ip_address", "mac_address"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"missing fields: {', '.join(missing)}"}), 400

    token = data.get("enroll_token")
    if token:
        token_rows = query(
            "SELECT * FROM enrollment_tokens WHERE token = %s", (token,)
        )
        if not token_rows:
            return jsonify({"error": "invalid enrollment token"}), 400
        row = token_rows[0]
        if row["used_at"]:
            return jsonify({"error": "enrollment token already used"}), 410
        from datetime import datetime
        if row["expires_at"] < datetime.utcnow():
            return jsonify({"error": "enrollment token expired"}), 410

    query(
        """
        INSERT INTO tracked_assets
          (hostname, username, ip_address, mac_address, serial_number,
           os_name, os_version, cpu, ram_gb, disk_gb, status, enrolled_via_token)
        VALUES (%(hostname)s, %(username)s, %(ip_address)s, %(mac_address)s,
                %(serial_number)s, %(os_name)s, %(os_version)s, %(cpu)s,
                %(ram_gb)s, %(disk_gb)s, 'online', %(enroll_token)s)
        ON DUPLICATE KEY UPDATE
          hostname = VALUES(hostname),
          username = VALUES(username),
          ip_address = VALUES(ip_address),
          serial_number = VALUES(serial_number),
          os_name = VALUES(os_name),
          os_version = VALUES(os_version),
          cpu = VALUES(cpu),
          ram_gb = VALUES(ram_gb),
          disk_gb = VALUES(disk_gb),
          status = 'online',
          last_seen = CURRENT_TIMESTAMP
        """,
        {
            "hostname": data.get("hostname"),
            "username": data.get("username"),
            "ip_address": data.get("ip_address"),
            "mac_address": data.get("mac_address"),
            "serial_number": data.get("serial_number"),
            "os_name": data.get("os_name"),
            "os_version": data.get("os_version"),
            "cpu": data.get("cpu"),
            "ram_gb": data.get("ram_gb"),
            "disk_gb": data.get("disk_gb"),
            "enroll_token": token,
        },
        fetch=False,
    )

    if token:
        query(
            """
            UPDATE enrollment_tokens
            SET used_at = CURRENT_TIMESTAMP, used_by_mac = %s
            WHERE token = %s AND used_at IS NULL
            """,
            (data.get("mac_address"), token),
            fetch=False,
        )

    return jsonify({"status": "recorded"}), 201


@tracked_bp.route("/api/assets/tracked/mark-offline", methods=["POST"])
def mark_stale_offline():
    minutes = request.args.get("minutes", default=10, type=int)
    query(
        """
        UPDATE tracked_assets
        SET status = 'offline'
        WHERE status = 'online'
          AND last_seen < (NOW() - INTERVAL %s MINUTE)
        """,
        (minutes,),
        fetch=False,
    )
    return jsonify({"status": "ok", "threshold_minutes": minutes})