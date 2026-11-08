"""Plot validation predictions for one product."""

from __future__ import annotations

import argparse

import matplotlib.pyplot as plt
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

from model.train import DATA_PATH, FEATURE_COLUMNS, build_training_data


def plot_validation(product_id: int) -> None:
    """Train a product model, report validation metrics, and plot its predictions."""
    sales = pd.read_csv(DATA_PATH)
    product_sales = sales[sales["product_id"] == product_id]
    if product_sales.empty:
        raise ValueError(f"Product {product_id} was not found in {DATA_PATH}.")

    features, targets = build_training_data(product_sales)
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
        f"Product {product_id}: MAE={mae:.2f}, RMSE={rmse:.2f}, "
        f"validation_rows={len(y_validation)}"
    )

    validation_dates = features.iloc[split_index:]["date"]
    fig, ax = plt.subplots(figsize=(10, 4.5), facecolor="white")
    ax.set_facecolor("white")
    ax.plot(
        validation_dates,
        y_validation,
        color="#2a78d6",
        marker="o",
        markersize=3,
        label="Actual",
    )
    ax.plot(
        validation_dates,
        predictions,
        color="#eb6834",
        marker="o",
        markersize=3,
        linestyle="--",
        label="Predicted",
    )
    ax.set_title(
        f"Forecast versus Actual Demand: Product {product_id} (Validation Days)"
    )
    ax.set_xlabel("Validation date")
    ax.set_ylabel("Quantity sold (units per day)")
    ax.legend()
    ax.grid(True, color="#d9d9d9", linewidth=0.8)
    fig.autofmt_xdate(rotation=45)
    fig.tight_layout()
    output_path = f"forecast_vs_actual_product_{product_id}.png"
    fig.savefig(output_path, dpi=200, facecolor="white")
    plt.show()
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Plot validation predictions for a product."
    )
    parser.add_argument(
        "product_id",
        nargs="?",
        type=int,
        default=1,
        help="Product ID to evaluate (default: 1).",
    )
    args = parser.parse_args()
    plot_validation(args.product_id)


if __name__ == "__main__":
    main()
