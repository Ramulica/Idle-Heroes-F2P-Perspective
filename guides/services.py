REWARD_TYPES = [
    "Void",
    "Origin",
    "DT",
    "Star Soul",
    "Artifacts",
    "Origin Artifacts",
    "Grim",
]


def empty_counts():
    return {name: 0 for name in REWARD_TYPES}


def lookup_sg(total_cost, sg_table):
    sg = 0
    for row in sg_table:
        if total_cost <= row["max_cost"]:
            return row["sg"]
        sg = row["sg"]
    return sg


def normalize_picks(picks, floors):
    cleaned = {
        str(key): value for key, value in (picks or {}).items() if value
    }
    filled_early = 0
    for floor in floors:
        number = int(floor["floor"])
        if number < 13 and cleaned.get(str(number)):
            filled_early += 1
    if filled_early < 12:
        cleaned.pop("13", None)
    return cleaned


def reward_cost(floor, reward, floor_12_discount=False):
    cost = int(reward.get("cost") or 0)
    if int(floor.get("floor") or 0) == 12 and not floor_12_discount and cost > 0:
        return 10
    return cost


def compute_option_stats(picks, floors, sg_table, floor_12_discount=False):
    picks = normalize_picks(picks, floors)
    total = 0
    counts = empty_counts()
    for floor in floors:
        pick = picks.get(str(floor["floor"])) or picks.get(floor["floor"])
        if not pick:
            continue
        if pick in counts:
            counts[pick] += 1
        for reward in floor["rewards"]:
            if reward["reward_type"] == pick:
                total += reward_cost(floor, reward, floor_12_discount)
                break
    return total, lookup_sg(total, sg_table), counts


def option_payload(option, rating_avg=None, rating_count=0, my_rating=None):
    avg = rating_avg
    if avg is None:
        avg = getattr(option, "rating_avg", None)
    count = rating_count
    if not count:
        count = int(getattr(option, "rating_count", 0) or 0)
    return {
        "id": option.id,
        "name": option.name,
        "floors": option.floors,
        "floor_12_discount": bool(option.floor_12_discount),
        "total_cost": option.total_cost,
        "sg_cost": option.sg_cost,
        "reward_counts": option.reward_counts,
        "sort_order": option.sort_order,
        "rating_avg": round(float(avg), 2) if avg is not None else 0,
        "rating_count": count,
        "my_rating": None if my_rating is None else float(my_rating),
        "is_default": option.created_by_id is None,
    }


def normalize_case_slots(slots, options_by_id, period_weeks):
    period = max(1, int(period_weeks or 1))
    cleaned = []
    used = 0
    for slot in slots or []:
        try:
            option_id = int(slot.get("option_id"))
        except (TypeError, ValueError):
            continue
        if option_id not in options_by_id:
            continue
        try:
            weeks = int(slot.get("weeks") or 0)
        except (TypeError, ValueError):
            continue
        if weeks <= 0:
            continue
        room = period - used
        if room <= 0:
            break
        weeks = min(weeks, room)
        cleaned.append({"option_id": option_id, "weeks": weeks})
        used += weeks
    return cleaned


def case_totals(slots, options_by_id):
    counts = empty_counts()
    total_sg = 0
    total_weeks = 0
    for slot in slots:
        option = options_by_id.get(slot.get("option_id"))
        weeks = int(slot.get("weeks") or 0)
        if not option or weeks <= 0:
            continue
        total_weeks += weeks
        total_sg += option.sg_cost * weeks
        for key, value in (option.reward_counts or {}).items():
            counts[key] = counts.get(key, 0) + int(value) * weeks
    return {
        "total_sg_cost": total_sg,
        "total_weeks": total_weeks,
        "reward_counts": counts,
    }


def case_payload(case, options_by_id, rating_avg=None, rating_count=0, my_rating=None):
    slots = []
    for slot in case.slots or []:
        option = options_by_id.get(slot.get("option_id"))
        slots.append(
            {
                "option_id": slot.get("option_id"),
                "option_name": option.name if option else "",
                "weeks": int(slot.get("weeks") or 0),
            }
        )
    totals = case_totals(case.slots or [], options_by_id)
    avg = rating_avg
    if avg is None:
        avg = getattr(case, "rating_avg", None)
    count = rating_count
    if not count:
        count = int(getattr(case, "rating_count", 0) or 0)
    period = max(1, int(case.period_weeks or 1))
    return {
        "id": case.id,
        "name": case.name,
        "slots": slots,
        "period_weeks": period,
        "sort_order": case.sort_order,
        "rating_avg": round(float(avg), 2) if avg is not None else 0,
        "rating_count": count,
        "my_rating": None if my_rating is None else float(my_rating),
        **totals,
    }
