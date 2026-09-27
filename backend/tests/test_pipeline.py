import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from pipeline.validator import DataValidator
from pipeline.cleaner import DataCleaner
from pipeline.transformer import DataTransformer
from pipeline.sync_service import SyncService
from database import db_session
from models import Order, DataSource

def test_validator_and_cleaner():
    valid, msg = DataValidator.validate_order({
        "source_id": "ord-001",
        "order_number": "ORD-1001",
        "order_date": "2026-09-20",
        "total_amount": 149.50
    }, business_id=1)
    assert valid is True

    cleaned = DataCleaner.clean_order_record({
        "source_id": "ord-001",
        "order_number": "ORD-1001",
        "order_date": "2026-09-20",
        "total_amount": "149.50",
        "status": "COMPLETED"
    })
    assert cleaned["total_amount"] == 149.50
    assert cleaned["status"] == "completed"

def test_data_preservation_on_failed_sync():
    """Rule 15 & 16: Preserve previous successful data if synchronization fails."""
    # Find a data source
    ds = db_session.query(DataSource).first()
    if ds:
        # Save current count of orders
        initial_order_count = db_session.query(Order).count()
        # Attempt sync with unconfigured credentials
        res = SyncService.execute_sync(ds.id)
        # Previous data MUST be preserved
        after_count = db_session.query(Order).count()
        assert after_count == initial_order_count
        assert res.get("preserved_data") is True
