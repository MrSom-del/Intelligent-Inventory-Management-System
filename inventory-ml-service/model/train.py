"""Train and evaluate product-level demand forecasting models."""

from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

from utils.feature_engineering import engineer_features


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "sample_sales.csv"
MODEL_PATH = PROJECT_ROOT / "model" / "forecaster.pkl"
FEATURE_COLUMNS = ["day_of_week", "lag_1", "lag_7", "rolling_avg_7"]


def build_training_data(product_sales: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Build features and next-day targets for one product."""
    product_sales = product_sales[["sale_date", "quantity_sold"]].copy()
    product_sales["sale_date"] = pd.to_datetime(product_sales["sale_date"])
    product_sales = product_sales.sort_values("sale_date")

    features = engineer_features(product_sales)
    next_day_quantity = product_sales.set_index("sale_date")["quantity_sold"].shift(-1)
    targets = features["date"].map(next_day_quantity.rename_axis("date"))

    valid_targets = targets.notna()
    return features.loc[valid_targets], targets.loc[valid_targets]


def train_models(
    data_path: Path = DATA_PATH, model_path: Path = MODEL_PATH
) -> dict[int, RandomForestRegressor]:
    """Train one Random Forest model per product and save the model bundle."""
    sales = pd.read_csv(data_path)
    required_columns = {"product_id", "sale_date", "quantity_sold"}
    missing_columns = required_columns.difference(sales.columns)
    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"Training data is missing required column(s): {missing}.")

    models: dict[int, RandomForestRegressor] = {}
    for product_id, product_sales in sales.groupby("product_id", sort=True):
        features, targets = build_training_data(product_sales)
        if len(features) < 10:
            raise ValueError(
                f"Product {product_id} has too few usable rows for training: "
                f"{len(features)}."
            )

        split_index = int(len(features) * 0.8)
        x_train = features.iloc[:split_index][FEATURE_COLUMNS]
        x_validation = features.iloc[split_index:][FEATURE_COLUMNS]
        y_train = targets.iloc[:split_index]
        y_validation = targets.iloc[split_index:]

        model = RandomForestRegressor(
            n_estimators=200,
            random_state=42,
            n_jobs=-1,
        )
        model.fit(x_train, y_train)
        predictions = model.predict(x_validation)
        mae = mean_absolute_error(y_validation, predictions)
        rmse = mean_squared_error(y_validation, predictions) ** 0.5
        print(
            f"Product {product_id}: "
            f"MAE={mae:.2f}, RMSE={rmse:.2f}, "
            f"validation_rows={len(y_validation)}"
        )
        models[int(product_id)] = model

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {"models": models, "feature_columns": FEATURE_COLUMNS},
        model_path,
    )
    print(f"Saved {len(models)} product model(s) to {model_path}")
    return models


if __name__ == "__main__":
    train_models()
