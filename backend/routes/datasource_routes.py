import os
from flask import Blueprint, request, jsonify
from datetime import datetime
from database import db_session
from models import DataSource, SyncLog, Business
from pipeline.sync_service import SyncService
from connectors import get_connector

datasource_bp = Blueprint("datasources", __name__)

@datasource_bp.route("", methods=["GET"])
def get_datasources():
    biz = db_session.query(Business).first()
    if not biz:
        return jsonify({"data_sources": []}), 200

    sources = db_session.query(DataSource).filter_by(business_id=biz.id).all()
    if not sources:
        # Pre-register default sources if not present
        default_sources = [
            ("shopify", "Shopify Store", "scheduled"),
            ("google_analytics", "Google Analytics 4 (GA4)", "realtime"),
            ("google_ads", "Google Ads API", "scheduled"),
            ("csv", "Fallback CSV Import", "historical")
        ]
        for provider, display_name, data_type in default_sources:
            ds = DataSource(
                business_id=biz.id,
                provider=provider,
                display_name=display_name,
                status="disconnected",
                data_type=data_type,
                is_sample_data=False
            )
            db_session.add(ds)
        db_session.commit()
        sources = db_session.query(DataSource).filter_by(business_id=biz.id).all()

    return jsonify({
        "data_sources": [s.to_dict() for s in sources],
        "business_name": biz.name
    }), 200

@datasource_bp.route("/<int:source_id>/connect", methods=["POST"])
def connect_datasource(source_id):
    source = db_session.query(DataSource).filter_by(id=source_id).first()
    if not source:
        return jsonify({"error": "Data source not found"}), 404

    data = request.get_json() or {}
    # Rule 28: Credentials remain exclusively on the backend
    # Test connector authorization
    connector = get_connector(source.provider, data)
    test_res = connector.test_connection()

    if test_res.get("success"):
        source.status = "connected"
        source.is_sample_data = False
        source.last_error_message = None
        db_session.commit()
        return jsonify({
            "success": True,
            "message": f"Successfully connected to {source.display_name}",
            "data_source": source.to_dict()
        }), 200
    else:
        # Clear explanation of missing credentials / access requirements (Rule 26)
        return jsonify({
            "success": False,
            "error": test_res.get("message", "Authorization failed"),
            "missing_credentials": test_res.get("missing_credentials", []),
            "data_source": source.to_dict()
        }), 400

@datasource_bp.route("/<int:source_id>/disconnect", methods=["POST"])
def disconnect_datasource(source_id):
    source = db_session.query(DataSource).filter_by(id=source_id).first()
    if not source:
        return jsonify({"error": "Data source not found"}), 404

    source.status = "disconnected"
    db_session.commit()
    return jsonify({
        "success": True,
        "message": f"Disconnected {source.display_name}",
        "data_source": source.to_dict()
    }), 200

@datasource_bp.route("/<int:source_id>/sync", methods=["POST"])
def sync_now(source_id):
    """
    Mandatory Sync Now Workflow (Section 19).
    Executes incremental fetch, validates, cleans, transforms, stores,
    refreshes ML, updates Last Data Sync timestamp, and preserves previous valid data on failure.
    """
    result = SyncService.execute_sync(source_id, sync_type="manual_sync_now")
    status_code = 200 if result.get("success") else 400
    return jsonify(result), status_code

@datasource_bp.route("/sync-logs", methods=["GET"])
def get_sync_logs():
    biz = db_session.query(Business).first()
    if not biz:
        return jsonify({"sync_logs": []}), 200

    logs = db_session.query(SyncLog).filter_by(business_id=biz.id)\
        .order_by(SyncLog.started_at.desc()).limit(20).all()
    return jsonify({"sync_logs": [l.to_dict() for l in logs]}), 200

@datasource_bp.route("/upload-csv", methods=["POST"])
def upload_csv():
    """
    CSV Import Fallback endpoint.
    STRICT SPECIFICATION RULE: CSV import is permitted ONLY as a fallback.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    category = request.form.get("category", "orders")

    upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    file.save(file_path)

    # Find or create CSV data source
    biz = db_session.query(Business).first()
    ds = db_session.query(DataSource).filter_by(business_id=biz.id, provider="csv").first()
    if not ds:
        ds = DataSource(
            business_id=biz.id,
            provider="csv",
            display_name="Fallback CSV Import",
            status="connected",
            data_type="historical"
        )
        db_session.add(ds)
        db_session.commit()

    from connectors.csv_fallback import CSVFallbackConnector
    connector = CSVFallbackConnector({"file_path": file_path, "data_category": category})
    raw_data = connector.fetch_data()

    # Process into DB
    from pipeline.transformer import DataTransformer
    from models import Order, Campaign, WebMetric
    
    count = 0
    if category == "orders":
        orders = DataTransformer.transform_orders(raw_data.get("rows", []), biz.id)
        for o in orders:
            db_session.add(Order(business_id=biz.id, **o))
            count += 1
    elif category == "campaigns":
        campaigns = DataTransformer.transform_campaigns(raw_data.get("rows", []), biz.id)
        for c in campaigns:
            db_session.add(Campaign(business_id=biz.id, **c))
            count += 1
    elif category == "web_metrics":
        metrics = DataTransformer.transform_web_metrics(raw_data.get("rows", []), biz.id)
        for m in metrics:
            db_session.add(WebMetric(business_id=biz.id, **m))
            count += 1

    ds.last_sync_at = datetime.utcnow()
    ds.last_sync_status = "SUCCESS"
    db_session.commit()

    return jsonify({
        "success": True,
        "message": f"CSV Fallback successfully imported {count} {category} records.",
        "records_imported": count
    }), 200
