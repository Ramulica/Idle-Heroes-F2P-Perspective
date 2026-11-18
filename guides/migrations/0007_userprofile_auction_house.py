from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("guides", "0006_userprofile_stat_calculator"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="auction_house",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
