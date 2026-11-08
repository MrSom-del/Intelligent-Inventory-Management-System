"""Feature engineering helpers for product-level demand forecasting."""

from __future__ import annotations

import pandas as pd


def engineer_features(sales: pd.DataFrame) -> pd.DataFrame:
    """Create time-series features for one product's sales history.

    Args:
        sales: DataFrame containing ``date`` or ``sale_date`` and
            ``quantity_sold`` columns. Rows should represent one product.

    Returns:
        A chronologically sorted DataFrame containing the original date and
        quantity columns plus ``day_of_week``, ``lag_1``, ``lag_7``, and
        ``rolling_avg_7``. Rows without enough history to calculate all
        features are removed.

    Raises:
        ValueError: If the input is missing required columns or contains an
            invalid date or quantity value.
    """
    features = sales.copy()

    if "date" not in features.columns:
        if "sale_date" in features.columns:
            features = features.rename(columns={"sale_date": "date"})
        else:
            raise ValueError("Input data must contain a 'date' or 'sale_date' column.")

    required_columns = {"date", "quantity_sold"}
    missing_columns = required_columns.difference(features.columns)
    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"Input data is missing required column(s): {missing}.")

    features["date"] = pd.to_datetime(features["date"], errors="coerce")
    features["quantity_sold"] = pd.to_numeric(
        features["quantity_sold"], errors="coerce"
    )
    if features[["date", "quantity_sold"]].isna().any().any():
        raise ValueError("Input data contains invalid dates or quantity values.")

    features = features.sort_values("date").reset_index(drop=True)
    features["day_of_week"] = features["date"].dt.dayofweek
    features["lag_1"] = features["quantity_sold"].shift(1)
    features["lag_7"] = features["quantity_sold"].shift(7)
    features["rolling_avg_7"] = features["quantity_sold"].rolling(window=7).mean()

    return features.dropna(
        subset=["day_of_week", "lag_1", "lag_7", "rolling_avg_7"]
    ).reset_index(drop=True)
