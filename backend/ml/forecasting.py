from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from database import db_session
from models import Order, PredictionRecord

class SalesForecastingModel:
    """
    Sales Forecasting Engine (Section 16, Rules 19 & 22):
    Uses historical daily sales to train ML models (Linear Regression / Random Forest).
    Computes validation metrics (MAE, RMSE, R²).
    Generates multi-day future estimates, explicitly designated as MODEL ESTIMATES.
    """
    @classmethod
    def train_and_forecast(
        cls,
        business_id: int,
        model_type: str = "RandomForest",  # RandomForest or LinearRegression
        forecast_horizon_days: int = 14
    ) -> Dict[str, Any]:
        orders = db_session.query(Order).filter(
            Order.business_id == business_id,
            Order.status != "cancelled"
        ).order_by(Order.order_date.asc()).all()

        # Check sufficiency of historical data
        if len(orders) < 14:
            return {
                "success": False,
                "message": f"Insufficient historical data ({len(orders)} orders). At least 14 days/records required to train predictive models.",
                "predictions": [],
                "metrics": {"mae": 0.0, "rmse": 0.0, "r2": 0.0}
            }

        # 1. Aggregate to daily sales
        raw_df = pd.DataFrame([{
            "date": pd.to_datetime(o.order_date.strftime("%Y-%m-%d")),
            "amount": o.total_amount
        } for o in orders])

        daily_df = raw_df.groupby("date")["amount"].sum().reset_index()
        daily_df = daily_df.sort_values("date").reset_index(drop=True)

        if len(daily_df) < 10:
            return {
                "success": False,
                "message": f"Historical time series spans only {len(daily_df)} unique days. Minimum 10 days required.",
                "predictions": [],
                "metrics": {"mae": 0.0, "rmse": 0.0, "r2": 0.0}
            }

        # 2. Feature Preparation (Time-series engineering)
        daily_df["day_of_week"] = daily_df["date"].dt.dayofweek
        daily_df["day_of_month"] = daily_df["date"].dt.day
        daily_df["time_index"] = np.arange(len(daily_df))
        daily_df["lag_1"] = daily_df["amount"].shift(1)
        daily_df["lag_7"] = daily_df["amount"].shift(7).bfill()
        daily_df["rolling_mean_3"] = daily_df["amount"].shift(1).rolling(3, min_periods=1).mean()

        daily_df = daily_df.dropna().reset_index(drop=True)
        if len(daily_df) < 5:
            return {"success": False, "message": "Insufficient feature-engineered records."}

        feature_cols = ["time_index", "day_of_week", "day_of_month", "lag_1", "lag_7", "rolling_mean_3"]
        X = daily_df[feature_cols].values
        y = daily_df["amount"].values

        # 3. Temporal Train/Test Split (80/20)
        split_idx = max(3, int(len(X) * 0.8))
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        # 4. Train Model
        if model_type == "LinearRegression":
            model = LinearRegression()
            model_name = "Linear Regression"
        else:
            model = RandomForestRegressor(n_estimators=50, random_state=42, max_depth=6)
            model_name = "Random Forest Regressor"

        model.fit(X_train, y_train)

        # 5. Validation & Evaluation Metrics
        if len(X_test) > 0:
            y_pred_test = model.predict(X_test)
            mae = float(mean_absolute_error(y_test, y_pred_test))
            rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))
            # R2 score may be clamped to reasonable minimum
            r2 = float(max(-1.0, min(1.0, r2_score(y_test, y_pred_test))))
        else:
            mae, rmse, r2 = 0.0, 0.0, 0.0

        # 6. Future Multi-Step Forecasting
        last_date = daily_df["date"].max()
        last_time_idx = daily_df["time_index"].max()
        last_amt = float(daily_df["amount"].iloc[-1])
        last_lags = daily_df["amount"].tail(7).tolist()

        forecast_results = []
        curr_time_idx = last_time_idx + 1
        curr_lag1 = last_amt

        # Clear existing old predictions for this model and business
        db_session.query(PredictionRecord).filter_by(
            business_id=business_id, model_name=model_name
        ).delete()

        for step in range(1, forecast_horizon_days + 1):
            next_date = last_date + timedelta(days=step)
            dow = next_date.dayofweek
            dom = next_date.day
            lag7 = last_lags[-7] if len(last_lags) >= 7 else curr_lag1
            roll3 = np.mean(last_lags[-3:]) if len(last_lags) >= 3 else curr_lag1

            feat_vec = np.array([[curr_time_idx, dow, dom, curr_lag1, lag7, roll3]])
            pred_val = float(max(0.0, model.predict(feat_vec)[0]))

            # Confidence bounds using MAE
            lower_bound = max(0.0, pred_val - (1.28 * mae if mae > 0 else pred_val * 0.15))
            upper_bound = pred_val + (1.28 * mae if mae > 0 else pred_val * 0.15)

            forecast_rec = PredictionRecord(
                business_id=business_id,
                model_name=model_name,
                target_metric="sales_revenue",
                forecast_date=next_date.date(),
                predicted_value=round(pred_val, 2),
                lower_bound=round(lower_bound, 2),
                upper_bound=round(upper_bound, 2),
                metric_mae=round(mae, 2),
                metric_rmse=round(rmse, 2),
                metric_r2=round(r2, 4),
                training_sample_size=len(X_train)
            )
            db_session.add(forecast_rec)

            forecast_results.append({
                "forecast_date": next_date.strftime("%Y-%m-%d"),
                "predicted_value": round(pred_val, 2),
                "lower_bound": round(lower_bound, 2),
                "upper_bound": round(upper_bound, 2),
                "is_model_estimate": True
            })

            # Update auto-regressive state
            curr_time_idx += 1
            curr_lag1 = pred_val
            last_lags.append(pred_val)

        db_session.commit()

        # Historical points for chart continuity
        recent_history = [{
            "date": r["date"].strftime("%Y-%m-%d"),
            "actual_value": round(float(r["amount"]), 2)
        } for _, r in daily_df.tail(21).iterrows()]

        return {
            "success": True,
            "model_name": model_name,
            "target_metric": "Daily Sales Revenue",
            "evaluation_metrics": {
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "r2": round(r2, 4),
                "evaluation_interpretation": (
                    "High predictive accuracy" if r2 > 0.6 else
                    "Moderate predictive trend capture" if r2 > 0.2 else
                    "Early estimation model based on initial historical volume"
                )
            },
            "training_samples": len(X_train),
            "recent_history": recent_history,
            "predictions": forecast_results,
            "disclaimer": "Predictions are MODEL ESTIMATES based on historical trends, not guaranteed future outcomes."
        }
