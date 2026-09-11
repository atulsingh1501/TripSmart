"""Short-horizon trip price forecasts without external retrieval.

When historical fare observations are supplied, a least-squares trend is fit
to them.  Until a live historical-fare feed is connected, the same interface
uses transparent seasonal and booking-window priors rather than pretending a
trained model exists.
"""

from datetime import date
from statistics import mean


def _days_until(departure_date: str | None) -> int:
    try:
        return max(0, (date.fromisoformat(str(departure_date)[:10]) - date.today()).days)
    except (TypeError, ValueError):
        return 30


def _linear_slope(history: list[dict]) -> float | None:
    points = []
    for observation in history:
        try:
            x = float(observation.get("days_before_departure"))
            y = float(observation.get("price"))
            if x >= 0 and y > 0:
                points.append((x, y))
        except (AttributeError, TypeError, ValueError):
            continue
    if len(points) < 3:
        return None
    x_bar, y_bar = mean(x for x, _ in points), mean(y for _, y in points)
    denominator = sum((x - x_bar) ** 2 for x, _ in points)
    return None if not denominator else sum((x - x_bar) * (y - y_bar) for x, y in points) / denominator


def forecast_price(
    current_price: float,
    departure_date: str | None,
    transport_mode: str = "flight",
    fare_history: list[dict] | None = None,
) -> dict:
    """Forecast 3/7/14 day prices and booking guidance in INR."""
    current_price = max(float(current_price or 0), 0)
    days_until = _days_until(departure_date)
    mode = str(transport_mode or "flight").lower()
    slope = _linear_slope(fare_history or [])

    # Fares usually rise as departure approaches. Trains are substantially
    # less volatile than flights. Peak holiday months add a modest premium.
    volatility = {"flight": 0.018, "bus": 0.010, "train": 0.003}.get(mode, 0.010)
    try:
        month = date.fromisoformat(str(departure_date)[:10]).month
    except (TypeError, ValueError):
        month = 0
    seasonal_pressure = 0.006 if month in {4, 5, 10, 11, 12} else 0.0
    urgency = max(0.25, min(1.4, (45 - days_until) / 45 + 0.45))
    daily_change = -(volatility + seasonal_pressure) * urgency
    source = "booking-window prior"
    if slope is not None:
        # History's x axis is days before departure: price change after one
        # calendar day is -slope. Blend it with a bounded prior for stability.
        daily_change = max(-0.12, min(0.12, (-slope / max(current_price, 1)) * 0.7 + daily_change * 0.3))
        source = "historical fare trend"

    horizons = [3, 7, 14]
    predictions = {
        str(horizon): round(current_price * (1 + daily_change * min(horizon, days_until)), 2)
        for horizon in horizons
    }
    projected_7d = predictions["7"]
    percent_change = round(((projected_7d - current_price) / max(current_price, 1)) * 100, 1)
    if percent_change >= 3 or days_until <= 10:
        trend, recommendation = "rising", "book_now"
        message = "Prices are likely to rise; booking sooner reduces fare risk."
    elif percent_change <= -3 and days_until > 21:
        trend, recommendation = "falling", "watch"
        message = "The fare is trending down; monitor it before booking."
    else:
        trend, recommendation = "stable", "consider_booking"
        message = "The fare is stable; book when the plan is ready."
    return {
        "current_price": round(current_price, 2), "currency": "INR",
        "days_until_departure": days_until, "transport_mode": mode,
        "predictions": predictions, "trend": trend,
        "seven_day_change_percent": percent_change,
        "recommendation": recommendation, "message": message,
        "model_source": source,
    }
