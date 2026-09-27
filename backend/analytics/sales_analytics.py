from datetime import datetime, timedelta
from typing import Dict, Any, List
import pandas as pd
from database import db_session
from models import Order, Product

class SalesAnalytics:
    """
    Sales Analytics Engine:
    Calculates Revenue, Order volume, Average Order Value (AOV),
    growth rate, product sales, and business funnel.
    """
    @classmethod
    def get_summary(cls, business_id: int, days: int = 30) -> Dict[str, Any]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        orders = db_session.query(Order).filter(
            Order.business_id == business_id,
            Order.order_date >= cutoff
        ).all()

        if not orders:
            return {
                "total_revenue": 0.0,
                "order_count": 0,
                "aov": 0.0,
                "growth_pct": 0.0,
                "currency": "USD"
            }

        df = pd.DataFrame([{
            "id": o.id,
            "order_date": o.order_date,
            "total_amount": o.total_amount,
            "status": o.status
        } for o in orders])

        completed_df = df[df["status"] != "cancelled"]
        total_revenue = float(completed_df["total_amount"].sum())
        order_count = int(len(completed_df))
        aov = round(total_revenue / order_count, 2) if order_count > 0 else 0.0

        # Prior period comparison for growth rate
        prior_cutoff = cutoff - timedelta(days=days)
        prior_orders = db_session.query(Order).filter(
            Order.business_id == business_id,
            Order.order_date >= prior_cutoff,
            Order.order_date < cutoff,
            Order.status != "cancelled"
        ).all()
        prior_rev = sum(o.total_amount for o in prior_orders)
        if prior_rev > 0:
            growth_pct = round(((total_revenue - prior_rev) / prior_rev) * 100.0, 1)
        else:
            growth_pct = 100.0 if total_revenue > 0 else 0.0

        return {
            "total_revenue": round(total_revenue, 2),
            "order_count": order_count,
            "aov": aov,
            "growth_pct": growth_pct,
            "currency": "USD"
        }

    @classmethod
    def get_sales_trend(cls, business_id: int, days: int = 30) -> List[Dict[str, Any]]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        orders = db_session.query(Order).filter(
            Order.business_id == business_id,
            Order.order_date >= cutoff,
            Order.status != "cancelled"
        ).order_by(Order.order_date.asc()).all()

        if not orders:
            return []

        df = pd.DataFrame([{
            "date": o.order_date.strftime("%Y-%m-%d"),
            "amount": o.total_amount
        } for o in orders])

        grouped = df.groupby("date").agg(
            revenue=("amount", "sum"),
            orders=("amount", "count")
        ).reset_index()

        return grouped.to_dict(orient="records")

    @classmethod
    def get_product_performance(cls, business_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        products = db_session.query(Product).filter_by(business_id=business_id)\
            .order_by(Product.total_revenue.desc()).limit(limit).all()

        return [{
            "id": p.id,
            "source_id": p.source_id,
            "title": p.title,
            "price": p.price,
            "category": p.category,
            "inventory_quantity": p.inventory_quantity,
            "total_units_sold": p.total_units_sold,
            "total_revenue": p.total_revenue
        } for p in products]
