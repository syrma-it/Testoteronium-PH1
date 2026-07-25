import secrets
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, Response
from db import query
import agent_template

patch_bp = Blueprint("patch", __name__)


@patch_bp.route("/api/patch/generate", methods=["POST"])
def generate_patch():
    """Admin action: create a one-time enrollment link. The end user opens
    this link and self-installs the agent — no admin needs to touch their
    machine."""
    data = request.get_json(force=True, silent=True) or {}
    label = data.get("label", "")
    expires_hours = int(data.get("expires_hours", 72))

    token = secrets.token_urlsafe(24)
    expires_at = datetime.utcnow() + timedelta(hours=expires_hours)

    query(
        """
        INSERT INTO enrollment_tokens (token, label, expires_at)
        VALUES (%s, %s, %s)
        """,
        (token, label, expires_at),
        fetch=False,
    )

    return jsonify({
        "token": token,
        "enroll_url": f"/enroll/{token}",
        "expires_at": expires_at.isoformat(),
    }), 201


@patch_bp.route("/api/patch/list", methods=["GET"])
def list_patches():
    rows = query(
        """
        SELECT token, label, created_at, expires_at, used_at, used_by_mac
        FROM enrollment_tokens
        ORDER BY created_at DESC
        LIMIT 50
        """
    )
    now = datetime.utcnow()
    for r in rows:
        r["status"] = (
            "used" if r["used_at"]
            else "expired" if r["expires_at"] < now
            else "active"
        )
    return jsonify(rows)


@patch_bp.route("/api/patch/<token>/info", methods=["GET"])
def patch_info(token):
    """What the public /enroll/<token> page calls to check the link is
    still valid before showing download instructions."""
    rows = query("SELECT * FROM enrollment_tokens WHERE token = %s", (token,))
    if not rows:
        return jsonify({"valid": False, "reason": "unknown token"}), 404

    row = rows[0]
    if row["used_at"]:
        return jsonify({"valid": False, "reason": "already used"}), 410
    if row["expires_at"] < datetime.utcnow():
        return jsonify({"valid": False, "reason": "expired"}), 410

    return jsonify({"valid": True, "label": row["label"]})


@patch_bp.route("/api/patch/<token>/download", methods=["GET"])
def download_patch(token):
    """Serves a ready-to-run agent script with the backend URL and token
    already baked in, so the end user doesn't configure anything."""
    rows = query("SELECT * FROM enrollment_tokens WHERE token = %s", (token,))
    if not rows:
        return jsonify({"error": "unknown token"}), 404
    row = rows[0]
    if row["used_at"]:
        return jsonify({"error": "link already used"}), 410
    if row["expires_at"] < datetime.utcnow():
        return jsonify({"error": "link expired"}), 410

    backend_url = request.host_url.rstrip("/")
    script = agent_template.render(backend_url=backend_url, token=token)
    return Response(
        script,
        mimetype="text/x-python",
        headers={
            "Content-Disposition": "attachment; filename=enroll_agent.py"
        },
    )


@patch_bp.route("/api/patch/<token>/mark-used", methods=["POST"])
def mark_used(token):
    """Called internally by /api/agent/checkin when a check-in arrives
    carrying an enrollment token, so the link can't be reused."""
    data = request.get_json(force=True, silent=True) or {}
    query(
        """
        UPDATE enrollment_tokens
        SET used_at = CURRENT_TIMESTAMP, used_by_mac = %s
        WHERE token = %s AND used_at IS NULL
        """,
        (data.get("mac_address"), token),
        fetch=False,
    )
    return jsonify({"status": "ok"})