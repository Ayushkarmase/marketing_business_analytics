from flask import Blueprint, request, jsonify
from database import db_session
from models import Business, DataSource, User

business_bp = Blueprint("business", __name__)

@business_bp.route("/current", methods=["GET"])
def get_current_business():
    biz = db_session.query(Business).first()
    if not biz:
        return jsonify({"business": None}), 200
    return jsonify({"business": biz.to_dict()}), 200

@business_bp.route("/setup", methods=["POST"])
def setup_business():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    industry = data.get("industry", "e-commerce").strip()
    currency = data.get("currency", "USD").strip()

    if not name:
        return jsonify({"error": "Business name is required."}), 400

    biz = Business(
        name=name,
        industry=industry,
        currency=currency,
        timezone="UTC"
    )
    db_session.add(biz)
    db_session.commit()

    # Pre-register available data sources for this business
    sources = [
        ("google_analytics", "Google Analytics 4 (GA4)", "realtime"),
        ("google_ads", "Google Ads API", "scheduled"),
        ("shopify", "Shopify E-Commerce API", "scheduled"),
        ("csv", "Fallback CSV Import", "historical")
    ]
    for provider, display_name, data_type in sources:
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

    return jsonify({"message": "Business initialized successfully", "business": biz.to_dict()}), 201
