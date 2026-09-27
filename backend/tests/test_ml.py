import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from ml.segmentation import CustomerSegmentationModel
from ml.forecasting import SalesForecastingModel
from database import db_session
from models import Business

def test_kmeans_dynamic_customer_segmentation():
    biz = db_session.query(Business).first()
    assert biz is not None

    res = CustomerSegmentationModel.train_and_assign(biz.id)
    assert res["success"] is True
    assert res["k_clusters"] >= 3
    assert len(res["clusters"]) == res["k_clusters"]
    # Check that labels are descriptive and based on centroids
    labels = [c["label"] for c in res["clusters"]]
    assert len(labels) == len(set(labels))  # All labels must be unique and descriptive

def test_sales_forecasting_with_evaluation_metrics():
    biz = db_session.query(Business).first()
    assert biz is not None

    # Test Random Forest
    res_rf = SalesForecastingModel.train_and_forecast(biz.id, model_type="RandomForest", forecast_horizon_days=7)
    assert res_rf["success"] is True
    assert len(res_rf["predictions"]) == 7
    assert "mae" in res_rf["evaluation_metrics"]
    assert "rmse" in res_rf["evaluation_metrics"]
    assert "r2" in res_rf["evaluation_metrics"]
    # Verify explicit model estimate designation
    assert res_rf["predictions"][0]["is_model_estimate"] is True

    # Test Linear Regression
    res_lr = SalesForecastingModel.train_and_forecast(biz.id, model_type="LinearRegression", forecast_horizon_days=7)
    assert res_lr["success"] is True
    assert len(res_lr["predictions"]) == 7
