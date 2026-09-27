from datetime import datetime
from typing import Dict, Any, Optional
import logging
from database import db_session
from models import DataSource, SyncLog, Order, Campaign, WebMetric, Customer, Product
from connectors import get_connector, MissingCredentialsError
from pipeline.transformer import DataTransformer

logger = logging.getLogger(__name__)

class SyncService:
    """
    Controlled Synchronization Engine implementing the mandatory Sync Now workflow:
    1. Verifies connection
    2. Incremental fetch
    3. Validate, Clean, Transform
    4. Upsert with stable source identifiers
    5. Preserves previous data upon failure
    6. Logs audit trail
    """

    @classmethod
    def execute_sync(cls, data_source_id: int, sync_type: str = "manual_sync_now") -> Dict[str, Any]:
        source = db_session.query(DataSource).filter_by(id=data_source_id).first()
        if not source:
            return {"success": False, "message": "Data source not found."}

        business_id = source.business_id
        started_at = datetime.utcnow()
        source.status = "syncing"
        db_session.commit()

        # Audit log entry
        log_entry = SyncLog(
            business_id=business_id,
            data_source_id=source.id,
            provider=source.provider,
            sync_type=sync_type,
            status="IN_PROGRESS",
            started_at=started_at
        )
        db_session.add(log_entry)
        db_session.commit()

        try:
            # 1. Instantiate connector
            connector = get_connector(source.provider, {})
            
            # Incremental sync range
            start_date = source.last_sync_at.strftime("%Y-%m-%d") if source.last_sync_at else None
            
            # 2. Fetch raw data from authorized API
            raw_payload = connector.fetch_data(start_date=start_date)
            records_count = 0

            # 3. Transform & Upsert per provider type
            if source.provider == "shopify":
                # Upsert Customers
                for c_data in raw_payload.get("customers", []):
                    cust = db_session.query(Customer).filter_by(
                        business_id=business_id, source_id=c_data["source_id"]
                    ).first()
                    if not cust:
                        cust = Customer(business_id=business_id, source_id=c_data["source_id"])
                        db_session.add(cust)
                    cust.email = c_data.get("email")
                    cust.first_name = c_data.get("first_name")
                    cust.last_name = c_data.get("last_name")
                    cust.total_spend = c_data.get("total_spend", 0.0)
                    cust.order_count = c_data.get("order_count", 0)
                    cust.customer_type = c_data.get("customer_type", "new")
                    records_count += 1

                # Upsert Products
                for p_data in raw_payload.get("products", []):
                    prod = db_session.query(Product).filter_by(
                        business_id=business_id, source_id=p_data["source_id"]
                    ).first()
                    if not prod:
                        prod = Product(business_id=business_id, source_id=p_data["source_id"])
                        db_session.add(prod)
                    prod.title = p_data.get("title", "")
                    prod.sku = p_data.get("sku")
                    prod.price = p_data.get("price", 0.0)
                    prod.category = p_data.get("category", "General")
                    prod.inventory_quantity = p_data.get("inventory_quantity", 0)
                    records_count += 1

                # Upsert Orders
                orders = DataTransformer.transform_orders(raw_payload.get("orders", []), business_id)
                for o_data in orders:
                    ord_obj = db_session.query(Order).filter_by(
                        business_id=business_id, source_id=o_data["source_id"]
                    ).first()
                    if not ord_obj:
                        ord_obj = Order(business_id=business_id, source_id=o_data["source_id"])
                        db_session.add(ord_obj)
                    ord_obj.order_number = o_data["order_number"]
                    ord_obj.order_date = o_data["order_date"]
                    ord_obj.total_amount = o_data["total_amount"]
                    ord_obj.tax_amount = o_data["tax_amount"]
                    ord_obj.discount_amount = o_data["discount_amount"]
                    ord_obj.status = o_data["status"]
                    ord_obj.currency = o_data["currency"]
                    ord_obj.attribution_source = o_data["attribution_source"]
                    records_count += 1

            elif source.provider == "google_ads":
                campaigns = DataTransformer.transform_campaigns(raw_payload.get("rows", []), business_id)
                for c_data in campaigns:
                    camp_obj = db_session.query(Campaign).filter_by(
                        business_id=business_id, source_id=c_data["source_id"], date=c_data["date"]
                    ).first()
                    if not camp_obj:
                        camp_obj = Campaign(business_id=business_id, source_id=c_data["source_id"], date=c_data["date"])
                        db_session.add(camp_obj)
                    camp_obj.name = c_data["name"]
                    camp_obj.channel = c_data["channel"]
                    camp_obj.status = c_data["status"]
                    camp_obj.impressions = c_data["impressions"]
                    camp_obj.clicks = c_data["clicks"]
                    camp_obj.cost = c_data["cost"]
                    camp_obj.conversions = c_data["conversions"]
                    camp_obj.conversion_value = c_data["conversion_value"]
                    camp_obj.ctr = c_data["ctr"]
                    camp_obj.cpc = c_data["cpc"]
                    camp_obj.cpa = c_data["cpa"]
                    camp_obj.roas = c_data["roas"]
                    records_count += 1

            elif source.provider == "google_analytics":
                metrics = DataTransformer.transform_web_metrics(raw_payload.get("rows", []), business_id)
                for m_data in metrics:
                    met_obj = db_session.query(WebMetric).filter_by(
                        business_id=business_id, date=m_data["date"], traffic_source=m_data["traffic_source"]
                    ).first()
                    if not met_obj:
                        met_obj = WebMetric(business_id=business_id, date=m_data["date"], traffic_source=m_data["traffic_source"])
                        db_session.add(met_obj)
                    met_obj.sessions = m_data["sessions"]
                    met_obj.active_users = m_data["active_users"]
                    met_obj.new_users = m_data["new_users"]
                    met_obj.pageviews = m_data["pageviews"]
                    met_obj.bounce_rate = m_data["bounce_rate"]
                    met_obj.avg_session_duration_sec = m_data["avg_session_duration_sec"]
                    met_obj.is_realtime = m_data["is_realtime"]
                    records_count += 1

            elif source.provider == "csv":
                cat = raw_payload.get("data_category")
                if cat == "orders":
                    orders = DataTransformer.transform_orders(raw_payload.get("rows", []), business_id)
                    for o in orders:
                        db_session.add(Order(business_id=business_id, **o))
                        records_count += 1
                elif cat == "campaigns":
                    campaigns = DataTransformer.transform_campaigns(raw_payload.get("rows", []), business_id)
                    for c in campaigns:
                        db_session.add(Campaign(business_id=business_id, **c))
                        records_count += 1
                elif cat == "web_metrics":
                    metrics = DataTransformer.transform_web_metrics(raw_payload.get("rows", []), business_id)
                    for m in metrics:
                        db_session.add(WebMetric(business_id=business_id, **m))
                        records_count += 1

            # Success updates
            completed_at = datetime.utcnow()
            source.status = "connected"
            source.last_sync_at = completed_at
            source.last_sync_status = "SUCCESS"
            source.last_error_message = None

            log_entry.status = "SUCCESS"
            log_entry.records_processed = records_count
            log_entry.completed_at = completed_at

            db_session.commit()

            # Refresh ML models & analytics
            try:
                from ml.segmentation import CustomerSegmentationModel
                from ml.forecasting import SalesForecastingModel
                CustomerSegmentationModel.train_and_assign(business_id)
                SalesForecastingModel.train_and_forecast(business_id)
            except Exception as ml_err:
                logger.warning(f"ML refresh warning during sync: {ml_err}")

            return {
                "success": True,
                "message": f"Successfully synchronized {records_count} records from {source.display_name}.",
                "last_sync_at": completed_at.isoformat(),
                "records_processed": records_count
            }

        except MissingCredentialsError as mce:
            # RULE 15 & 16: PRESERVE PREVIOUS VALID DATA
            db_session.rollback()
            completed_at = datetime.utcnow()
            source = db_session.query(DataSource).filter_by(id=data_source_id).first()
            if source:
                source.status = "disconnected"
                source.last_sync_status = "FAILED"
                source.last_error_message = str(mce)
                db_session.commit()

            log = db_session.query(SyncLog).filter_by(id=log_entry.id).first()
            if log:
                log.status = "FAILED"
                log.error_details = str(mce)
                log.completed_at = completed_at
                db_session.commit()

            return {
                "success": False,
                "missing_credentials": mce.missing_keys,
                "message": str(mce),
                "preserved_data": True
            }

        except Exception as e:
            # RULE 15 & 16: PRESERVE PREVIOUS VALID DATA IF SYNCHRONIZATION FAILS
            db_session.rollback()
            completed_at = datetime.utcnow()
            source = db_session.query(DataSource).filter_by(id=data_source_id).first()
            if source:
                source.status = "error"
                source.last_sync_status = "FAILED"
                source.last_error_message = str(e)
                db_session.commit()

            log = db_session.query(SyncLog).filter_by(id=log_entry.id).first()
            if log:
                log.status = "FAILED"
                log.error_details = str(e)
                log.completed_at = completed_at
                db_session.commit()

            logger.error(f"Sync failed for source {data_source_id}: {e}", exc_info=True)
            return {
                "success": False,
                "message": f"Synchronization failed: {str(e)}. Previous data preserved.",
                "preserved_data": True
            }
