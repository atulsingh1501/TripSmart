from collections import Counter
from math import sqrt


def _value(trip: dict, *path: str):
    current = trip
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def _budget_band(amount) -> str:
    try:
        value = float(amount or 0)
    except (TypeError, ValueError):
        value = 0
    if value < 10000:
        return "under-10k"
    if value < 20000:
        return "10-20k"
    if value < 40000:
        return "20-40k"
    if value < 80000:
        return "40-80k"
    return "80k+"


def _duration_band(trip: dict) -> str:
    days = _value(trip, "durationDays")
    if not days:
        days = _value(trip, "breakdown", "usableDays") or 1
    try:
        days = max(1, int(days))
    except (TypeError, ValueError):
        start = trip.get("startDate")
        end = trip.get("endDate")
        try:
            from datetime import date
            days = max(1, (date.fromisoformat(str(end)[:10]) - date.fromisoformat(str(start)[:10])).days + 1)
        except (TypeError, ValueError):
            days = 1
    return "1-2" if days <= 2 else "3-4" if days <= 4 else "5-7" if days <= 7 else "8+"


def _features(trips: list[dict]) -> Counter:
    features = Counter()
    for trip in trips:
        source = _value(trip, "source", "name") or _value(trip, "source") or "unknown"
        destination = _value(trip, "destination", "name") or _value(trip, "destination") or "unknown"
        plan = (trip.get("plans") or [{}])[0]
        total = _value(plan, "costs", "total") or _value(trip, "booking", "totalAmount") or 0
        mode = (_value(plan, "transport", "mode") or _value(plan, "transportDetails", "mode") or "mixed")
        features.update({
            f"source:{str(source).lower()}": 1,
            f"destination:{str(destination).lower()}": 1,
            f"budget:{_budget_band(total)}": 1,
            f"duration:{_duration_band(trip)}": 1,
            f"transport:{str(mode).lower()}": 1,
            f"travelers:{min(int(trip.get('travelers') or 1), 4)}": 1,
            f"tripType:{trip.get('tripType') or 'direct'}": 1,
        })
        preferences = trip.get("preferences") or {}
        for interest in preferences.get("interests") or []:
            features[f"interest:{str(interest).lower()}"] += 1
    return features


def _cosine(left: Counter, right: Counter) -> float:
    keys = set(left) | set(right)
    dot = sum(left[key] * right[key] for key in keys)
    left_norm = sqrt(sum(value * value for value in left.values()))
    right_norm = sqrt(sum(value * value for value in right.values()))
    return dot / (left_norm * right_norm) if left_norm and right_norm else 0.0


def _format_candidate(trip: dict, similarity: float) -> dict:
    plan = (trip.get("plans") or [{}])[0]
    return {
        "_id": str(trip.get("_id") or trip.get("id")),
        "source": _value(trip, "source", "name") or _value(trip, "source"),
        "destination": _value(trip, "destination", "name") or _value(trip, "destination"),
        "startDate": trip.get("startDate"),
        "endDate": trip.get("endDate"),
        "travelers": trip.get("travelers") or 1,
        "durationDays": _duration_band(trip),
        "transportMode": _value(plan, "transport", "mode") or _value(plan, "transportDetails", "mode") or "mixed",
        "totalCost": _value(plan, "costs", "total") or _value(trip, "booking", "totalAmount") or 0,
        "highlights": plan.get("highlights") or [],
        "similarBecause": f"Matches your travel profile ({round(similarity * 100)}% similarity)",
        "similarity": round(similarity, 4),
    }


def rank_recommendations(user_trips: list[dict], candidates: list[dict], limit: int = 6) -> list[dict]:
    user_features = _features(user_trips)
    seen = {
        str(_value(trip, "destination", "name") or _value(trip, "destination") or "").lower()
        for trip in user_trips
    }
    ranked = sorted(
        (
            (_cosine(user_features, _features([candidate])), candidate)
            for candidate in candidates
            if str(_value(candidate, "destination", "name") or _value(candidate, "destination") or "").lower() not in seen
        ),
        key=lambda item: item[0],
        reverse=True,
    )
    return [_format_candidate(candidate, score) for score, candidate in ranked[:limit]]