from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("guides", "0004_caseplan_owner_period_caserating"),
    ]

    operations = [
        migrations.AddField(
            model_name="completionoption",
            name="event_type",
            field=models.CharField(default="mysterious_sale", max_length=40),
        ),
    ]
