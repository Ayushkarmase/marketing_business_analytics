import os
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from connectors.base import BaseConnector, MissingCredentialsError

class GoogleAnalyticsConnector(BaseConnector):
    """
    Official Google Analytics 4 (GA4) Data API Connector.
    Supports realtime metrics and historical reporting metrics.
    """
    def __init__(self, config: Dict[str, Any]):
        super().__init__("google_analytics", config)
        self.property_id = config.get("property_id") or os.getenv("GA_PROPERTY_ID", "")
        self.credentials_path = config.get("credentials_path") or os.getenv("GA_CREDENTIALS_PATH", "")
        self.access_token = config.get("access_token") or os.getenv("GA_ACCESS_TOKEN", "")

    def validate_credentials(self) -> List[str]:
        missing = []
        if not self.property_id:
            missing.append("property_id (GA4 Property ID)")
        if not self.credentials_path and not self.access_token:
            missing.append("access_token or credentials_path (OAuth / Service Account JSON)")
        return missing

    def test_connection(self) -> Dict[str, Any]:
        missing = self.validate_credentials()
        if missing:
            return {
                "success": False,
                "provider": self.provider_name,
                "message": f"Google Analytics requires: {', '.join(missing)}",
                "missing_credentials": missing
            }
        
        # Test request against GA4 RunReport
        url = f"https://analyticsdata.googleapis.com/v1beta/properties/{self.property_id}:runReport"
        headers = {"Authorization": f"Bearer {self.access_token}", "Content-Type": "application/json"}
        payload = {
            "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
            "metrics": [{"name": "activeUsers"}]
        }
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=10)
            if res.status_code == 200:
                return {"success": True, "provider": self.provider_name, "message": "GA4 API Connected Successfully"}
            return {"success": False, "provider": self.provider_name, "message": f"GA4 API Error: {res.text}", "status_code": res.status_code}
        except Exception as e:
            return {"success": False, "provider": self.provider_name, "message": str(e)}

    def fetch_data(self, start_date: Optional[str] = None, end_date: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        missing = self.validate_credentials()
        if missing:
            raise MissingCredentialsError(self.provider_name, missing)

        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.utcnow().strftime("%Y-%m-%d")

        is_realtime = kwargs.get("realtime", False)
        if is_realtime:
            url = f"https://analyticsdata.googleapis.com/v1beta/properties/{self.property_id}:runRealtimeReport"
            payload = {
                "dimensions": [{"name": "unifiedScreenClass"}],
                "metrics": [{"name": "activeUsers"}]
            }
        else:
            url = f"https://analyticsdata.googleapis.com/v1beta/properties/{self.property_id}:runReport"
            payload = {
                "dateRanges": [{"startDate": start_date, "endDate": end_date}],
                "dimensions": [{"name": "date"}, {"name": "sessionSourceMedium"}],
                "metrics": [
                    {"name": "activeUsers"},
                    {"name": "newUsers"},
                    {"name": "sessions"},
                    {"name": "screenPageViews"},
                    {"name": "bounceRate"},
                    {"name": "averageSessionDuration"}
                ]
            }

        headers = {"Authorization": f"Bearer {self.access_token}", "Content-Type": "application/json"}
        res = requests.post(url, headers=headers, json=payload, timeout=15)
        
        if res.status_code != 200:
            raise Exception(f"Google Analytics Data API request failed: {res.text}")

        data = res.json()
        rows = []
        for r in data.get("rows", []):
            dims = [d.get("value") for d in r.get("dimensionValues", [])]
            mets = [m.get("value") for m in r.get("metricValues", [])]
            rows.append({
                "date": dims[0] if len(dims) > 0 else datetime.utcnow().strftime("%Y-%m-%d"),
                "source_medium": dims[1] if len(dims) > 1 else "Unknown",
                "active_users": int(mets[0]) if len(mets) > 0 else 0,
                "new_users": int(mets[1]) if len(mets) > 1 else 0,
                "sessions": int(mets[2]) if len(mets) > 2 else 0,
                "pageviews": int(mets[3]) if len(mets) > 3 else 0,
                "bounce_rate": float(mets[4]) if len(mets) > 4 else 0.0,
                "avg_session_duration_sec": float(mets[5]) if len(mets) > 5 else 0.0,
                "is_realtime": is_realtime
            })

        return {
            "provider": self.provider_name,
            "data_type": "realtime" if is_realtime else "historical",
            "count": len(rows),
            "rows": rows
        }
