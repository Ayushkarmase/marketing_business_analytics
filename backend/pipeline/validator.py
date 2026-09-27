from datetime import datetime
from typing import Dict, Any, Tuple, Optional

class ValidationError(Exception):
    pass

class DataValidator:
    """
    Validation Layer (Pipeline Step 3):
    Validates required fields, data types, date formats, and business association.
    """
    @staticmethod
    def parse_date(date_val: Any) -> Optional[datetime]:
        if not date_val:
            return None
        if isinstance(date_val, datetime):
            return date_val
        for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y/%m/%d"):
            try:
                return datetime.strptime(str(date_val)[:19], fmt)
            except ValueError:
                continue
        return None

    @classmethod
    def validate_order(cls, row: Dict[str, Any], business_id: int) -> Tuple[bool, str]:
        if not business_id:
            return False, "Missing business association"
        if not row.get("source_id"):
            return False, "Missing source_id"
        if not row.get("order_number"):
            return False, "Missing order_number"
        if not cls.parse_date(row.get("order_date")):
            return False, f"Invalid order_date: {row.get('order_date')}"
        try:
            float(row.get("total_amount", 0.0))
        except (ValueError, TypeError):
            return False, f"Invalid total_amount: {row.get('total_amount')}"
        return True, "Valid"

    @classmethod
    def validate_campaign(cls, row: Dict[str, Any], business_id: int) -> Tuple[bool, str]:
        if not business_id:
            return False, "Missing business association"
        if not row.get("source_id"):
            return False, "Missing campaign source_id"
        if not row.get("name"):
            return False, "Missing campaign name"
        if not cls.parse_date(row.get("date")):
            return False, f"Invalid campaign date: {row.get('date')}"
        return True, "Valid"

    @classmethod
    def validate_web_metric(cls, row: Dict[str, Any], business_id: int) -> Tuple[bool, str]:
        if not business_id:
            return False, "Missing business association"
        if not cls.parse_date(row.get("date")):
            return False, f"Invalid metric date: {row.get('date')}"
        return True, "Valid"
