"""Constrained contextual-bandit budget allocation for post-booking spend."""

from math import log, sqrt

ARMS = ("experience", "local_transport", "meals", "stay_upgrade")
_stats = {arm: {"reward": 0.0, "pulls": 0} for arm in ARMS}


def _score(arm: str, context: dict, total_pulls: int) -> float:
    stats = _stats[arm]
    # Cold-start priors are preference-aware. UCB gives less-tested arms a
    # chance as feedback arrives, which is the RL exploration component.
    preference = {
        "experience": float(context.get("activity_priority", 0.5)),
        "local_transport": float(context.get("mobility_priority", 0.5)),
        "meals": float(context.get("food_priority", 0.5)),
        "stay_upgrade": float(context.get("comfort_priority", 0.5)),
    }[arm]
    mean_reward = stats["reward"] / stats["pulls"] if stats["pulls"] else preference
    exploration = sqrt(2 * log(max(2, total_pulls)) / max(1, stats["pulls"]))
    return mean_reward + 0.15 * exploration


def allocate_budget(remaining_budget: float, context: dict | None = None) -> dict:
    """Allocate only discretionary funds; an emergency reserve is mandatory."""
    context = context or {}
    remaining_budget = max(float(remaining_budget or 0), 0)
    reserve_rate = 0.25 if remaining_budget < 3000 else 0.18
    emergency_reserve = round(remaining_budget * reserve_rate)
    discretionary = max(0, remaining_budget - emergency_reserve)
    total_pulls = sum(item["pulls"] for item in _stats.values()) + 1
    ranked = sorted(ARMS, key=lambda arm: _score(arm, context, total_pulls), reverse=True)
    weights = [0.42, 0.28, 0.18, 0.12]
    allocation = {arm: round(discretionary * weight) for arm, weight in zip(ranked, weights)}
    # Rounding must never exceed the available amount.
    allocation[ranked[-1]] += discretionary - sum(allocation.values())
    suggestions = [
        {"category": arm, "amount": amount,
         "reason": f"Recommended by the contextual bandit for your {arm.replace('_', ' ')} preference."}
        for arm, amount in allocation.items() if amount > 0
    ]
    return {
        "model": "constrained-contextual-bandit-ucb1",
        "remaining_budget": round(remaining_budget), "emergency_reserve": emergency_reserve,
        "discretionary_budget": discretionary, "allocations": allocation,
        "suggestions": suggestions,
    }


def record_feedback(category: str, reward: float) -> dict:
    if category not in _stats:
        raise ValueError("Unknown budget category")
    reward = max(0.0, min(1.0, float(reward)))
    _stats[category]["reward"] += reward
    _stats[category]["pulls"] += 1
    return {"category": category, "reward": reward, "pulls": _stats[category]["pulls"]}
