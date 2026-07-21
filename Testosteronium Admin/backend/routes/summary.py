from flask import Blueprint, jsonify
from db import query

summary_bp = Blueprint("summary", __name__)


@summary_bp.route("/api/assets/summary", methods=["GET"])
def summary():
    tracked = query("SELECT COUNT(*) AS c FROM tracked_assets")[0]["c"]
    manual = query(
        "SELECT COUNT(*) AS c FROM manual_assets WHERE is_deleted = 0"
    )[0]["c"]
    fetching = query("SELECT COUNT(*) AS c FROM fetching_assets")[0]["c"]
    return jsonify({"tracked": tracked, "manual": manual, "fetching": fetching})