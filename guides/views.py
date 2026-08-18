import json
from copy import deepcopy
from decimal import Decimal, InvalidOperation
from functools import wraps

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.db.models import Avg, Count
from django.http import FileResponse, Http404, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods

from .models import (
    CasePlan,
    CaseRating,
    CompletionOption,
    EventPreview,
    GameMeta,
    OptionRating,
    UserProfile,
)
from .services import (
    case_payload,
    compute_option_stats,
    normalize_case_slots,
    normalize_picks,
    option_payload,
)

VALID_SCORES = {Decimal(str(x / 2)) for x in range(0, 11)}


def _json_body(request):
    if not request.body:
        return {}
    return json.loads(request.body.decode("utf-8"))


def _meta():
    meta = GameMeta.objects.first()
    if not meta:
        return GameMeta(floors=[], sg_table=[], notes=[])
    return meta


def _options_map():
    return {opt.id: opt for opt in CompletionOption.objects.all()}


def _ensure_user_cases(user):
    profile = _profile(user)
    if profile.cases_initialized:
        return
    templates = list(
        CasePlan.objects.filter(owner__isnull=True).order_by("sort_order", "id")
    )
    CasePlan.objects.bulk_create(
        [
            CasePlan(
                owner=user,
                name=template.name,
                slots=deepcopy(list(template.slots or [])),
                period_weeks=max(1, int(template.period_weeks or 6)),
                sort_order=template.sort_order,
            )
            for template in templates
        ]
    )
    profile.cases_initialized = True
    profile.save(update_fields=["cases_initialized"])


def _case_rating_maps(user):
    _ensure_user_cases(user)
    cases = CasePlan.objects.filter(owner=user).annotate(
        rating_avg=Avg("ratings__score"),
        rating_count=Count("ratings", distinct=True),
    )
    mine = {
        row.case_id: row.score
        for row in CaseRating.objects.filter(user=user, case__owner=user)
    }
    return cases, mine


def _case_json(case, options_by_id, mine):
    return case_payload(
        case,
        options_by_id,
        rating_avg=getattr(case, "rating_avg", None),
        rating_count=int(getattr(case, "rating_count", 0) or 0),
        my_rating=mine.get(case.id),
    )


def _user_case(user, case_id):
    return CasePlan.objects.get(pk=case_id, owner=user)


def _period_weeks(value, fallback=6):
    try:
        weeks = int(value)
    except (TypeError, ValueError):
        weeks = fallback
    return max(1, min(weeks, 260))


def _profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def _user_payload(user):
    return {"id": user.id, "username": user.username}


def login_required_json(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Please log in."}, status=401)
        return view(request, *args, **kwargs)

    return wrapped


def _rating_maps(user):
    options = CompletionOption.objects.annotate(
        rating_avg=Avg("ratings__score"),
        rating_count=Count("ratings", distinct=True),
    )
    mine = {}
    if user.is_authenticated:
        mine = {
            row.option_id: row.score
            for row in OptionRating.objects.filter(user=user)
        }
    return options, mine


def _option_json(option, mine):
    return option_payload(
        option,
        rating_avg=getattr(option, "rating_avg", None),
        rating_count=int(getattr(option, "rating_count", 0) or 0),
        my_rating=mine.get(option.id),
    )


@ensure_csrf_cookie
@require_http_methods(["GET"])
def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"user": None})
    return JsonResponse({"user": _user_payload(request.user)})


@ensure_csrf_cookie
@require_http_methods(["POST"])
def register(request):
    data = _json_body(request)
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if len(username) < 3:
        return JsonResponse({"error": "Username must be at least 3 characters."}, status=400)
    if len(password) < 4:
        return JsonResponse({"error": "Password must be at least 4 characters."}, status=400)
    if username.lower() in {"guest", "admin"}:
        return JsonResponse({"error": "That username is already taken."}, status=400)
    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse(
            {"error": "That username is already taken. Log in, or pick another."},
            status=400,
        )
    try:
        user = User.objects.create_user(username=username, password=password)
    except IntegrityError:
        return JsonResponse(
            {"error": "That username is already taken. Log in, or pick another."},
            status=400,
        )
    _profile(user)
    login(request, user)
    return JsonResponse({"user": _user_payload(user)}, status=201)


@ensure_csrf_cookie
@require_http_methods(["POST"])
def login_view(request):
    data = _json_body(request)
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    user = authenticate(request, username=username, password=password)
    if not user:
        return JsonResponse({"error": "Wrong username or password."}, status=400)
    login(request, user)
    _profile(user)
    return JsonResponse({"user": _user_payload(user)})


