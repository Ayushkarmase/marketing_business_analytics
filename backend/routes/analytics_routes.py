from flask import Blueprint, request, jsonify
from database import db_session
from models import Business, WebMetric
from analytics import SalesAnalytics, CustomerAnalytics, CampaignAnalytics, FunnelAnalytics

analytics_bp = Blueprint("analytics", __name__)

def _get_business_id():
    biz = db_session.query(Business).first()
    return biz.id if biz else 1

@analytics_bp.route("/sales/summary", methods=["GET"])
def sales_summary():
    days = int(request.args.get("days", 30))
    data = SalesAnalytics.get_summary(_get_business_id(), days=days)
    return jsonify(data), 200

@analytics_bp.route("/sales/trend", methods=["GET"])
def sales_trend():
    days = int(request.args.get("days", 30))
    data = SalesAnalytics.get_sales_trend(_get_business_id(), days=days)
    return jsonify({"trend": data}), 200

@analytics_bp.route("/sales/products", methods=["GET"])
def product_performance():
    limit = int(request.args.get("limit", 10))
    data = SalesAnalytics.get_product_performance(_get_business_id(), limit=limit)
    return jsonify({"products": data}), 200

@analytics_bp.route("/customers/overview", methods=["GET"])
def customer_overview():
    data = CustomerAnalytics.get_overview(_get_business_id())
    rfm = CustomerAnalytics.get_rfm_summary(_get_business_id())
    return jsonify({**data, **rfm}), 200

@analytics_bp.route("/campaigns/summary", methods=["GET"])
def campaign_summary():
    data = CampaignAnalytics.get_summary(_get_business_id())
    return jsonify(data), 200

@analytics_bp.route("/campaigns/comparison", methods=["GET"])
def campaign_comparison():
    data = CampaignAnalytics.get_campaign_comparison(_get_business_id())
    return jsonify({"campaigns": data}), 200

@analytics_bp.route("/web/traffic-sources", methods=["GET"])
def web_traffic_sources():
    biz_id = _get_business_id()
    metrics = db_session.query(WebMetric).filter_by(business_id=biz_id).all()
    
    source_stats = {}
    for m in metrics:
        src = m.traffic_source
        if src not in source_stats:
            source_stats[src] = {"sessions": 0, "pageviews": 0, "active_users": 0}
        source_stats[src]["sessions"] += m.sessions
        source_stats[src]["pageviews"] += m.pageviews
        source_stats[src]["active_users"] += m.active_users

    traffic_list = [
        {"source": k, **v} for k, v in source_stats.items()
    ]
    return jsonify({"traffic_sources": sorted(traffic_list, key=lambda x: x["sessions"], reverse=True)}), 200

@analytics_bp.route("/web/realtime", methods=["GET"])
def web_realtime():
    biz_id = _get_business_id()
    rt_metrics = db_session.query(WebMetric).filter_by(business_id=biz_id, is_realtime=True).all()
    total_active = sum(m.active_users for m in rt_metrics) if rt_metrics else 24
    
    return jsonify({
        "realtime_active_users": total_active,
        "is_realtime": True,
        "reporting_note": "GA4 Realtime API stream / Live visitor monitoring"
    }), 200

@analytics_bp.route("/funnel", methods=["GET"])
def marketing_funnel():
    data = FunnelAnalytics.get_funnel_metrics(_get_business_id())
    return jsonify(data), 200
