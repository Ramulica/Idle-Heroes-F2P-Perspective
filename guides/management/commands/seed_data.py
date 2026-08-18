from django.core.management.base import BaseCommand

from guides.models import CasePlan, CompletionOption, EventPreview, GameMeta
from guides.services import compute_option_stats
import json
from pathlib import Path


class Command(BaseCommand):
    help = "Load Mysterious Sale seed data from Excel export JSON."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing community data before seeding.",
        )

    def handle(self, *args, **options):
        seed_path = Path(__file__).resolve().parents[2] / "data" / "seed.json"
        seed = json.loads(seed_path.read_text(encoding="utf-8"))

        if options["reset"]:
            CasePlan.objects.all().delete()
            CompletionOption.objects.all().delete()
            EventPreview.objects.all().delete()
            GameMeta.objects.all().delete()

        meta, _ = GameMeta.objects.get_or_create(pk=1)
        meta.floors = seed["floors"]
        meta.sg_table = seed["sg_table"]
        meta.notes = seed["notes"]
        meta.save()

        if CompletionOption.objects.exists():
            renamed = 0
            for old, new in seed.get("renames", {}).items():
                renamed += CompletionOption.objects.filter(name=old).update(name=new)
            self.stdout.write("Options already exist; skipped option/case seed.")
            if renamed:
                self.stdout.write(self.style.SUCCESS(f"Renamed {renamed} completion options."))
            if not EventPreview.objects.exists():
                self._seed_events(seed["events"])
            return

        created = []
        for row in seed["options"]:
            total, sg_cost, counts = compute_option_stats(
                row["floors"],
                seed["floors"],
                seed["sg_table"],
                bool(row["floors"].get("12")),
            )
            created.append(
                CompletionOption.objects.create(
                    name=row["name"],
                    floors=row["floors"],
                    floor_12_discount=bool(row["floors"].get("12")),
                    total_cost=total,
                    sg_cost=sg_cost,
                    reward_counts=counts,
                    sort_order=row["sort_order"],
                )
            )

        by_name = {opt.name: opt for opt in created}
        for row in seed["cases"]:
            slots = []
            for slot in row["slots"]:
                option = by_name.get(slot["option_name"])
                if option:
                    slots.append({"option_id": option.id, "weeks": slot["weeks"]})
            CasePlan.objects.create(
                name=row["name"],
                slots=slots,
                period_weeks=max(sum(slot["weeks"] for slot in slots), 6),
                sort_order=row["sort_order"],
            )

        self._seed_events(seed["events"])
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(created)} options and community cases."))

    def _seed_events(self, events):
        EventPreview.objects.all().delete()
        for row in events:
            EventPreview.objects.create(
                event_number=row.get("event_number") or "",
                date=row.get("date") or None,
                name=row.get("name") or "",
                resource_type=row.get("resource_type") or "",
                sort_order=row.get("sort_order") or 0,
            )
