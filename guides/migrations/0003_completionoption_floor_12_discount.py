from django.db import migrations, models


def backfill_floor_12_discount(apps, schema_editor):
    CompletionOption = apps.get_model("guides", "CompletionOption")
    for option in CompletionOption.objects.all():
        floors = option.floors or {}
        option.floor_12_discount = bool(floors.get("12") or floors.get(12))
        option.save(update_fields=["floor_12_discount"])


def undo_floor_12_discount(apps, schema_editor):
    CompletionOption = apps.get_model("guides", "CompletionOption")
    CompletionOption.objects.update(floor_12_discount=False)


class Migration(migrations.Migration):

    dependencies = [
        ("guides", "0002_completionoption_created_by_userprofile_optionrating"),
    ]

    operations = [
        migrations.AddField(
            model_name="completionoption",
            name="floor_12_discount",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(backfill_floor_12_discount, undo_floor_12_discount),
    ]
