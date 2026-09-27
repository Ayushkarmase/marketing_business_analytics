from flask import Blueprint, jsonify
from database import db_session
from models import Business, Order, Campaign, Customer, Product, WebMetric, DataSource
from analytics import SalesAnalytics, CustomerAnalytics, CampaignAnalytics
from ml.forecasting import SalesForecastingModel
from ml.segmentation import CustomerSegmentationModel

report_bp = Blueprint("reports", __name__)

def _get_biz():
    return db_session.query(Business).first()

@report_bp.route("/summary", methods=["GET"])
def executive_summary_report():
    biz = _get_biz()
    if not biz:
        return jsonify({"error": "No business configured"}), 404

    sales_summary = SalesAnalytics.get_summary(biz.id, days=30)
    customer_summary = CustomerAnalytics.get_overview(biz.id)
    campaign_summary = CampaignAnalytics.get_summary(biz.id)
    top_products = SalesAnalytics.get_product_performance(biz.id, limit=5)
    
    # Check data source freshness & demo status
    sources = db_session.query(DataSource).filter_by(business_id=biz.id).all()
    any_sample = any(s.is_sample_data for s in sources)
    latest_sync = max([s.last_sync_at for s in sources if s.last_sync_at] or [None])

    return jsonify({
        "business_name": biz.name,
        "industry": biz.industry,
        "currency": biz.currency,
        "reporting_period": "Last 30 Days",
        "data_freshness": {
            "has_sample_data": any_sample,
            "last_sync_at": latest_sync.isoformat() if latest_sync else None
        },
        "sales": sales_summary,
        "customers": customer_summary,
        "marketing": campaign_summary,
        "top_products": top_products
    }), 200

@report_bp.route("/actionable-insights", methods=["GET"])
def actionable_insights():
    biz = _get_biz()
    if not biz:
        return jsonify({"insights": []}), 200

    insights = []
    
    # 1. Campaign ROAS Optimization Insight
    campaigns = CampaignAnalytics.get_campaign_comparison(biz.id)
    high_roas = [c for c in campaigns if c["roas"] >= 3.0]
    low_roas = [c for c in campaigns if c["roas"] < 1.5 and c["cost"] > 100]

    if high_roas:
        top_camp = high_roas[0]
        insights.append({
            "category": "Marketing Spend Allocation",
            "type": "opportunity",
            "title": f"Scale High-Performing Campaign '{top_camp['name']}'",
            "description": f"Campaign is achieving a strong ROAS of {top_camp['roas']}x with {top_camp['conversions']} conversions. Consider increasing budget allocation by 15-20% to capture additional demand.",
            "impact": "High Revenue Potential"
        })

    if low_roas:
        underperforming = low_roas[0]
        insights.append({
            "category": "Cost Efficiency",
            "type": "warning",
            "title": f"Review Ad Creative on '{underperforming['name']}'",
            "description": f"Current ROAS is {underperforming['roas']}x with ${underperforming['cost']} spent. Pause or refine targeting and search terms to minimize ad fatigue and wasted ad spend.",
            "impact": "Cost Reduction"
        })

    # 2. Customer Retention & RFM Insight
    cust_data = CustomerAnalytics.get_overview(biz.id)
    if cust_data.get("repeat_purchase_rate", 0) < 30.0:
        insights.append({
            "category": "Customer Retention",
            "type": "actionable",
            "title": "Activate Re-engagement Campaign for One-Time Buyers",
            "description": f"Repeat purchase rate stands at {cust_data.get('repeat_purchase_rate')}%. Implementing an automated 14-day post-purchase nurture flow could improve returning customer share.",
            "impact": "LTV Expansion"
        })

    # 3. Product Inventory Velocity Insight
    products = SalesAnalytics.get_product_performance(biz.id, limit=5)
    for p in products:
        if p["inventory_quantity"] < 50 and p["total_units_sold"] > 10:
            insights.append({
                "category": "Inventory Management",
                "type": "warning",
                "title": f"Restock Alert: '{p['title']}'",
                "description": f"Fast-moving product has generated ${p['total_revenue']} with only {p['inventory_quantity']} units remaining in stock. Reorder promptly to prevent stockouts.",
                "impact": "Prevent Lost Sales"
            })
            break

    # 4. Predictive Sales Trajectory Insight
    pred_res = SalesForecastingModel.train_and_forecast(biz.id, model_type="RandomForest", forecast_horizon_days=7)
    if pred_res.get("success"):
        avg_forecast = sum(p["predicted_value"] for p in pred_res["predictions"]) / len(pred_res["predictions"])
        insights.append({
            "category": "Predictive Forecast",
            "type": "forecast",
            "title": "7-Day Sales Trajectory Model Estimate",
            "description": f"Machine learning model projects an estimated average daily revenue of ${round(avg_forecast, 2)} over the upcoming week (Validation R²: {pred_res['evaluation_metrics']['r2']}). Note: Model estimate based on historical trends.",
            "impact": "Strategic Planning"
        })

    return jsonify({"insights": insights}), 200
