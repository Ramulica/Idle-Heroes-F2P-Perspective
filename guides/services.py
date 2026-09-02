REWARD_TYPES = [
    "Void",
    "Origin",
    "DT",
    "Star Soul",
    "Artifacts",
    "Origin Artifacts",
    "Grim",
    "Hero Chest",
    "Festival Skin",
    "Puppet 9",
    "Puppet 10",
    "Resources Chest",
    "Orange Treasure",
    "Orange Festival Treasure",
    "Pink Treasure",
    "Pink Festival Treasure",
    "Deluxe Box",
    "Gold 100k",
    "Cores",
    "Small Material Chest",
    "5-Star Shards",
]


MAX_CHARM_COST = 70

EVENT_MYSTERIOUS_SALE = "mysterious_sale"
EVENT_RNG_CELEBRATION = "rng_celebration"
EVENT_WEEKS_PER_YEAR = 17
RNG_EVENTS_PER_YEAR = 2

DEFAULT_NORMAL_CANS = 16000
DEFAULT_LIMITED_CANS = 36

RNG_SHOP = [
    {"id": "hero-chest", "reward": "Hero Chest", "cost": 1000, "currency": "normal", "unlock_at": 0, "limit": 20},
    {"id": "festival-skin", "reward": "Festival Skin", "cost": 2500, "currency": "normal", "unlock_at": 0, "limit": 1},
    {"id": "puppet-9", "reward": "Puppet 9", "cost": 3500, "currency": "normal", "unlock_at": 0, "limit": 4},
    {"id": "puppet-10", "reward": "Puppet 10", "cost": 5600, "currency": "normal", "unlock_at": 0, "limit": 2},
    {"id": "resources-chest", "reward": "Resources Chest", "cost": 18, "currency": "limited", "unlock_at": 0, "limit": 10},
    {"id": "orange-treasure", "reward": "Orange Treasure", "cost": 6500, "currency": "normal", "unlock_at": 1000, "limit": 8},
    {"id": "orange-festival", "reward": "Orange Festival Treasure", "cost": 7500, "currency": "normal", "unlock_at": 1250, "limit": 8},
    {"id": "pink-treasure", "reward": "Pink Treasure", "cost": 9300, "currency": "normal", "unlock_at": 2000, "limit": 4},
    {"id": "pink-festival", "reward": "Pink Festival Treasure", "cost": 10000, "currency": "normal", "unlock_at": 2500, "limit": 4},
    {"id": "normal-arti", "reward": "Artifacts", "cost": 18, "currency": "limited", "unlock_at": 3200, "limit": 4},
    {"id": "origin-arti", "reward": "Origin Artifacts", "cost": 18, "currency": "limited", "unlock_at": 6400, "limit": 4},
    {"id": "origin-mats", "reward": "Origin", "cost": 18, "currency": "limited", "unlock_at": 9600, "limit": 8},
    {"id": "grim", "reward": "Grim", "cost": 18, "currency": "limited", "unlock_at": 9600, "limit": 6},
    {"id": "deluxe-box", "reward": "Deluxe Box", "cost": 400, "currency": "normal", "unlock_at": 12800, "limit": 20},
    {"id": "dt-mats", "reward": "DT", "cost": 18, "currency": "limited", "unlock_at": 12800, "limit": 6},
    {"id": "star-soul", "reward": "Star Soul", "cost": 18, "currency": "limited", "unlock_at": 16000, "limit": 6},
    {"id": "gold-100k", "reward": "Gold 100k", "cost": 100, "currency": "normal", "unlock_at": 0, "limit": 9999},
    {"id": "cores", "reward": "Cores", "cost": 1, "currency": "limited", "unlock_at": 0, "limit": 9999, "qty": 2},
    {"id": "small-material-chest", "reward": "Small Material Chest", "cost": 125, "currency": "normal", "unlock_at": 0, "limit": 9999},
    {"id": "shards-5-star", "reward": "5-Star Shards", "cost": 90, "currency": "normal", "unlock_at": 0, "limit": 9999},
]
RNG_SHOP_BY_ID = {row["id"]: row for row in RNG_SHOP}


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


def _as_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def normalize_rng_shop(raw):
    data = raw if isinstance(raw, dict) else {}
    buys = {}
    for item_id, value in (data.get("buys") or {}).items():
        item = RNG_SHOP_BY_ID.get(str(item_id))
        amount = max(0, _as_int(value))
        if item and amount:
            buys[item["id"]] = min(item["limit"], amount)
    shop = {
        "normal_cans": max(0, _as_int(data.get("normal_cans"), DEFAULT_NORMAL_CANS)),
        "limited_cans": max(0, _as_int(data.get("limited_cans"), DEFAULT_LIMITED_CANS)),
        "buys": buys,
    }
    return clamp_rng_buys(shop)


