from typing import Dict, Any, List
import pandas as pd
from database import db_session
from models import Campaign

class CampaignAnalytics:
    """
    Marketing Campaign Analytics Engine:
    Calculates Impressions, Clicks, Spend, Conversions, Conversion Value,
    CTR, CPC, CPA, ROAS, and campaign performance comparisons.
    """
    @classmethod
    def get_summary(cls, business_id: int) -> Dict[str, Any]:
        campaigns = db_session.query(Campaign).filter_by(business_id=business_id).all()
        if not campaigns:
            return {
                "impressions": 0,
                "clicks": 0,
                "cost": 0.0,
                "conversions": 0,
                "conversion_value": 0.0,
                "ctr": 0.0,
                "cpc": 0.0,
                "cpa": 0.0,
                "roas": 0.0
            }

        df = pd.DataFrame([{
            "impressions": c.impressions,
            "clicks": c.clicks,
            "cost": c.cost,
            "conversions": c.conversions,
            "conversion_value": c.conversion_value
        } for c in campaigns])

        tot_impr = int(df["impressions"].sum())
        tot_clicks = int(df["clicks"].sum())
        tot_cost = float(df["cost"].sum())
        tot_conv = int(df["conversions"].sum())
        tot_val = float(df["conversion_value"].sum())

        ctr = round((tot_clicks / tot_impr) * 100.0, 2) if tot_impr > 0 else 0.0
        cpc = round(tot_cost / tot_clicks, 2) if tot_clicks > 0 else 0.0
        cpa = round(tot_cost / tot_conv, 2) if tot_conv > 0 else 0.0
        roas = round(tot_val / tot_cost, 2) if tot_cost > 0 else 0.0

        return {
            "impressions": tot_impr,
            "clicks": tot_clicks,
            "cost": round(tot_cost, 2),
            "conversions": tot_conv,
            "conversion_value": round(tot_val, 2),
            "ctr": ctr,
            "cpc": cpc,
            "cpa": cpa,
            "roas": roas
        }

    @classmethod
    def get_campaign_comparison(cls, business_id: int) -> List[Dict[str, Any]]:
        campaigns = db_session.query(Campaign).filter_by(business_id=business_id).all()
        if not campaigns:
            return []

        df = pd.DataFrame([{
            "id": c.id,
            "name": c.name,
            "status": c.status,
            "channel": c.channel,
            "impressions": c.impressions,
            "clicks": c.clicks,
            "cost": c.cost,
            "conversions": c.conversions,
            "conversion_value": c.conversion_value,
            "date": c.date.strftime("%Y-%m-%d") if c.date else None
        } for c in campaigns])

        # Group by campaign name
        grouped = df.groupby(["name", "channel", "status"]).agg({
            "impressions": "sum",
            "clicks": "sum",
            "cost": "sum",
            "conversions": "sum",
            "conversion_value": "sum"
        }).reset_index()

        results = []
        for _, row in grouped.iterrows():
            impr = int(row["impressions"])
            clicks = int(row["clicks"])
            cost = float(row["cost"])
            conv = int(row["conversions"])
            val = float(row["conversion_value"])

            ctr = round((clicks / impr) * 100.0, 2) if impr > 0 else 0.0
            cpc = round(cost / clicks, 2) if clicks > 0 else 0.0
            cpa = round(cost / conv, 2) if conv > 0 else 0.0
            roas = round(val / cost, 2) if cost > 0 else 0.0

            results.append({
                "name": row["name"],
                "channel": row["channel"],
                "status": row["status"],
                "impressions": impr,
                "clicks": clicks,
                "cost": round(cost, 2),
                "conversions": conv,
                "conversion_value": round(val, 2),
                "ctr": ctr,
                "cpc": cpc,
                "cpa": cpa,
                "roas": roas
            })

        return sorted(results, key=lambda x: x["roas"], reverse=True)
