import csv
from typing import Dict, Any, List
from datetime import datetime
from connectors.base import BaseConnector

class CSVFallbackConnector(BaseConnector):
    """
    CSV Import Fallback Connector.
    STRICT SPECIFICATION RULE: CSV import is strictly a fallback for sources where
    an official API connection is unavailable or cannot be authorized.
    """
    def __init__(self, config: Dict[str, Any]):
        super().__init__("csv_fallback", config)
        self.file_path = config.get("file_path", "")
        self.data_category = config.get("data_category", "orders")  # orders, campaigns, web_metrics

    def validate_credentials(self) -> List[str]:
        if not self.file_path:
            return ["file_path (Uploaded CSV File Path)"]
        return []

    def test_connection(self) -> Dict[str, Any]:
        if not self.file_path:
            return {"success": False, "provider": self.provider_name, "message": "No CSV file selected."}
        try:
            with open(self.file_path, mode="r", encoding="utf-8") as f:
                reader = csv.reader(f)
                header = next(reader, None)
                if not header:
                    return {"success": False, "provider": self.provider_name, "message": "CSV file is empty."}
                return {
                    "success": True,
                    "provider": self.provider_name,
                    "message": f"CSV Fallback parsed header with {len(header)} columns.",
                    "columns": header
                }
        except Exception as e:
            return {"success": False, "provider": self.provider_name, "message": f"Error reading CSV: {str(e)}"}

    def fetch_data(self, start_date=None, end_date=None, **kwargs) -> Dict[str, Any]:
        with open(self.file_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        normalized_rows = []
        for i, r in enumerate(rows):
            if self.data_category == "orders":
                normalized_rows.append({
                    "source_id": r.get("order_id") or r.get("id") or f"csv-order-{i}",
                    "order_number": r.get("order_number") or f"ORD-{i}",
                    "order_date": r.get("date") or r.get("order_date") or datetime.utcnow().strftime("%Y-%m-%d"),
                    "total_amount": float(r.get("total_amount") or r.get("total") or 0.0),
                    "status": r.get("status", "completed"),
                    "currency": r.get("currency", "USD"),
                    "attribution_source": r.get("source", "csv_import")
                })
            elif self.data_category == "campaigns":
                impr = int(r.get("impressions", 0))
                clicks = int(r.get("clicks", 0))
                cost = float(r.get("cost", 0.0))
                conv = int(r.get("conversions", 0))
                conv_val = float(r.get("conversion_value", 0.0))
                normalized_rows.append({
                    "source_id": r.get("campaign_id") or f"csv-camp-{i}",
                    "name": r.get("campaign_name") or r.get("name", f"CSV Campaign {i}"),
                    "status": r.get("status", "ACTIVE"),
                    "channel": "csv_import",
                    "impressions": impr,
                    "clicks": clicks,
                    "cost": cost,
                    "conversions": conv,
                    "conversion_value": conv_val,
                    "ctr": (clicks / impr) if impr > 0 else 0.0,
                    "cpc": (cost / clicks) if clicks > 0 else 0.0,
                    "cpa": (cost / conv) if conv > 0 else 0.0,
                    "roas": (conv_val / cost) if cost > 0 else 0.0,
                    "date": r.get("date", datetime.utcnow().strftime("%Y-%m-%d"))
                })
            elif self.data_category == "web_metrics":
                normalized_rows.append({
                    "date": r.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
                    "sessions": int(r.get("sessions", 0)),
                    "active_users": int(r.get("users") or r.get("active_users") or 0),
                    "new_users": int(r.get("new_users", 0)),
                    "pageviews": int(r.get("pageviews", 0)),
                    "bounce_rate": float(r.get("bounce_rate", 0.0)),
                    "avg_session_duration_sec": float(r.get("avg_session_duration", 0.0)),
                    "traffic_source": r.get("traffic_source", "CSV Import"),
                    "is_realtime": False
                })

        return {
            "provider": self.provider_name,
            "data_category": self.data_category,
            "rows": normalized_rows
        }