def rng_spend(buys):
    normal = 0
    limited = 0
    for item_id, count in (buys or {}).items():
        item = RNG_SHOP_BY_ID.get(item_id)
        amount = max(0, _as_int(count))
        if not item or not amount:
            continue
        if item["currency"] == "limited":
            limited += item["cost"] * amount
        else:
            normal += item["cost"] * amount
    return normal, limited


def rng_item_qty(item):
    return max(1, _as_int(item.get("qty"), 1))


def clamp_rng_buys(shop):
    wanted = dict(shop.get("buys") or {})
    shop = {
        "normal_cans": max(0, _as_int(shop.get("normal_cans"), DEFAULT_NORMAL_CANS)),
        "limited_cans": max(0, _as_int(shop.get("limited_cans"), DEFAULT_LIMITED_CANS)),
        "buys": {},
    }
    spent_normal = 0
    spent_limited = 0
    for item in RNG_SHOP:
        target = min(item["limit"], max(0, _as_int(wanted.get(item["id"]))))
        if not target:
            continue
        leftover = (
            shop["limited_cans"] - spent_limited
            if item["currency"] == "limited"
            else shop["normal_cans"] - spent_normal
        )
        by_cost = leftover // item["cost"] if item["cost"] else target
        owned = max(0, min(item["limit"], target, by_cost))
        if not owned:
            continue
        if item["currency"] == "limited":
            if spent_normal < item["unlock_at"]:
                continue
            shop["buys"][item["id"]] = owned
            spent_limited += item["cost"] * owned
            continue
        spent_after = spent_normal + item["cost"] * owned
        if spent_after < item["unlock_at"]:
            continue
        shop["buys"][item["id"]] = owned
        spent_normal = spent_after
    return shop


def compute_rng_stats(floors):
    shop = normalize_rng_shop(floors)
    spent_normal, spent_limited = rng_spend(shop["buys"])
    counts = empty_counts()
    for item_id, count in shop["buys"].items():
        item = RNG_SHOP_BY_ID.get(item_id)
        amount = max(0, _as_int(count))
        if not item or not amount:
            continue
        reward = item["reward"]
        counts[reward] = counts.get(reward, 0) + amount * rng_item_qty(item)
    return spent_normal, 0, counts, shop, spent_limited


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
        "event_type": getattr(option, "event_type", None) or EVENT_MYSTERIOUS_SALE,
        "sort_order": option.sort_order,
        "rating_avg": round(float(avg), 2) if avg is not None else 0,
        "rating_count": count,
        "my_rating": None if my_rating is None else float(my_rating),
        "is_default": option.created_by_id is None,
    }


def rng_events_for_period(period_weeks):
    period = max(1, int(period_weeks or 1))
    return max(0, int(round(RNG_EVENTS_PER_YEAR * period / EVENT_WEEKS_PER_YEAR)))


def normalize_case_slots(slots, options_by_id, period_weeks):
    period = max(1, int(period_weeks or 1))
    rng_cap = rng_events_for_period(period)
    cleaned = []
    used_ms = 0
    used_rng = 0
    for slot in slots or []:
        try:
            option_id = int(slot.get("option_id"))
        except (TypeError, ValueError):
            continue
        option = options_by_id.get(option_id)
        if not option:
            continue
        try:
            weeks = int(slot.get("weeks") or 0)
        except (TypeError, ValueError):
            continue
        if weeks <= 0:
            continue
        is_rng = getattr(option, "event_type", EVENT_MYSTERIOUS_SALE) == EVENT_RNG_CELEBRATION
        if is_rng:
            room = rng_cap - used_rng
            if room <= 0:
                continue
            weeks = min(weeks, room)
            used_rng += weeks
        else:
            room = period - used_ms
            if room <= 0:
                continue
            weeks = min(weeks, room)
            used_ms += weeks
        cleaned.append({"option_id": option_id, "weeks": weeks})
    return cleaned


def case_totals(slots, options_by_id):
    counts = empty_counts()
    total_sg = 0
    total_weeks = 0
    total_rng_events = 0
    total_normal = 0
    total_limited = 0
    for slot in slots:
        option = options_by_id.get(slot.get("option_id"))
        weeks = int(slot.get("weeks") or 0)
        if not option or weeks <= 0:
            continue
        is_rng = getattr(option, "event_type", EVENT_MYSTERIOUS_SALE) == EVENT_RNG_CELEBRATION
        if is_rng:
            total_rng_events += weeks
            spent_normal, spent_limited = rng_spend(
                (option.floors or {}).get("buys") or {}
            )
            total_normal += spent_normal * weeks
            total_limited += spent_limited * weeks
        else:
            total_weeks += weeks
            total_sg += option.sg_cost * weeks
        for key, value in (option.reward_counts or {}).items():
            counts[key] = counts.get(key, 0) + int(value) * weeks
    return {
        "total_sg_cost": total_sg,
        "total_weeks": total_weeks,
        "total_rng_events": total_rng_events,
        "reward_counts": counts,
        "total_normal_cans": total_normal,
        "total_limited_cans": total_limited,
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
