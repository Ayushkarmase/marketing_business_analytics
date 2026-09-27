from typing import Dict, Any, List
from database import db_session
from models import Campaign, WebMetric, Order

class FunnelAnalytics:
    """
    Conceptual Marketing Business Funnel Engine (Section 21):
    Campaign Impressions -> Clicks -> Website Visits -> Product Views -> Orders -> Revenue
    """
    @classmethod
    def get_funnel_metrics(cls, business_id: int) -> Dict[str, Any]:
        campaigns = db_session.query(Campaign).filter_by(business_id=business_id).all()
        web_metrics = db_session.query(WebMetric).filter_by(business_id=business_id).all()
        orders = db_session.query(Order).filter(Order.business_id == business_id, Order.status != "cancelled").all()

        impressions = sum(c.impressions for c in campaigns)
        clicks = sum(c.clicks for c in campaigns)
        sessions = sum(w.sessions for w in web_metrics)
        pageviews = sum(w.pageviews for w in web_metrics)
        order_count = len(orders)
        revenue = sum(o.total_amount for o in orders)

        # Stage drop-off calculations
        stages = [
            {"stage": "1. Impressions", "count": impressions, "unit": "views"},
            {"stage": "2. Clicks", "count": clicks, "unit": "clicks"},
            {"stage": "3. Website Sessions", "count": sessions, "unit": "sessions"},
            {"stage": "4. Page Views", "count": pageviews, "unit": "views"},
            {"stage": "5. Orders Placed", "count": order_count, "unit": "orders"},
            {"stage": "6. Revenue Generated", "count": round(revenue, 2), "unit": "$"}
        ]

        ctr = round((clicks / impressions * 100.0), 2) if impressions > 0 else 0.0
        conversion_rate = round((order_count / sessions * 100.0), 2) if sessions > 0 else 0.0

        return {
            "stages": stages,
            "ctr": ctr,
            "visit_to_order_rate": conversion_rate,
            "total_revenue": round(revenue, 2)
        }
