from flask import Blueprint, request, jsonify
from database import db_session
from models import Business
from ml.segmentation import CustomerSegmentationModel
from ml.forecasting import SalesForecastingModel

ml_bp = Blueprint("ml", __name__)

def _get_business_id():
    biz = db_session.query(Business).first()
    return biz.id if biz else 1

@ml_bp.route("/segmentation", methods=["GET", "POST"])
def customer_segmentation():
    """
    Executes or retrieves K-Means customer segmentation.
    CRITICAL: Dynamic cluster label assignment based on actual centroid RFM characteristics.
    """
    n_clusters = request.args.get("k", type=int)
    if request.method == "POST":
        data = request.get_json() or {}
        n_clusters = data.get("k", n_clusters)

    result = CustomerSegmentationModel.train_and_assign(_get_business_id(), n_clusters=n_clusters)
    return jsonify(result), 200

@ml_bp.route("/forecast", methods=["GET", "POST"])
def sales_forecast():
    """
    Executes or retrieves Predictive Sales Forecasting.
    Includes validation metrics (MAE, RMSE, R²) and explicit MODEL ESTIMATE disclaimers.
    """
    model_type = request.args.get("model", "RandomForest")
    horizon = int(request.args.get("horizon", 14))

    if request.method == "POST":
        data = request.get_json() or {}
        model_type = data.get("model", model_type)
        horizon = int(data.get("horizon", horizon))

    result = SalesForecastingModel.train_and_forecast(
        _get_business_id(),
        model_type=model_type,
        forecast_horizon_days=horizon
    )
    return jsonify(result), 200
