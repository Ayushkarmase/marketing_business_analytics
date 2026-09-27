from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from database import db_session
from models import Customer

class CustomerSegmentationModel:
    """
    K-Means Customer Segmentation Engine (Section 15, Rules 20 & 21):
    1. Extracts behavioral RFM features (Recency, Frequency, Monetary).
    2. Scales features using StandardScaler.
    3. Runs K-Means clustering.
    4. Dynamically examines cluster characteristics before assigning business interpretations.
    5. Saves cluster assignments and returns detailed cluster profiles.
    """
    @classmethod
    def train_and_assign(cls, business_id: int, n_clusters: Optional[int] = None) -> Dict[str, Any]:
        customers = db_session.query(Customer).filter_by(business_id=business_id).all()
        
        # Rule: Only run segmentation when sufficient customer data exists
        if len(customers) < 6:
            return {
                "success": False,
                "message": f"Insufficient customer data ({len(customers)} records). At least 6 customer records required for K-Means.",
                "clusters": []
            }

        df = pd.DataFrame([{
            "id": c.id,
            "recency": float(c.recency_days or 0),
            "frequency": float(c.order_count or 1),
            "monetary": float(c.total_spend or 0.0)
        } for c in customers])

        features = ["recency", "frequency", "monetary"]
        X = df[features].values

        # Feature normalization
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Determine k dynamically if not supplied (between 3 and 5 based on data size)
        if not n_clusters:
            if len(customers) >= 20:
                k = 4
            else:
                k = 3
        else:
            k = min(n_clusters, len(customers) - 1)

        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        df["cluster"] = kmeans.fit_predict(X_scaled)

        # CRITICAL RULE 21: Examine actual cluster characteristics before assigning labels
        cluster_summary = df.groupby("cluster")[features].mean()
        
        # Rank clusters by monetary spend and frequency to assign dynamic business labels
        cluster_labels = {}
        for c_id, row in cluster_summary.iterrows():
            m_val = row["monetary"]
            f_val = row["frequency"]
            r_val = row["recency"]

            # Centroid-based dynamic business interpretation
            if m_val >= cluster_summary["monetary"].quantile(0.66) and r_val <= cluster_summary["recency"].median():
                cluster_labels[c_id] = "High-Value Champions"
            elif f_val >= cluster_summary["frequency"].median() and r_val <= cluster_summary["recency"].quantile(0.66):
                cluster_labels[c_id] = "Loyal & Regular Customers"
            elif r_val > cluster_summary["recency"].median() and m_val <= cluster_summary["monetary"].median():
                cluster_labels[c_id] = "At-Risk / Dormant Customers"
            else:
                cluster_labels[c_id] = "Occasional / Emerging Customers"

        # Ensure unique labels if duplicates exist by appending cluster ID
        used_labels = set()
        for c_id in sorted(cluster_labels.keys()):
            lbl = cluster_labels[c_id]
            if lbl in used_labels:
                cluster_labels[c_id] = f"{lbl} (Group {c_id + 1})"
            used_labels.add(cluster_labels[c_id])

        df["segment_label"] = df["cluster"].map(cluster_labels)

        # Update customer records in database
        for _, row in df.iterrows():
            cust = db_session.query(Customer).filter_by(id=int(row["id"])).first()
            if cust:
                cust.cluster_id = int(row["cluster"])
                cust.segment_label = str(row["segment_label"])
        db_session.commit()

        # Build cluster profile response
        clusters_info = []
        for c_id in sorted(cluster_summary.index):
            c_df = df[df["cluster"] == c_id]
            clusters_info.append({
                "cluster_id": int(c_id),
                "label": cluster_labels[c_id],
                "customer_count": int(len(c_df)),
                "pct_of_total": round((len(c_df) / len(df)) * 100.0, 1),
                "avg_recency_days": round(float(c_df["recency"].mean()), 1),
                "avg_order_frequency": round(float(c_df["frequency"].mean()), 1),
                "avg_monetary_spend": round(float(c_df["monetary"].mean()), 2),
                "total_cluster_revenue": round(float(c_df["monetary"].sum()), 2)
            })

        return {
            "success": True,
            "k_clusters": k,
            "total_customers_analyzed": len(df),
            "clusters": clusters_info,
            "scatter_points": [{
                "id": int(r["id"]),
                "recency": round(float(r["recency"]), 1),
                "frequency": round(float(r["frequency"]), 1),
                "monetary": round(float(r["monetary"]), 2),
                "cluster": int(r["cluster"]),
                "label": str(r["segment_label"])
            } for _, r in df.iterrows()]
        }
