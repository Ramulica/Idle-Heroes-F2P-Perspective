from django.conf import settings
from django.db import models


class GameMeta(models.Model):
    floors = models.JSONField(default=list)
    sg_table = models.JSONField(default=list)
    notes = models.JSONField(default=list)

    class Meta:
        verbose_name = "game meta"


class CompletionOption(models.Model):
    name = models.CharField(max_length=80)
    floors = models.JSONField(default=dict)
    floor_12_discount = models.BooleanField(default=False)
    total_cost = models.IntegerField(default=0)
    sg_cost = models.IntegerField(default=0)
    reward_counts = models.JSONField(default=dict)
    sort_order = models.IntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="completion_options",
    )

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.name


class OptionRating(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="option_ratings",
    )
    option = models.ForeignKey(
        CompletionOption,
        on_delete=models.CASCADE,
        related_name="ratings",
    )
    score = models.DecimalField(max_digits=2, decimal_places=1)

    class Meta:
        unique_together = ("user", "option")
        ordering = ["-id"]


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    sg_calculator = models.JSONField(default=dict, blank=True)
    cases_initialized = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username


class CasePlan(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="case_plans",
    )
    name = models.CharField(max_length=120)
    slots = models.JSONField(default=list)
    period_weeks = models.IntegerField(default=6)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.name


class CaseRating(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="case_ratings",
    )
    case = models.ForeignKey(
        CasePlan,
        on_delete=models.CASCADE,
        related_name="ratings",
    )
    score = models.DecimalField(max_digits=2, decimal_places=1)

    class Meta:
        unique_together = ("user", "case")
        ordering = ["-id"]


class EventPreview(models.Model):
    event_number = models.CharField(max_length=40, blank=True)
    date = models.DateField(null=True, blank=True)
    name = models.CharField(max_length=200)
    resource_type = models.CharField(max_length=80, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["-date", "-id"]

    def __str__(self):
        return self.name
