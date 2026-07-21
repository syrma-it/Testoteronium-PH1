import pandas as pd
from flask import Blueprint, jsonify, request
from db import query

manual_bp = Blueprint("manual", __name__)


@manual_bp.route("/api/assets/manual", methods=["GET"])
def list_manual():
    rows = query(
        """
        SELECT id, name, asset_type AS type, owner, location,
               serial_number AS serial, notes, source,
               created_at AS addedOn
        FROM manual_assets
        WHERE is_deleted = 0
        ORDER BY created_at DESC
        """
    )
    return jsonify(rows)


@manual_bp.route("/api/assets/manual", methods=["POST"])
def create_manual():
    data = request.get_json(force=True, silent=True) or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    new_id = query(
        """
        INSERT INTO manual_assets
          (name, asset_type, owner, location, serial_number, notes, source)
        VALUES (%(name)s, %(asset_type)s, %(owner)s, %(location)s,
                %(serial_number)s, %(notes)s, 'manual')
        """,
        {
            "name": data.get("name"),
            "asset_type": data.get("type"),
            "owner": data.get("owner"),
            "location": data.get("location"),
            "serial_number": data.get("serial"),
            "notes": data.get("notes"),
        },
        fetch=False,
    )
    return jsonify({"status": "created", "id": new_id}), 201


@manual_bp.route("/api/assets/manual/<int:asset_id>", methods=["PUT"])
def update_manual(asset_id):
    data = request.get_json(force=True, silent=True) or {}
    query(
        """
        UPDATE manual_assets
        SET name = %(name)s, asset_type = %(asset_type)s, owner = %(owner)s,
            location = %(location)s, serial_number = %(serial_number)s,
            notes = %(notes)s
        WHERE id = %(id)s
        """,
        {
            "id": asset_id,
            "name": data.get("name"),
            "asset_type": data.get("type"),
            "owner": data.get("owner"),
            "location": data.get("location"),
            "serial_number": data.get("serial"),
            "notes": data.get("notes"),
        },
        fetch=False,
    )
    return jsonify({"status": "updated"})


@manual_bp.route("/api/assets/manual/<int:asset_id>", methods=["DELETE"])
def delete_manual(asset_id):
    # Soft delete — keeps history instead of losing the record outright.
    query(
        "UPDATE manual_assets SET is_deleted = 1 WHERE id = %s",
        (asset_id,),
        fetch=False,
    )
    return jsonify({"status": "deleted"})


@manual_bp.route("/api/assets/manual/import", methods=["POST"])
def import_manual_excel():
    """Bulk import from an uploaded .xlsx/.csv. Expected columns (case-
    insensitive, extra columns are ignored): name, type, owner, location,
    serial, notes."""
    if "file" not in request.files:
        return jsonify({"error": "no file uploaded (field name 'file')"}), 400

    f = request.files["file"]
    try:
        if f.filename.lower().endswith(".csv"):
            df = pd.read_csv(f)
        else:
            df = pd.read_excel(f)
    except Exception as e:
        return jsonify({"error": f"could not read file: {e}"}), 400

    df.columns = [c.strip().lower() for c in df.columns]
    if "name" not in df.columns:
        return jsonify({"error": "file must have a 'name' column"}), 400

    inserted = 0
    for _, row in df.iterrows():
        name = str(row.get("name", "")).strip()
        if not name or name.lower() == "nan":
            continue
        query(
            """
            INSERT INTO manual_assets
              (name, asset_type, owner, location, serial_number, notes, source)
            VALUES (%s, %s, %s, %s, %s, %s, 'excel_import')
            """,
            (
                name,
                str(row.get("type", "")) or None,
                str(row.get("owner", "")) or None,
                str(row.get("location", "")) or None,
                str(row.get("serial", "")) or None,
                str(row.get("notes", "")) or None,
            ),
            fetch=False,
        )
        inserted += 1

    return jsonify({"status": "imported", "rows_inserted": inserted}), 201