@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})


@ensure_csrf_cookie
@require_GET
def bootstrap(request):
    meta = _meta()
    options, mine = _rating_maps(request.user)
    options = list(options)
    options_by_id = {opt.id: opt for opt in options}
    if request.user.is_authenticated:
        cases, case_mine = _case_rating_maps(request.user)
        cases = [_case_json(case, options_by_id, case_mine) for case in cases]
        user = _user_payload(request.user)
    else:
        templates = (
            CasePlan.objects.filter(owner__isnull=True)
            .annotate(
                rating_avg=Avg("ratings__score"),
                rating_count=Count("ratings", distinct=True),
            )
            .order_by("sort_order", "id")
        )
        cases = [_case_json(case, options_by_id, {}) for case in templates]
        user = None
    events = [
        {
            "id": event.id,
            "event_number": event.event_number,
            "date": event.date.isoformat() if event.date else None,
            "name": event.name,
            "resource_type": event.resource_type,
            "sort_order": event.sort_order,
        }
        for event in EventPreview.objects.all()
    ]
    return JsonResponse(
        {
            "user": user,
            "floors": meta.floors,
            "sg_table": meta.sg_table,
            "notes": meta.notes,
            "options": [_option_json(opt, mine) for opt in options],
            "cases": cases,
            "events": events,
        }
    )


@require_http_methods(["GET", "PUT", "PATCH"])
def sg_calculator(request):
    if not request.user.is_authenticated:
        if request.method == "GET":
            return JsonResponse({"state": {}})
        return JsonResponse({"error": "Please log in to save."}, status=401)
    profile = _profile(request.user)
    if request.method == "GET":
        return JsonResponse({"state": profile.sg_calculator or {}})
    data = _json_body(request)
    profile.sg_calculator = data.get("state") or {}
    profile.save(update_fields=["sg_calculator"])
    return JsonResponse({"state": profile.sg_calculator})


@login_required_json
@require_http_methods(["GET", "POST"])
def options_collection(request):
    meta = _meta()
    if request.method == "GET":
        options, mine = _rating_maps(request.user)
        return JsonResponse({"options": [_option_json(opt, mine) for opt in options]})

    data = _json_body(request)
    name = (data.get("name") or "").strip()
    if not name:
        return JsonResponse({"error": "Name is required."}, status=400)
    picks = normalize_picks(data.get("floors") or {}, meta.floors)
    floor_12_discount = bool(data.get("floor_12_discount"))
    total, sg_cost, counts = compute_option_stats(
        picks, meta.floors, meta.sg_table, floor_12_discount
    )
    last = CompletionOption.objects.order_by("-sort_order").first()
    option = CompletionOption.objects.create(
        name=name,
        floors=picks,
        floor_12_discount=floor_12_discount,
        total_cost=total,
        sg_cost=sg_cost,
        reward_counts=counts,
        sort_order=(last.sort_order + 1) if last else 1,
        created_by=request.user,
    )
    return JsonResponse(_option_json(option, {}), status=201)


@login_required_json
@require_http_methods(["PATCH", "PUT", "DELETE"])
def option_detail(request, option_id):
    try:
        option = CompletionOption.objects.get(pk=option_id)
    except CompletionOption.DoesNotExist:
        return JsonResponse({"error": "Option not found."}, status=404)

    if request.method == "DELETE":
        option.delete()
        return JsonResponse({"ok": True})

    data = _json_body(request)
    meta = _meta()
    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return JsonResponse({"error": "Name is required."}, status=400)
        option.name = name
    if "floors" in data:
        option.floors = normalize_picks(data.get("floors") or {}, meta.floors)
    else:
        option.floors = normalize_picks(option.floors, meta.floors)
    if "floor_12_discount" in data:
        option.floor_12_discount = bool(data.get("floor_12_discount"))
    total, sg_cost, counts = compute_option_stats(
        option.floors, meta.floors, meta.sg_table, option.floor_12_discount
    )
    option.total_cost = total
    option.sg_cost = sg_cost
    option.reward_counts = counts
    option.save()
    options, mine = _rating_maps(request.user)
    option = options.get(pk=option.id)
    return JsonResponse(_option_json(option, mine))


