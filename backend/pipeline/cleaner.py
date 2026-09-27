from typing import Dict, Any, List
from datetime import datetime
from pipeline.validator import DataValidator

class DataCleaner:
    """
    Data Cleaning & Deduplication Layer (Pipeline Step 4):
    Handles missing values, deduplicates against existing records,
    and normalizes inconsistent types.
    """
    @staticmethod
    def clean_order_record(row: Dict[str, Any]) -> Dict[str, Any]:
        dt = DataValidator.parse_date(row.get("order_date")) or datetime.utcnow()
        try:
            total = float(row.get("total_amount", 0.0))
        except (ValueError, TypeError):
            total = 0.0

        return {
            "source_id": str(row.get("source_id", "")).strip(),
            "order_number": str(row.get("order_number", "")).strip(),
            "order_date": dt,
            "total_amount": max(0.0, total),
            "tax_amount": float(row.get("tax_amount", 0.0) or 0.0),
            "discount_amount": float(row.get("discount_amount", 0.0) or 0.0),
            "status": str(row.get("status", "completed")).lower().strip(),
            "currency": str(row.get("currency", "USD")).upper().strip(),
            "attribution_source": str(row.get("attribution_source", "direct")).strip()
        }

    @staticmethod
    def clean_campaign_record(row: Dict[str, Any]) -> Dict[str, Any]:
        dt = DataValidator.parse_date(row.get("date")) or datetime.utcnow()
        impressions = max(0, int(row.get("impressions", 0) or 0))
        clicks = max(0, int(row.get("clicks", 0) or 0))
        cost = max(0.0, float(row.get("cost", 0.0) or 0.0))
        conversions = max(0, int(row.get("conversions", 0) or 0))
        conv_val = max(0.0, float(row.get("conversion_value", 0.0) or 0.0))

        ctr = (clicks / impressions) if impressions > 0 else 0.0
        cpc = (cost / clicks) if clicks > 0 else 0.0
        cpa = (cost / conversions) if conversions > 0 else 0.0
        roas = (conv_val / cost) if cost > 0 else 0.0

        return {
            "source_id": str(row.get("source_id", "")).strip(),
            "name": str(row.get("name", "Unnamed Campaign")).strip(),
            "channel": str(row.get("channel", "google_ads")).strip(),
            "status": str(row.get("status", "ACTIVE")).upper().strip(),
            "impressions": impressions,
            "clicks": clicks,
            "cost": round(cost, 2),
            "conversions": conversions,
            "conversion_value": round(conv_val, 2),
            "ctr": round(ctr, 4),
            "cpc": round(cpc, 2),
            "cpa": round(cpa, 2),
            "roas": round(roas, 2),
            "date": dt.date()
        }

    @staticmethod
    def clean_web_metric_record(row: Dict[str, Any]) -> Dict[str, Any]:
        dt = DataValidator.parse_date(row.get("date")) or datetime.utcnow()
        return {
            "date": dt.date(),
            "sessions": max(0, int(row.get("sessions", 0) or 0)),
            "active_users": max(0, int(row.get("active_users", 0) or 0)),
            "new_users": max(0, int(row.get("new_users", 0) or 0)),
            "pageviews": max(0, int(row.get("pageviews", 0) or 0)),
            "bounce_rate": min(1.0, max(0.0, float(row.get("bounce_rate", 0.0) or 0.0))),
            "avg_session_duration_sec": max(0.0, float(row.get("avg_session_duration_sec", 0.0) or 0.0)),
            "traffic_source": str(row.get("traffic_source") or row.get("source_medium") or "Organic Search").strip(),
            "is_realtime": bool(row.get("is_realtime", False))
        }
