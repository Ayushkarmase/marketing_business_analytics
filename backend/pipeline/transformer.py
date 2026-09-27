from typing import Dict, Any, List
from pipeline.validator import DataValidator
from pipeline.cleaner import DataCleaner

class DataTransformer:
    """
    Data Transformation Layer (Pipeline Step 4 & 5):
    Normalizes provider-specific payloads into the common internal model.
    """
    @classmethod
    def transform_orders(cls, raw_orders: List[Dict[str, Any]], business_id: int) -> List[Dict[str, Any]]:
        transformed = []
        for raw in raw_orders:
            valid, msg = DataValidator.validate_order(raw, business_id)
            if not valid:
                continue
            cleaned = DataCleaner.clean_order_record(raw)
            cleaned["business_id"] = business_id
            transformed.append(cleaned)
        return transformed

    @classmethod
    def transform_campaigns(cls, raw_campaigns: List[Dict[str, Any]], business_id: int) -> List[Dict[str, Any]]:
        transformed = []
        for raw in raw_campaigns:
            valid, msg = DataValidator.validate_campaign(raw, business_id)
            if not valid:
                continue
            cleaned = DataCleaner.clean_campaign_record(raw)
            cleaned["business_id"] = business_id
            transformed.append(cleaned)
        return transformed

    @classmethod
    def transform_web_metrics(cls, raw_metrics: List[Dict[str, Any]], business_id: int) -> List[Dict[str, Any]]:
        transformed = []
        for raw in raw_metrics:
            valid, msg = DataValidator.validate_web_metric(raw, business_id)
            if not valid:
                continue
            cleaned = DataCleaner.clean_web_metric_record(raw)
            cleaned["business_id"] = business_id
            transformed.append(cleaned)
        return transformed