@login_required_json
@require_http_methods(["PUT", "POST", "DELETE"])
def option_rate(request, option_id):
    try:
        option = CompletionOption.objects.get(pk=option_id)
    except CompletionOption.DoesNotExist:
        return JsonResponse({"error": "Option not found."}, status=404)

    if request.method == "DELETE":
        OptionRating.objects.filter(user=request.user, option=option).delete()
    else:
        data = _json_body(request)
        try:
            score = Decimal(str(data.get("score")))
        except (InvalidOperation, TypeError):
            return JsonResponse({"error": "Score must be 0 to 5 in half-stars."}, status=400)
        if score not in VALID_SCORES:
            return JsonResponse({"error": "Score must be 0 to 5 in half-stars."}, status=400)
        OptionRating.objects.update_or_create(
            user=request.user,
            option=option,
            defaults={"score": score},
        )

    options, mine = _rating_maps(request.user)
    option = options.get(pk=option_id)
    return JsonResponse(_option_json(option, mine))


@login_required_json
@require_http_methods(["GET", "POST"])
def cases_collection(request):
    options_by_id = _options_map()
    cases, mine = _case_rating_maps(request.user)
    if request.method == "GET":
        return JsonResponse(
            {"cases": [_case_json(case, options_by_id, mine) for case in cases]}
        )

    data = _json_body(request)
    name = (data.get("name") or "").strip()
    if not name:
        return JsonResponse({"error": "Name is required."}, status=400)
    period_weeks = _period_weeks(data.get("period_weeks"), 6)
    slots = normalize_case_slots(data.get("slots") or [], options_by_id, period_weeks)
    last = CasePlan.objects.filter(owner=request.user).order_by("-sort_order").first()
    case = CasePlan.objects.create(
        owner=request.user,
        name=name,
        slots=slots,
        period_weeks=period_weeks,
        sort_order=(last.sort_order + 1) if last else 1,
    )
    cases, mine = _case_rating_maps(request.user)
    case = cases.get(pk=case.id)
    return JsonResponse(_case_json(case, options_by_id, mine), status=201)


@login_required_json
@require_http_methods(["PATCH", "PUT", "DELETE"])
def case_detail(request, case_id):
    try:
        case = _user_case(request.user, case_id)
    except CasePlan.DoesNotExist:
        return JsonResponse({"error": "Case not found."}, status=404)

    if request.method == "DELETE":
        case.delete()
        return JsonResponse({"ok": True})

    data = _json_body(request)
    options_by_id = _options_map()
    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return JsonResponse({"error": "Name is required."}, status=400)
        case.name = name
    if "period_weeks" in data:
        case.period_weeks = _period_weeks(data.get("period_weeks"), case.period_weeks)
    if "slots" in data:
        case.slots = normalize_case_slots(
            data.get("slots") or [], options_by_id, case.period_weeks
        )
    else:
        case.slots = normalize_case_slots(case.slots, options_by_id, case.period_weeks)
    case.save()
    cases, mine = _case_rating_maps(request.user)
    case = cases.get(pk=case.id)
    return JsonResponse(_case_json(case, options_by_id, mine))


@login_required_json
@require_http_methods(["PUT", "POST", "DELETE"])
def case_rate(request, case_id):
    try:
        case = _user_case(request.user, case_id)
    except CasePlan.DoesNotExist:
        return JsonResponse({"error": "Case not found."}, status=404)

    if request.method == "DELETE":
        CaseRating.objects.filter(user=request.user, case=case).delete()
    else:
        data = _json_body(request)
        try:
            score = Decimal(str(data.get("score")))
        except (InvalidOperation, TypeError):
            return JsonResponse({"error": "Score must be 0 to 5 in half-stars."}, status=400)
        if score not in VALID_SCORES:
            return JsonResponse({"error": "Score must be 0 to 5 in half-stars."}, status=400)
        CaseRating.objects.update_or_create(
            user=request.user,
            case=case,
            defaults={"score": score},
        )

    options_by_id = _options_map()
    cases, mine = _case_rating_maps(request.user)
    case = cases.get(pk=case_id)
    return JsonResponse(_case_json(case, options_by_id, mine))


@ensure_csrf_cookie
def spa_index(request, path=None):
    index = settings.FRONTEND_DIST / "index.html"
    if not index.exists():
        return JsonResponse(
            {
                "error": "Frontend is not built yet. Run npm install && npm run build in the frontend folder."
            },
            status=503,
        )
    return FileResponse(index.open("rb"), content_type="text/html")


def spa_assets(request, path):
    asset = settings.FRONTEND_DIST / "assets" / path
    if not asset.exists() or not asset.is_file():
        raise Http404("Asset not found")
    return FileResponse(asset.open("rb"))
