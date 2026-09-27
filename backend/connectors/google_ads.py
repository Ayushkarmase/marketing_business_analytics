import os
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from connectors.base import BaseConnector, MissingCredentialsError

class GoogleAdsConnector(BaseConnector):
    """
    Official Google Ads API Connector.
    Retrieves campaign performance, impressions, clicks, cost, conversions, and conversion value.
    """
    def __init__(self, config: Dict[str, Any]):
        super().__init__("google_ads", config)
        self.customer_id = (config.get("customer_id") or os.getenv("GOOGLE_ADS_CUSTOMER_ID", "")).replace("-", "")
        self.developer_token = config.get("developer_token") or os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN", "")
        self.access_token = config.get("access_token") or os.getenv("GOOGLE_ADS_ACCESS_TOKEN", "")

    def validate_credentials(self) -> List[str]:
        missing = []
        if not self.customer_id:
            missing.append("customer_id (Google Ads Customer ID)")
        if not self.developer_token:
            missing.append("developer_token (Google Ads Developer Token)")
        if not self.access_token:
            missing.append("access_token (Google Ads OAuth Access Token)")
        return missing

    def test_connection(self) -> Dict[str, Any]:
        missing = self.validate_credentials()
        if missing:
            return {
                "success": False,
                "provider": self.provider_name,
                "message": f"Google Ads requires: {', '.join(missing)}",
                "missing_credentials": missing
            }
        
        url = f"https://googleads.googleapis.com/v16/customers/{self.customer_id}/googleAds:searchStream"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "developer-token": self.developer_token,
            "Content-Type": "application/json"
        }
        query = "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1"
        try:
            res = requests.post(url, headers=headers, json={"query": query}, timeout=10)
            if res.status_code == 200:
                return {"success": True, "provider": self.provider_name, "message": "Google Ads API Connected Successfully"}
            return {"success": False, "provider": self.provider_name, "message": f"Google Ads API Error: {res.text}", "status_code": res.status_code}
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

        url = f"https://googleads.googleapis.com/v16/customers/{self.customer_id}/googleAds:searchStream"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "developer-token": self.developer_token,
            "Content-Type": "application/json"
        }
        query = f"""
            SELECT
                campaign.id,
                campaign.name,
                campaign.status,
                segments.date,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions,
                metrics.conversions_value
            FROM campaign
            WHERE segments.date BETWEEN '{start_date}' AND '{end_date}'
        """
        
        res = requests.post(url, headers=headers, json={"query": query}, timeout=15)
        if res.status_code != 200:
            raise Exception(f"Google Ads API request failed: {res.text}")

        data = res.json()
        campaigns = []
        for batch in data:
            for row in batch.get("results", []):
                camp = row.get("campaign", {})
                mets = row.get("metrics", {})
                cost = float(mets.get("costMicros", 0)) / 1_000_000.0
                clicks = int(mets.get("clicks", 0))
                impressions = int(mets.get("impressions", 0))
                conversions = int(float(mets.get("conversions", 0)))
                conv_value = float(mets.get("conversionsValue", 0.0))
                
                ctr = (clicks / impressions) if impressions > 0 else 0.0
                cpc = (cost / clicks) if clicks > 0 else 0.0
                cpa = (cost / conversions) if conversions > 0 else 0.0
                roas = (conv_value / cost) if cost > 0 else 0.0

                campaigns.append({
                    "source_id": str(camp.get("id")),
                    "name": camp.get("name", "Unnamed Campaign"),
                    "status": camp.get("status", "ACTIVE"),
                    "channel": "google_ads",
                    "impressions": impressions,
                    "clicks": clicks,
                    "cost": cost,
                    "conversions": conversions,
                    "conversion_value": conv_value,
                    "ctr": ctr,
                    "cpc": cpc,
                    "cpa": cpa,
                    "roas": roas,
                    "date": row.get("segments", {}).get("date", datetime.utcnow().strftime("%Y-%m-%d"))
                })

        return {
            "provider": self.provider_name,
            "count": len(campaigns),
            "rows": campaigns
        }
