import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def backfill_case_periods(apps, schema_editor):
    CasePlan = apps.get_model("guides", "CasePlan")
    for case in CasePlan.objects.all():
        total = 0
        for slot in case.slots or []:
            try:
                total += int(slot.get("weeks") or 0)
            except (TypeError, ValueError):
                continue
        case.period_weeks = total if total > 0 else 6
        case.save(update_fields=["period_weeks"])


class Migration(migrations.Migration):

    dependencies = [
        ("guides", "0003_completionoption_floor_12_discount"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="cases_initialized",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="caseplan",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="case_plans",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="caseplan",
            name="period_weeks",
            field=models.IntegerField(default=6),
        ),
        migrations.CreateModel(
            name="CaseRating",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("score", models.DecimalField(decimal_places=1, max_digits=2)),
                (
                    "case",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ratings",
                        to="guides.caseplan",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="case_ratings",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-id"],
                "unique_together": {("user", "case")},
            },
        ),
        migrations.RunPython(backfill_case_periods, migrations.RunPython.noop),
    ]
