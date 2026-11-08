"""Flask API for demand forecasting."""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request

from utils.feature_engineering import engineer_features


PROJECT_ROOT = Path(__file__).resolve().parent
MODEL_PATH = PROJECT_ROOT / "model" / "forecaster.pkl"
FORECAST_DAYS = 7

app = Flask(__name__)


def load_model_bundle() -> dict:
    """Load the trained model bundle from disk."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Trained model not found at {MODEL_PATH}. Run 'venv/bin/python -m model.train' first."
        )
    return joblib.load(MODEL_PATH)


MODEL_BUNDLE = load_model_bundle()


@app.after_request
def add_cors_headers(response):
    """Allow browser-based calls from the Spring Boot service's origin."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


def validate_prediction_request(payload: object) -> tuple[int, pd.DataFrame]:
    """Validate a prediction payload and return its product ID and history."""
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")

    if "product_id" not in payload or "sales_history" not in payload:
        raise ValueError("Request must include 'product_id' and 'sales_history'.")

    try:
        product_id = int(payload["product_id"])
    except (TypeError, ValueError) as error:
        raise ValueError("'product_id' must be an integer.") from error

    if not isinstance(payload["sales_history"], list):
        raise ValueError("'sales_history' must be a JSON array.")
    if len(payload["sales_history"]) < 8:
        raise ValueError("'sales_history' must contain at least 8 records.")

    history = pd.DataFrame(payload["sales_history"])
    required_columns = {"date", "quantity_sold"}
    missing_columns = required_columns.difference(history.columns)
    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"Each sales history record must include: {missing}.")

    return product_id, history[["date", "quantity_sold"]]


def forecast_next_days(
    product_id: int, sales_history: pd.DataFrame, days: int = FORECAST_DAYS
) -> list[dict[str, float | str]]:
    """Forecast future demand recursively for one product."""
    models = MODEL_BUNDLE["models"]
    feature_columns = MODEL_BUNDLE["feature_columns"]
    if product_id not in models:
        supported_products = ", ".join(str(value) for value in sorted(models))
        raise ValueError(
            f"No trained model exists for product_id {product_id}. "
            f"Supported product IDs: {supported_products}."
        )

    history = sales_history.copy()
    history["date"] = pd.to_datetime(history["date"], errors="coerce")
    history["quantity_sold"] = pd.to_numeric(
        history["quantity_sold"], errors="coerce"
    )
    if history[["date", "quantity_sold"]].isna().any().any():
        raise ValueError("Sales history contains invalid dates or quantity values.")
    if history["date"].duplicated().any():
        raise ValueError("Sales history must not contain duplicate dates.")

    history = history.sort_values("date").reset_index(drop=True)
    model = models[product_id]
    forecasts = []

    for _ in range(days):
        features = engineer_features(history)
        latest_features = features.iloc[[-1]][feature_columns]
        prediction = max(0.0, float(model.predict(latest_features)[0]))
        next_date = history["date"].iloc[-1] + timedelta(days=1)
        forecasts.append(
            {
                "date": next_date.date().isoformat(),
                "predicted_quantity": round(prediction, 2),
            }
        )
        history = pd.concat(
            [
                history,
                pd.DataFrame(
                    {"date": [next_date], "quantity_sold": [prediction]}
                ),
            ],
            ignore_index=True,
        )

    return forecasts


@app.get("/health")
def health():
    """Return a basic service health response."""
    return jsonify({"status": "healthy"})


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    """Return a recursive seven-day demand forecast."""
    if request.method == "OPTIONS":
        return ("", 204)

    try:
        product_id, sales_history = validate_prediction_request(request.get_json())
        forecast = forecast_next_days(product_id, sales_history)
    except (TypeError, ValueError) as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({"product_id": product_id, "forecast": forecast})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
