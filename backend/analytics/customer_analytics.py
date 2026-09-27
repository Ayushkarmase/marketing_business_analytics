from typing import Dict, Any, List
import pandas as pd
from database import db_session
from models import Customer, Order

class CustomerAnalytics:
    """
    Customer Analytics Engine:
    Analyzes customer volume, new vs returning ratio, purchase frequency,
    recency distribution, and average customer value.
    """
    @classmethod
    def get_overview(cls, business_id: int) -> Dict[str, Any]:
        customers = db_session.query(Customer).filter_by(business_id=business_id).all()
        if not customers:
            return {
                "total_customers": 0,
                "new_customers": 0,
                "returning_customers": 0,
                "repeat_purchase_rate": 0.0,
                "avg_customer_spend": 0.0
            }

        df = pd.DataFrame([{
            "id": c.id,
            "type": c.customer_type,
            "spend": c.total_spend,
            "orders": c.order_count,
            "recency": c.recency_days
        } for c in customers])

        total = len(df)
        returning = len(df[df["orders"] > 1])
        new_custs = total - returning
        repeat_rate = round((returning / total) * 100.0, 1) if total > 0 else 0.0
        avg_spend = round(float(df["spend"].mean()), 2) if total > 0 else 0.0

        return {
            "total_customers": total,
            "new_customers": new_custs,
            "returning_customers": returning,
            "repeat_purchase_rate": repeat_rate,
            "avg_customer_spend": avg_spend
        }

    @classmethod
    def get_rfm_summary(cls, business_id: int) -> Dict[str, Any]:
        customers = db_session.query(Customer).filter_by(business_id=business_id).all()
        if not customers:
            return {"distribution": []}

        df = pd.DataFrame([{
            "recency": c.recency_days,
            "frequency": c.order_count,
            "monetary": c.total_spend,
            "segment": c.segment_label or "Unsegmented"
        } for c in customers])

        seg_counts = df["segment"].value_counts().to_dict()
        return {
            "segments_breakdown": [{"segment": k, "count": int(v)} for k, v in seg_counts.items()]
        }
